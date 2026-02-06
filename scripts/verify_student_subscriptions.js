const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const db = new Database(dbPath);

console.log("=== Student Dashboard Product Fetch Verification ===\n");

// Get a sample student
const student = db.prepare("SELECT id, name FROM users WHERE role = 'student' LIMIT 1").get();
if (!student) {
    console.log("No students found in database.");
    process.exit(0);
}
console.log(`Student: ${student.name} (${student.id})\n`);

// Fetch student subscriptions using correct table names
const subscriptions = db.prepare(`
  SELECT s.id AS subscriptionId, s.packageId, p.name AS productName, s.status
  FROM subscriptions s
  LEFT JOIN subscription_packages p ON CAST(p.id AS TEXT) = s.packageId
  WHERE s.userId = ?
`).all(student.id);

console.log("=== Student Subscriptions ===");
if (subscriptions.length === 0) {
  console.log("No subscriptions found for this student.\n");
} else {
  subscriptions.forEach(s => {
    console.log(`  Product: ${s.productName || '(unknown)'}`);
    console.log(`    PackageId: ${s.packageId}`);
    console.log(`    Status: ${s.status}`);
    console.log('');
  });
}

// Fetch tests per product for this student
console.log("=== Tests visible to student (by productId) ===");
const allProducts = db.prepare("SELECT id, name FROM subscription_packages").all();
allProducts.forEach(p => {
  const pidStr = String(p.id);
  const tests = db.prepare(`
    SELECT testId, userId, productId, createdAt
    FROM tests
    WHERE userId = ? AND (productId = ? OR packageId = ?)
  `).all(student.id, pidStr, pidStr);
  
  console.log(`  Product: ${p.name} (${p.id})`);
  console.log(`    Tests: ${tests.length}`);
  if (tests.length > 0 && tests.length <= 5) {
    tests.forEach(t => console.log(`      - ${t.testId} (${t.createdAt})`));
  }
  console.log('');
});

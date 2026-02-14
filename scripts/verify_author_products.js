const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const db = new Database(dbPath);

console.log("=== Author Product Verification ===\n");

// Fetch all products (subscription_packages table)
const products = db.prepare("SELECT id, name, description FROM subscription_packages").all();

if (products.length === 0) {
  console.log("No products found. Author page may not be creating products properly.");
} else {
  console.log(`Found ${products.length} products:\n`);
  products.forEach(p => {
    console.log(`  Product: ${p.name}`);
    console.log(`    ID: ${p.id}`);
    console.log(`    Description: ${p.description || '(none)'}`);
    console.log('');
  });
}

// Check tests linked to products
console.log("\n=== Tests linked to Products ===\n");
const tests = db.prepare("SELECT testId, userId, productId, packageId, createdAt FROM tests LIMIT 20").all();

if (tests.length === 0) {
  console.log("No tests found in database.");
} else {
  console.log(`Found ${tests.length} tests (showing first 20):\n`);
  tests.forEach(t => {
    console.log(`  Test: ${t.testId}`);
    console.log(`    User: ${t.userId}`);
    console.log(`    ProductId: ${t.productId || '(null)'}`);
    console.log(`    PackageId: ${t.packageId || '(null)'}`);
    console.log(`    Created: ${t.createdAt}`);
    console.log('');
  });
}

// Summary: Check for tests without productId
const orphanedTests = db.prepare("SELECT COUNT(*) as count FROM tests WHERE productId IS NULL").get();
console.log(`\n=== Summary ===`);
console.log(`Tests without productId: ${orphanedTests.count}`);
console.log(`Total products: ${products.length}`);

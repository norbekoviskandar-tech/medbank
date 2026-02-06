const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const database = new Database(dbPath);

// Get a sample student
const students = database.prepare("SELECT id, name FROM users WHERE role = 'student' LIMIT 1").all();
if (students.length === 0) {
    console.log("No students found in database.");
    process.exit(0);
}

const studentId = students[0].id;
console.log(`Testing product isolation for student: ${students[0].name} (${studentId})\n`);

// Get available products
const products = database.prepare("SELECT id, name FROM subscription_packages LIMIT 3").all();
console.log("Available Products:", products.map(p => `${p.id}: ${p.name}`).join(", "), "\n");

// Fetch results by product using the view
products.forEach(product => {
    const results = database.prepare(`
        SELECT *
        FROM student_answers_per_product
        WHERE studentId = ? AND productId = ?
    `).all(studentId, String(product.id));
    
    console.log(`Product ${product.id} (${product.name}) results: ${results.length} answers`);
});

// Also check tests per product
console.log("\n--- Tests per Product ---");
products.forEach(product => {
    const tests = database.prepare(`
        SELECT testId, createdAt, productId
        FROM tests
        WHERE userId = ? AND (productId = ? OR packageId = ?)
    `).all(studentId, String(product.id), String(product.id));
    
    console.log(`Product ${product.id}: ${tests.length} tests`);
});

console.log("\nProduct isolation verification complete.");

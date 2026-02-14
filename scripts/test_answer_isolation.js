const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const db = new Database(dbPath);

console.log('=== Per-Product Answer Isolation Test ===\n');

// Get a sample student
const student = db.prepare("SELECT id, name FROM users WHERE role = 'student' LIMIT 1").get();
if (!student) {
    console.log("No students found.");
    process.exit(0);
}
console.log(`Student: ${student.name} (${student.id})\n`);

// Get available products
const products = db.prepare("SELECT id, name FROM subscription_packages LIMIT 3").all();
console.log('Products:');
products.forEach(p => console.log(`  - ${p.id}: ${p.name}`));
console.log('');

// Fetch results by product using the view
console.log('--- Answer Isolation Results ---');
products.forEach(product => {
    const results = db.prepare(`
        SELECT *
        FROM student_answers_per_product
        WHERE studentId = ? AND productId = ?
    `).all(student.id, String(product.id));
    
    console.log(`Product ${product.id} (${product.name}): ${results.length} answers`);
    if (results.length > 0 && results.length <= 3) {
        results.forEach(r => console.log(`    Q: ${r.questionId}, A: ${r.answer}, Correct: ${r.isCorrect}`));
    }
});

console.log('\n=== Verification Complete ===');

const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const db = new Database(dbPath);

console.log('Verifying Product Isolation Schema (Simplified)...');

// 1. Check Tests Table
try {
    const testsInfo = db.prepare("PRAGMA table_info(tests)").all();
    console.log('Tests Table Columns:', JSON.stringify(testsInfo.map(c => c.name)));
    const productIdCol = testsInfo.find(c => c.name === 'productId');
    if (productIdCol) {
        console.log('PASS: tests table has productId column.');
    } else {
        console.error('FAIL: tests table missing productId column.');
    }
} catch (e) {
    console.error('FAIL checking table schema:', e.message);
}

// 2. Insert Test (Minimal)
const testId = 'verify-test-min-' + Date.now();
const userId = 'verify-user-1';
const productId = '999';

// Ensure user
try {
   db.prepare("INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)").run(userId, 'Verifier', 'verify@test.com', 'hash', 'student', new Date().toISOString());
   console.log('PASS: Ensured dummy user.');
} catch(e) { console.error('FAIL creating user:', e.message); }

try {
    db.prepare(`
      INSERT INTO tests (
        testId, userId, questions, createdAt, date, productId
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(testId, userId, '[]', new Date().toISOString(), new Date().toISOString(), productId);
    console.log('PASS: Inserted test with productId.');
} catch (e) {
    console.log('FAIL_INSERT_TEST: ' + e.message + ' Code: ' + e.code);
}

// 3. Test Answer Insertion
const answerId = 'ans-' + Date.now();
try {
    db.prepare(`
        INSERT INTO student_answers (id, studentId, testId, productId, questionId, answer, isCorrect)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(answerId, userId, testId, productId, 'q1', 'A', 1);
    console.log('PASS: Inserted student_answer linked to test and product.');
} catch (e) {
    console.log('FAIL_INSERT_ANSWER: ' + e.message);
}

// Clean up
try {
    db.prepare('DELETE FROM student_answers WHERE id = ?').run(answerId);
    db.prepare('DELETE FROM tests WHERE testId = ?').run(testId);
    console.log('Cleaned up verification data.');
} catch (e) {}

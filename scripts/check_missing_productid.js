const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const database = new Database(dbPath);

console.log('Checking for missing productId values...');

// Check tests without productId
const missingTests = database
  .prepare("SELECT testId, userId FROM tests WHERE productId IS NULL")
  .all();
console.log("Tests missing productId:", missingTests.length, "records");
if (missingTests.length > 0 && missingTests.length <= 10) {
  console.log(missingTests);
}

// Check student answers without productId
try {
  const missingAnswers = database
    .prepare("SELECT id, testId, studentId FROM student_answers WHERE productId IS NULL")
    .all();
  console.log("Student answers missing productId:", missingAnswers.length, "records");
  if (missingAnswers.length > 0 && missingAnswers.length <= 10) {
    console.log(missingAnswers);
  }
} catch (e) {
  console.log("student_answers table check:", e.message);
}

// Summary
const totalTests = database.prepare("SELECT COUNT(*) as count FROM tests").get().count;
console.log("\nTotal tests in database:", totalTests);

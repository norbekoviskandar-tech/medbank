const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../medbank.db');
const db = new Database(dbPath);

console.log('Applying Manual Migrations...');

// 1. Add productId to tests
try {
  const info = db.prepare("PRAGMA table_info(tests)").all();
  if (!info.find(c => c.name === 'productId')) {
      db.exec("ALTER TABLE tests ADD COLUMN productId TEXT");
      console.log("Added productId to tests.");
  } else {
      console.log("tests.productId already exists.");
  }
} catch(e) {
    console.error("Error migrating tests:", e.message);
}

// 2. Add student_answers table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_answers (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      testId TEXT NOT NULL,
      productId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      answer TEXT,
      isCorrect INTEGER,
      answeredAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES users(id),
      FOREIGN KEY (testId) REFERENCES tests(testId)
    );
  `);
  console.log("Ensured student_answers table.");
} catch(e) {
    console.error("Error creating student_answers:", e.message);
}

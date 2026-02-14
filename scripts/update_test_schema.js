const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/lib/server-db.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Updating server-db.js schema...');

// 1. Update tests table definition (add productId)
// We look for the standard tests table definition pattern
const testsStart = "CREATE TABLE IF NOT EXISTS tests (";
const testsEnd = "FOREIGN KEY (userId) REFERENCES users(id)\n    )\n  `);";

const testsStartIndex = content.indexOf(testsStart);
if (testsStartIndex !== -1) {
    // Find the end of this specific block
    const testsEndIndex = content.indexOf(testsEnd, testsStartIndex);
    
    if (testsEndIndex !== -1) {
        console.log('Found tests table definition.');
        // Construct new tests table body
        const newTestsBody = `
    CREATE TABLE IF NOT EXISTS tests (
      testId TEXT PRIMARY KEY,
      testNumber INTEGER,
      userId TEXT NOT NULL,
      mode TEXT,
      pool TEXT, -- JSON of all eligible IDs at creation
      questions TEXT NOT NULL, -- JSON array of selected IDs
      answers TEXT DEFAULT '{}',
      firstAnswers TEXT DEFAULT '{}',
      markedIds TEXT DEFAULT '[]',
      currentIndex INTEGER DEFAULT 0,
      elapsedTime INTEGER DEFAULT 0,
      isSuspended INTEGER DEFAULT 0,
      packageId TEXT,
      productId TEXT, -- NEW: strict product isolation
      createdAt TEXT NOT NULL,
      date TEXT NOT NULL,

      -- NEW: Exam Runtime Engine
      sessionState TEXT DEFAULT '{}', -- Full JSON state (history, strikes, logs)
      
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  \`);`;
        
        // Replace ONLY if we are sure (ignoring the exact middle content which might verify)
        // I'll replace the text from start to end marker + suffix
        // Note: testsEnd includes "`);"
        
        // Actually, let's just use the markers I found in the file view to be safe
        const oldBlock = content.slice(testsStartIndex, testsEndIndex + testsEnd.length);
        
        // We replace oldBlock with newTestsBody (minus the initial newline if needed)
        content = content.replace(oldBlock, newTestsBody.trim());
        console.log('Updated tests table schema.');
    } else {
        console.error('Could not find end of tests table block.');
    }
} else {
    console.error('Could not find start of tests table block.');
}

// 2. Insert student_answers table
if (!content.includes('CREATE TABLE IF NOT EXISTS student_answers')) {
    const insertMarker = "// Migrate tests table";
    const insertPoint = content.indexOf(insertMarker);
    
    if (insertPoint !== -1) {
        const saBlock = `
  // Student Answers (Per-product isolation)
  database.exec(\`
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
  \`);

  `;
        content = content.slice(0, insertPoint) + saBlock + content.slice(insertPoint);
        console.log('Inserted student_answers table.');
    } else {
        console.error('Could not find insertion point for student_answers.');
    }
} else {
    console.log('student_answers table already exists.');
}

// 3. Add productId to migration list
// Original: { name: 'packageName', type: 'TEXT' }
// We want to add productId after it.
const migrationStr = "{ name: 'packageName', type: 'TEXT' }";
if (content.indexOf(migrationStr) !== -1 && !content.includes("{ name: 'productId', type: 'TEXT' }")) {
    const newMigrationStr = `{ name: 'packageName', type: 'TEXT' },
    { name: 'productId', type: 'TEXT' }`;
    content = content.replace(migrationStr, newMigrationStr);
    console.log('Added productId to migration list.');
} else {
    console.log('Migration list already updated or not found.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');

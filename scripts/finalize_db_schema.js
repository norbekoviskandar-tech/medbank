const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/lib/server-db.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Finalizing server-db.js...');

// 1. Append addStudentAnswer if not exists
if (!content.includes('export function addStudentAnswer')) {
    const newFunc = `
export function addStudentAnswer({ userId, testId, productId, questionId, answer, isCorrect }) {
  const db = getDb();
  const id = crypto.randomUUID();
  try {
      db.prepare(\`
        INSERT INTO student_answers (id, studentId, testId, productId, questionId, answer, isCorrect)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      \`).run(id, userId, testId, productId, questionId, answer, isCorrect ? 1 : 0);
      return true;
  } catch (e) {
      console.error('Error adding student answer:', e);
      return false;
  }
}
`;
    content += newFunc;
    console.log('Appended addStudentAnswer.');
} else {
    console.log('addStudentAnswer already exists.');
}

// 2. Fix saveTest
// We'll regex replace the entire function again, but be more careful.
// Regex for saveTest block
// Matches "export function saveTest(test) {" ... until ... "return test; }"
// We assume standard formatting or just use a logic that counts braces if regex is hard.
// But earlier failure suggested we couldn't even find "export function saveTest(test) {".
// Maybe there's a space? "saveTest (test)"?
// I'll search for "function saveTest"

const saveTestHeader = /export function saveTest\s*\(test\)\s*\{/;
const match = content.match(saveTestHeader);

if (match) {
    const startIndex = match.index;
    // Find matching brace
    let braceCount = 0;
    let endIndex = -1;
    let foundStart = false;
    
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            foundStart = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        
        if (foundStart && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }
    
    if (endIndex !== -1) {
        // We found the block
        console.log(`Replacing saveTest block (${startIndex}-${endIndex})`);
        
        const newSaveTest = `export function saveTest(test) {
  if (!test.packageId) {
    throw new Error('Database Error: packageId is required for saving or updating a test.');
  }
  const db = getDb();
  
  const existing = db.prepare('SELECT * FROM tests WHERE testId = ?').get(test.testId);
  
  if (existing) {
    db.prepare(\`
      UPDATE tests SET
        questions = ?, answers = ?, firstAnswers = ?, markedIds = ?,
        currentIndex = ?, elapsedTime = ?, isSuspended = ?, date = ?, 
        packageId = ?, packageName = ?, productId = ?,
        universeSize = ?, eligiblePoolSize = ?, poolLogic = ?,
        sessionState = ?
      WHERE testId = ?
    \`).run(
      JSON.stringify(test.questions),
      JSON.stringify(test.answers || {}),
      JSON.stringify(test.firstAnswers || {}),
      JSON.stringify(test.markedIds || []),
      test.currentIndex || 0,
      test.elapsedTime || 0,
      test.isSuspended ? 1 : 0,
      test.date || new Date().toISOString(),
      test.packageId || null,
      test.packageName || null,
      test.productId || test.packageId || null, 
      test.universeSize || existing.universeSize,
      test.eligiblePoolSize || existing.eligiblePoolSize,
      JSON.stringify(test.poolLogic || {}),
      JSON.stringify(test.sessionState || {}),
      test.testId
    );
  } else {
    db.prepare(\`
      INSERT INTO tests (
        testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, 
        markedIds, currentIndex, elapsedTime, isSuspended, createdAt, date, 
        packageId, packageName, productId, universeSize, eligiblePoolSize, poolLogic, sessionState
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`).run(
      test.testId,
      test.testNumber || 1,
      test.userId,
      test.mode || 'tutor',
      JSON.stringify(test.pool || []),
      JSON.stringify(test.questions),
      JSON.stringify(test.answers || {}),
      JSON.stringify(test.firstAnswers || {}),
      JSON.stringify(test.markedIds || []),
      test.currentIndex || 0,
      test.elapsedTime || 0,
      test.isSuspended ? 1 : 0,
      new Date().toISOString(),
      test.date || new Date().toISOString(),
      test.packageId || null,
      test.packageName || null,
      test.productId || test.packageId || null,
      test.universeSize || 0,
      test.eligiblePoolSize || 0,
      JSON.stringify(test.poolLogic || {}),
      JSON.stringify(test.sessionState || {})
    );
  }
  return test;
}`;
        content = content.slice(0, startIndex) + newSaveTest + content.slice(endIndex);
        console.log('Updated saveTest function body.');
    } else {
        console.error('Could not find closing brace for saveTest');
    }
} else {
    console.warn('Could not find saveTest function header regex.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');

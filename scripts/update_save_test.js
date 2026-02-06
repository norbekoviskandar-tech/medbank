const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/lib/server-db.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Updating saveTest in server-db.js...');

// We need to replace two parts: the UPDATE SQL and the INSERT SQL
// UPDATE SQL
const updateSqlRegex = /UPDATE tests SET[\s\S]*?WHERE testId = \?/;
const newUpdateSql = `UPDATE tests SET
        questions = ?, answers = ?, firstAnswers = ?, markedIds = ?,
        currentIndex = ?, elapsedTime = ?, isSuspended = ?, date = ?, 
        packageId = ?, packageName = ?, productId = ?,
        universeSize = ?, eligiblePoolSize = ?, poolLogic = ?,
        sessionState = ?
      WHERE testId = ?`;

// INSERT SQL
const insertSqlRegex = /INSERT INTO tests \([\s\S]*?\)[\s\S]*?VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/;
const newInsertSql = `INSERT INTO tests (
        testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, 
        markedIds, currentIndex, elapsedTime, isSuspended, createdAt, date, 
        packageId, packageName, productId, universeSize, eligiblePoolSize, poolLogic, sessionState
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// We also need to update the .run() arguments for both.
// This is harder with regex because of the variable arguments.
// Instead, let's identify the whole function block if possible.
// Or just replace the specific .run(...) blocks?

// Let's replace the whole saveTest function body using known markers.
const saveTestStart = "export function saveTest(test) {";
const saveTestEnd = "return test;\n}";

const startIndex = content.indexOf(saveTestStart);
const endIndex = content.indexOf(saveTestEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    // We found the function. Let's just rewrite it completely.
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
      test.productId || test.packageId || null, // Ensure productId is saved
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
      test.productId || test.packageId || null, // Map packageId to productId if missing
      test.universeSize || 0,
      test.eligiblePoolSize || 0,
      JSON.stringify(test.poolLogic || {}),
      JSON.stringify(test.sessionState || {})
    );
  }
  return test;
}`;
    
    // Replace logic:
    // We need to be careful about what we replace.
    // The "endIndex" points to "return test;\n}", but we want to include the closing brace?
    // saveTestEnd = "return test;\n}";
    // So content.substring(startIndex, endIndex + saveTestEnd.length)
    
    // BUT! The original code has "  return test;\n}" (indentation).
    // Let's use get-content verify to be sure, or just be loose with the end match.
    // The `saveTest` works on `server-db.js` lines 1075-1141.
    
    // Let's try to match exactly what we saw in view_file.
    const oldBlock = content.slice(startIndex, endIndex + saveTestEnd.length + 10); // +10 for safety/newlines
    // Actually, finding the matching closing brace is safer.
    
    // Let's assume the standard indentation `  return test;\n}`
    const endMarker = "  return test;\n}";
    const realEndIndex = content.indexOf(endMarker, startIndex);
    
    if (realEndIndex !== -1) {
        const fullOldBlock = content.slice(startIndex, realEndIndex + endMarker.length);
        content = content.replace(fullOldBlock, newSaveTest);
        console.log('Updated saveTest function.');
        fs.writeFileSync(filePath, content, 'utf8');
    } else {
        console.error('Could not find exact end of saveTest function.');
        // Fallback: Use lines 1075 to 1141 logic if we can trust line numbers? No.
    }
    
} else {
    console.error('Could not find saveTest function start.');
}

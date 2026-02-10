const path = require('path');
const { getDb } = require(path.join(__dirname, '..', 'src', 'lib', 'server-db.js'));
const db = getDb();

const DEFAULT_PRODUCT_ID = '8054';

console.log(`--- Moving Orphaned/Misassigned Questions to Product ${DEFAULT_PRODUCT_ID} ---`);

// 1. Reassign questions with invalid product IDs
const result = db.prepare(`
    UPDATE questions 
    SET productId = ?, packageId = ?
    WHERE productId NOT IN ('8053', '8054') 
       OR productId IS NULL 
       OR packageId NOT IN ('8053', '8054')
       OR packageId IS NULL
       OR productId LIKE '%.%'
       OR packageId LIKE '%.%'
`).run(DEFAULT_PRODUCT_ID, DEFAULT_PRODUCT_ID);

console.log(`✅ Moved ${result.changes} questions to Product ${DEFAULT_PRODUCT_ID}`);

// 2. Also ensure question_concepts are updated for consistency
const conceptResult = db.prepare(`
    UPDATE question_concepts
    SET productId = ?, packageId = ?
    WHERE productId NOT IN ('8053', '8054')
       OR productId IS NULL
       OR packageId NOT IN ('8053', '8054')
       OR packageId IS NULL
`).run(DEFAULT_PRODUCT_ID, DEFAULT_PRODUCT_ID);

console.log(`✅ Updated ${conceptResult.changes} concepts to Product ${DEFAULT_PRODUCT_ID}`);

// 3. Verify counts again
const stats = db.prepare(`SELECT productId, COUNT(*) as c FROM questions GROUP BY productId`).all();
console.log('\n--- New Statistics ---');
stats.forEach(s => console.log(`PID:${s.productId} CNT:${s.c}`));

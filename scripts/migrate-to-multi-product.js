const Database = require('better-sqlite3');
const db = new Database('medbank.db');

console.log('Starting migration to multi-product architecture...');

// 1. Ensure Standard QBank product exists
let standardProduct = db.prepare("SELECT * FROM subscription_packages WHERE name = 'Standard QBank'").get();
if (!standardProduct) {
    console.log('Creating Standard QBank product...');
    const now = new Date().toISOString();
    const config = JSON.stringify({
        columns: ["system", "difficulty", "tags"],
        modes: ["timed", "tutor"],
        blocks: 40,
        negativeMarking: false
    });
    const info = db.prepare("INSERT INTO subscription_packages (name, duration_days, price, description, createdAt, is_published, defaultCreateTestConfig) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        'Standard QBank',
        9999,
        0,
        'Universal access to the master clinical question pool.',
        now,
        1,
        config
    );
    standardProduct = { id: info.lastInsertRowid, name: 'Standard QBank' };
    console.log('Created Standard QBank with ID:', standardProduct.id);
} else {
    console.log('Standard QBank already exists with ID:', standardProduct.id);
}

// 2. Attach orphaned questions to Standard QBank
const qUpdate = db.prepare("UPDATE questions SET packageId = ? WHERE packageId IS NULL OR packageId = '' OR packageId = 'default'").run(standardProduct.id);
console.log(`Updated ${qUpdate.changes} questions to belong to Standard QBank.`);

// 3. Attach orphaned tests to Standard QBank
const tUpdate = db.prepare("UPDATE tests SET packageId = ? WHERE packageId IS NULL OR packageId = '' OR packageId = 'default'").run(standardProduct.id);
console.log(`Updated ${tUpdate.changes} tests to belong to Standard QBank.`);

// 4. Attach orphaned user_questions progress to Standard QBank
const uqUpdate = db.prepare("UPDATE user_questions SET packageId = ? WHERE packageId IS NULL OR packageId = '' OR packageId = 'default'").run(standardProduct.id);
console.log(`Updated ${uqUpdate.changes} user progress records to belong to Standard QBank.`);

// 5. Unify all tests' packageName
db.prepare("UPDATE tests SET packageName = ? WHERE packageId = ?").run(standardProduct.name, standardProduct.id);

console.log('Migration complete.');
db.close();

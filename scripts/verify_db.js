const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../medbank.db'));

console.log('Verifying Subscriptions Table...');

// 1. Check Schema
const cols = db.prepare("PRAGMA table_info(subscriptions)").all();
console.log('Columns:', cols.map(c => c.name).join(', '));

// 2. Check Data & Join
const subs = db.prepare(`
    SELECT s.*, p.name as productName
    FROM subscriptions s
    LEFT JOIN subscription_packages p ON s.packageId = CAST(p.id AS TEXT)
    LIMIT 5
`).all();

console.log('Sample Subscription with Join:');
console.log(JSON.stringify(subs, null, 2));

if (subs.length > 0 && !subs[0].productName && subs[0].packageId) {
    console.warn('WARNING: productName is null but packageId is present. Check Join condition.');
}

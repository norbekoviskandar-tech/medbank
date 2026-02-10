const path = require('path');
const { getDb } = require(path.join(__dirname, '..', 'src', 'lib', 'server-db.js'));
const db = getDb();

const edited = db.prepare(`
    SELECT q.id, q.stem, q.productId, q.packageId, q.updatedAt, q.createdAt, p.name as productName
    FROM questions q
    LEFT JOIN products p ON q.productId = p.id
    WHERE q.updatedAt > q.createdAt
    ORDER BY q.updatedAt DESC
`).all();

console.log('--- Edited Questions ---');
edited.forEach(q => {
    console.log(`ID: ${q.id} | Product: ${q.productName || 'None'} (${q.productId}) | Updated: ${q.updatedAt}`);
    console.log(`Stem: ${q.stem.substring(0, 50)}...`);
    console.log('------------------------');
});

const products = db.prepare("SELECT id, name FROM products WHERE isDeleted = 0").all();
console.log('\n--- Available Products ---');
products.forEach(p => console.log(`ID: ${p.id} | Name: ${p.name}`));

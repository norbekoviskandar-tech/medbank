const path = require('path');
const { getDb } = require(path.join(__dirname, '..', 'src', 'lib', 'server-db.js'));
const db = getDb();

const stats = db.prepare(`
    SELECT productId, packageId, COUNT(*) as count
    FROM questions
    GROUP BY productId, packageId
`).all();

console.log('--- Question Statistics by Product ---');
stats.forEach(s => {
    console.log(`productId: ${s.productId} | packageId: ${s.packageId} | Count: ${s.count}`);
});

const products = db.prepare("SELECT id, name FROM products WHERE isDeleted = 0").all();
console.log('\n--- Available Products ---');
products.forEach(p => console.log(`ID: ${p.id} | Name: ${p.name}`));

const path = require('path');
const { getDb } = require(path.join(__dirname, '..', 'src', 'lib', 'server-db.js'));
const db = getDb();

const stats = db.prepare(`SELECT productId, COUNT(*) as c FROM questions GROUP BY productId`).all();
const products = db.prepare(`SELECT id, name FROM products`).all();

console.log('STATS:');
stats.forEach(s => console.log(`PID:${s.productId} CNT:${s.c}`));

console.log('PRODUCTS:');
products.forEach(p => console.log(`ID:${p.id} NM:${p.name}`));

// Check recently edited questions and their products
const path = require('path');
const projectRoot = path.join(__dirname, '..');
const { getDb } = require(path.join(projectRoot, 'src', 'lib', 'server-db.js'));

function showEditedQuestions() {
  const db = getDb();
  
  console.log('\n=== Recently Edited Questions ===\n');
  
  // Get all products first
  const products = db.prepare(`
    SELECT id, name, isActive 
    FROM products 
    WHERE isDeleted = 0
    ORDER BY id
  `).all();
  
  console.log('Available Products:');
  products.forEach(p => {
    console.log(`  ${p.isActive ? '✅' : '⚠️ '} Product ${p.id}: ${p.name}`);
  });
  console.log('');
  
  // Get recently edited questions
  const questions = db.prepare(`
    SELECT 
      q.id,
      q.stem,
      q.packageId,
      q.productId,
      q.system,
      q.subject,
      q.topic,
      q.status,
      q.createdAt,
      q.updatedAt,
      p.name as productName
    FROM questions q
    LEFT JOIN products p ON q.productId = p.id OR q.packageId = p.id
    WHERE q.updatedAt IS NOT NULL
    ORDER BY q.updatedAt DESC
    LIMIT 15
  `).all();
  
  console.log(`\nRecently Edited Questions (showing ${questions.length}):\n`);
  
  const productGroups = {};
  
  questions.forEach((q, i) => {
    const productKey = q.productId || q.packageId || 'orphaned';
    if (!productGroups[productKey]) {
      productGroups[productKey] = [];
    }
    productGroups[productKey].push(q);
  });
  
  Object.keys(productGroups).forEach(productKey => {
    const qs = productGroups[productKey];
    const productName = qs[0].productName || 'ORPHANED';
    
    console.log(`\n📦 Product: ${productName} (ID: ${productKey})`);
    console.log(`   ${qs.length} edited question(s)\n`);
    
    qs.forEach((q, i) => {
      const updated = q.updatedAt ? new Date(q.updatedAt) : null;
      const created = q.createdAt ? new Date(q.createdAt) : null;
      const wasEdited = updated && created && updated > created;
      
      console.log(`   ${i + 1}. Question: ${q.id.substring(0, 8)}...`);
      console.log(`      Stem: ${q.stem?.substring(0, 60)}...`);
      console.log(`      System: ${q.system}, Subject: ${q.subject}`);
      console.log(`      Status: ${q.status}`);
      console.log(`      Created: ${created ? created.toLocaleString() : 'N/A'}`);
      console.log(`      Updated: ${updated ? updated.toLocaleString() : 'N/A'}`);
      console.log(`      ${wasEdited ? '✏️  EDITED' : '🆕 NEW'}`);
      console.log('');
    });
  });
  
  // Show navigation URLs
  console.log('\n=== Access Question Manager ===\n');
  
  products.forEach(p => {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM questions 
      WHERE (productId = ? OR packageId = ?)
    `).get(p.id, p.id).count;
    
    if (count > 0) {
      console.log(`Product: ${p.name}`);
      console.log(`  Questions: ${count}`);
      console.log(`  URL: http://localhost:3000/author/manage-questions?packageId=${p.id}`);
      console.log('');
    }
  });
}

showEditedQuestions();

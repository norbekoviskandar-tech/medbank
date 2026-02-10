// Recovery script - Restore orphaned questions to their products
const path = require('path');
const projectRoot = path.join(__dirname, '..');
const { getDb } = require(path.join(projectRoot, 'src', 'lib', 'server-db.js'));

function recoverOrphanedQuestions() {
  const db = getDb();
  
  console.log('\n=== Question Recovery Tool ===\n');
  
  // Find orphaned questions
  const orphaned = db.prepare(`
    SELECT 
      id, 
      stem,
      system,
      subject,
      topic,
      conceptId,
      createdAt
    FROM questions 
    WHERE (packageId IS NULL OR packageId = '') 
      AND (productId IS NULL OR productId = '')
  `).all();
  
  if (orphaned.length === 0) {
    console.log('✅ No orphaned questions found. Nothing to recover.\n');
    return;
  }
  
  console.log(`Found ${orphaned.length} orphaned questions. Starting recovery...\n`);
  
  let recovered = 0;
  let failed = 0;
  
  const updateStmt = db.prepare(`
    UPDATE questions 
    SET packageId = ?, productId = ?
    WHERE id = ?
  `);
  
  orphaned.forEach((q, i) => {
    console.log(`\n[${i + 1}/${orphaned.length}] Processing: ${q.id}`);
    
    // Strategy 1: Try to recover from conceptId
    if (q.conceptId) {
      const concept = db.prepare(`
        SELECT packageId, productId 
        FROM question_concepts 
        WHERE id = ?
      `).get(q.conceptId);
      
      if (concept && (concept.packageId || concept.productId)) {
        const productId = concept.productId || concept.packageId;
        updateStmt.run(productId, productId, q.id);
        console.log(`  ✅ Recovered via conceptId → Product ${productId}`);
        recovered++;
        return;
      }
    }
    
    // Strategy 2: Try to find matching product by system/subject
    if (q.system && q.subject) {
      const product = db.prepare(`
        SELECT id 
        FROM products 
        WHERE isActive = 1 
        AND isDeleted = 0
        LIMIT 1
      `).get();
      
      if (product) {
        updateStmt.run(product.id, product.id, q.id);
        console.log(`  ⚠️  Recovered via default product → Product ${product.id}`);
        console.log(`     (Manual verification recommended)`);
        recovered++;
        return;
      }
    }
    
    console.log(`  ❌ Could not recover - no matching product found`);
    failed++;
  });
  
  console.log('\n=== Recovery Summary ===');
  console.log(`Total orphaned: ${orphaned.length}`);
  console.log(`✅ Recovered: ${recovered}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (recovered > 0) {
    console.log('\n💡 Recovered questions are now linked to products.');
    console.log('Please verify they appear correctly in the Manage Questions page.');
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Some questions could not be automatically recovered.');
    console.log('These may need manual reassignment through the author portal.');
  }
}

// Run recovery
recoverOrphanedQuestions();

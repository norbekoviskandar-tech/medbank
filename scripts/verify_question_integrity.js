// Verification script - Check a question's relational fields
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const projectRoot = path.join(__dirname, '..');
  const serverDbUrl = pathToFileURL(path.join(projectRoot, 'src', 'lib', 'server-db.js')).href;
  const dbModule = await import(serverDbUrl);
  const { getDb } = dbModule;

  function verifyQuestionIntegrity() {
    const db = getDb();
    
    console.log('\n=== Question Integrity Verification ===\n');
    
    // Get all questions with their product info
    const questions = db.prepare(`
      SELECT 
        q.id, 
        q.stem,
        q.packageId, 
        q.productId, 
        q.conceptId,
        q.system,
        q.subject,
        q.topic,
        p.name as productName
      FROM questions q
      LEFT JOIN products p ON q.productId = p.id OR q.packageId = p.id
      ORDER BY q.createdAt DESC
      LIMIT 10
    `).all();
    
    console.log(`Found ${questions.length} recent questions:\n`);
    
    let orphanedCount = 0;
    questions.forEach((q, i) => {
      const isOrphaned = !q.packageId && !q.productId;
      const status = isOrphaned ? '❌' : '✅';
      
      console.log(`${status} Question ${i + 1}:`);
      console.log(`   ID: ${q.id.substring(0, 8)}...`);
      console.log(`   Product: ${q.productName || 'ORPHANED'}`);
      console.log(`   packageId: ${q.packageId || 'NULL'}`);
      console.log(`   productId: ${q.productId || 'NULL'}`);
      console.log(`   conceptId: ${q.conceptId || 'NULL'}`);
      console.log(`   Stem: ${q.stem?.substring(0, 60)}...`);
      console.log('');
      
      if (isOrphaned) orphanedCount++;
    });
    
    if (orphanedCount > 0) {
      console.log(`\n⚠️  Warning: ${orphanedCount} orphaned questions found (missing product links)`);
    } else {
      console.log('\n✅ All questions are properly linked to products!');
    }
    
    // Check for any questions with NULL conceptId
    const nullConceptCount = db.prepare(`
      SELECT COUNT(*) as count FROM questions WHERE conceptId IS NULL
    `).get().count;
    
    if (nullConceptCount > 0) {
      console.log(`⚠️  ${nullConceptCount} questions have NULL conceptId`);
    }
  }

  verifyQuestionIntegrity();

})().catch(err => { console.error(err); process.exit(1); });

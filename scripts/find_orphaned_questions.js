// Find and analyze orphaned questions (questions that lost their product link)
const path = require('path');
const projectRoot = path.join(__dirname, '..');
const { getDb } = require(path.join(projectRoot, 'src', 'lib', 'server-db.js'));

function findOrphanedQuestions() {
  const db = getDb();
  
  console.log('\n=== Searching for Orphaned Questions ===\n');
  
  // Find questions with NULL productId AND packageId
  const orphaned = db.prepare(`
    SELECT 
      id, 
      stem,
      system,
      subject,
      topic,
      packageId, 
      productId, 
      conceptId,
      status,
      createdAt,
      updatedAt
    FROM questions 
    WHERE (packageId IS NULL OR packageId = '') 
      AND (productId IS NULL OR productId = '')
    ORDER BY updatedAt DESC
  `).all();
  
  console.log(`Found ${orphaned.length} orphaned questions\n`);
  
  if (orphaned.length === 0) {
    console.log('✅ Great news! No orphaned questions found.');
    console.log('All questions are properly linked to products.\n');
    return;
  }
  
  console.log('⚠️  The following questions have lost their product association:\n');
  
  orphaned.forEach((q, i) => {
    console.log(`${i + 1}. Question ID: ${q.id}`);
    console.log(`   Stem: ${q.stem?.substring(0, 80)}...`);
    console.log(`   System: ${q.system || 'N/A'}`);
    console.log(`   Subject: ${q.subject || 'N/A'}`);
    console.log(`   Topic: ${q.topic || 'N/A'}`);
    console.log(`   Status: ${q.status || 'draft'}`);
    console.log(`   Created: ${q.createdAt ? new Date(q.createdAt).toLocaleString() : 'N/A'}`);
    console.log(`   Updated: ${q.updatedAt ? new Date(q.updatedAt).toLocaleString() : 'N/A'}`);
    console.log(`   ConceptId: ${q.conceptId || 'NULL'}`);
    console.log('');
  });
  
  // Try to find potential matches based on conceptId
  console.log('\n=== Attempting Recovery ===\n');
  
  const concepts = db.prepare(`
    SELECT id, packageId, productId, system, subject, topic
    FROM question_concepts
  `).all();
  
  const conceptMap = {};
  concepts.forEach(c => {
    conceptMap[c.id] = c;
  });
  
  let recoverable = 0;
  
  orphaned.forEach((q, i) => {
    if (q.conceptId && conceptMap[q.conceptId]) {
      const concept = conceptMap[q.conceptId];
      console.log(`✅ Question ${i + 1} can be recovered!`);
      console.log(`   ConceptId: ${q.conceptId}`);
      console.log(`   Should link to packageId: ${concept.packageId || concept.productId}`);
      console.log('');
      recoverable++;
    }
  });
  
  if (recoverable > 0) {
    console.log(`\n📊 Summary:`);
    console.log(`   Total orphaned: ${orphaned.length}`);
    console.log(`   Recoverable: ${recoverable}`);
    console.log(`   Unrecoverable: ${orphaned.length - recoverable}`);
    console.log('\n💡 Run the recovery script to fix recoverable questions.');
  } else {
    console.log('⚠️  No automatic recovery possible.');
    console.log('These questions may need manual reassignment to products.');
  }
}

findOrphanedQuestions();

// Test script to verify question update preserves relational fields
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const projectRoot = path.join(__dirname, '..');
  const serverDbUrl = pathToFileURL(path.join(projectRoot, 'src', 'lib', 'server-db.js')).href;
  const dbModule = await import(serverDbUrl);
  const { getDb, getQuestionById, updateQuestion } = dbModule;

  async function testQuestionUpdate() {
    const db = getDb();
    
    console.log('\n=== Testing Question Update Logic ===\n');
    
    // Get a sample question
    const questions = db.prepare('SELECT * FROM questions LIMIT 1').all();
    
    if (questions.length === 0) {
      console.log('❌ No questions found in database');
      return;
    }
    
    const testQuestion = questions[0];
    console.log('✅ Found test question:', {
      id: testQuestion.id,
      packageId: testQuestion.packageId,
      productId: testQuestion.productId,
      conceptId: testQuestion.conceptId,
      system: testQuestion.system,
      subject: testQuestion.subject,
      topic: testQuestion.topic
    });
    
    // Create an update object that might accidentally null out relational fields
    const updatePayload = {
      id: testQuestion.id,
      stem: 'UPDATED: ' + testQuestion.stem,
      system: testQuestion.system,
      subject: testQuestion.subject,
      topic: testQuestion.topic,
      // Note: NOT including packageId, productId, conceptId
      // to simulate what might happen during an edit
    };
    
    console.log('\n📦 Simulating update with payload:', Object.keys(updatePayload));
    
    try {
      const updated = updateQuestion(testQuestion.id, updatePayload);
      
      console.log('\n✅ Update completed. Checking relational fields...');
      console.log('  packageId:', testQuestion.packageId, '→', updated.packageId);
      console.log('  productId:', testQuestion.productId, '→', updated.productId);
      console.log('  conceptId:', testQuestion.conceptId, '→', updated.conceptId);
      console.log('  subject:', testQuestion.subject, '→', updated.subject);
      
      // Verify relational fields are preserved
      if (updated.packageId === testQuestion.packageId && 
          updated.productId === testQuestion.productId &&
          updated.conceptId === testQuestion.conceptId) {
        console.log('\n✅ SUCCESS: All relational fields preserved!');
      } else {
        console.log('\n❌ FAILURE: Relational fields were lost!');
      }
      
      // Verify content fields were updated
      if (updated.stem.startsWith('UPDATED:')) {
        console.log('✅ Content field (stem) was updated as expected');
      } else {
        console.log('❌ Content field was not updated');
      }
      
    } catch (err) {
      console.error('\n❌ Error during update:', err.message);
    }
  }

  testQuestionUpdate().catch(console.error);

})().catch(err => { console.error(err); process.exit(1); });

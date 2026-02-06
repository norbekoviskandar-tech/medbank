const Database = require('better-sqlite3');
const path = require('path');

function findDbPath() {
  const cwdPath = path.join(process.cwd(), 'medbank.db');
  if (require('fs').existsSync(cwdPath)) return cwdPath;
  const upPath = path.join(process.cwd(), '..', 'medbank.db');
  if (require('fs').existsSync(upPath)) return upPath;
  return cwdPath;
}

const DB_PATH = findDbPath();
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('🔧 Starting legacy question repair...');

// Repair missing product bindings
const productRepair = db.prepare("UPDATE questions SET packageId = '14' WHERE packageId IS NULL OR packageId = ''").run();
console.log(`✅ Updated ${productRepair.changes} questions with missing packageId`);

// Repair missing published state
const publishedRepair = db.prepare("UPDATE questions SET published = 1 WHERE published IS NULL OR published != 1").run();
console.log(`✅ Updated ${publishedRepair.changes} questions to published=1`);

// Repair missing system/subject/topic
const systemRepair = db.prepare("UPDATE questions SET system = 'General' WHERE system IS NULL OR system = ''").run();
console.log(`✅ Updated ${systemRepair.changes} questions with missing system`);

const subjectRepair = db.prepare("UPDATE questions SET subject = 'General' WHERE subject IS NULL OR subject = ''").run();
console.log(`✅ Updated ${subjectRepair.changes} questions with missing subject`);

const topicRepair = db.prepare("UPDATE questions SET topic = 'Mixed' WHERE topic IS NULL OR topic = ''").run();
console.log(`✅ Updated ${topicRepair.changes} questions with missing topic`);

// Log repaired rows for verification
const repaired = db.prepare(`
  SELECT id, stem, packageId, system, subject, topic 
  FROM questions 
  WHERE (system = 'General' OR subject = 'General' OR topic = 'Mixed')
  LIMIT 10
`).all();

console.log('\n📋 Sample repaired rows:');
repaired.forEach(row => {
  console.log(`  ID: ${row.id} | Package: ${row.packageId} | System: ${row.system} | Subject: ${row.subject} | Topic: ${row.topic}`);
});

console.log('\n🎉 Legacy repair complete!');
db.close();

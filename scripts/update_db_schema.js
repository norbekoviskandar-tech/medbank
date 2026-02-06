const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/server-db.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

const startMarker = "// NEW: Standardized Subscription Registry";
const endMarker = "// Indexes for Performance and Governance";

const startIndex = fileContent.indexOf(startMarker);
const endIndex = fileContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find start or end markers');
    console.log('Start found:', startIndex !== -1);
    console.log('End found:', endIndex !== -1);
    process.exit(1);
}

const before = fileContent.substring(0, startIndex);
const after = fileContent.substring(endIndex);

const newBlock = `
  // --- START: Standardized Subscription Registry (Multi-subscription support) ---

  // Migration: Rename old table if exists
  const tableCheck = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_subscriptions'")
    .get();

  if (tableCheck) {
    try {
      database.exec(\`ALTER TABLE user_subscriptions RENAME TO subscriptions;\`);
      console.log('Renamed user_subscriptions to subscriptions');

      // Rename purchaseDate if needed
      const subCols = database.prepare("PRAGMA table_info(subscriptions)").all().map(c => c.name);
      if (subCols.includes('createdAt') && !subCols.includes('purchaseDate')) {
        database.exec(\`ALTER TABLE subscriptions RENAME COLUMN createdAt TO purchaseDate;\`);
        console.log('Renamed subscriptions.createdAt to purchaseDate');
      }
    } catch (e) {
      console.warn('Migration warning:', e.message);
    }
  }

  // Ensure subscriptions table exists
  database.exec(\`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      packageId TEXT,
      productName TEXT,
      durationDays INTEGER NOT NULL,
      amount REAL DEFAULT 0,
      startDate TEXT,
      expiresAt TEXT,
      status TEXT DEFAULT 'pending'
    );
  \`);

  // Add packageId column if it doesn't exist
  const columnExists = database
    .prepare("PRAGMA table_info(subscriptions);")
    .all()
    .some(col => col.name === "packageId");

  if (!columnExists) {
    database.exec(\`ALTER TABLE subscriptions ADD COLUMN packageId TEXT;\`);
    console.log("Column packageId added to subscriptions table.");
  } else {
    console.log("Column packageId already exists.");
  }

  // Optional: check type of packageId for safety
  const subInfo = database.prepare("PRAGMA table_info(subscriptions)").all();
  const pkgIdCol = subInfo.find(c => c.name === 'packageId');
  if (pkgIdCol && pkgIdCol.type.toUpperCase() === 'INTEGER') {
    console.warn('Subscriptions.packageId is INTEGER, treating as TEXT in code.');
  }

  // --- END: Subscription Registry ---

`;

const newContent = before + newBlock + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated server-db.js');

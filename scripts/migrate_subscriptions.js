const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../medbank.db');
const db = new Database(dbPath);

console.log('Running migration on:', dbPath);

try {
    // Step 1: Handling Rename
    console.log('Step 1: Checking tables...');
    
    // Check state
    const subsExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'").get();
    const subsOldExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions_old'").get();
    
    console.log(`State: subscriptions=${!!subsExists}, subscriptions_old=${!!subsOldExists}`);

    if (subsExists && !subsOldExists) {
        console.log('Renaming subscriptions to subscriptions_old...');
        db.prepare('ALTER TABLE subscriptions RENAME TO subscriptions_old').run();
    } else if (subsExists && subsOldExists) {
        console.log('Both tables exist. Assuming partial migration. Dropping "subscriptions" (new) to recreate.');
        db.prepare('DROP TABLE subscriptions').run();
    } else if (!subsExists && !subsOldExists) {
        console.warn('Neither table exists! Creating fresh subscriptions table only.');
    } else {
        console.log('Only subscriptions_old exists. Proceeding to creation.');
    }

    // Step 2: Create New Table
    console.log('Step 2: Creating new table...');
    const createSql = `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          userId TEXT,
          packageId TEXT,
          status TEXT,
          expiresAt TEXT,
          purchaseDate TEXT,
          amount REAL,
          durationDays INTEGER
        )
    `;
    console.log('Running:', createSql);
    db.prepare(createSql).run();

    // Step 3: Copy Data
    const subsOldCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions_old'").get();
    if (subsOldCheck) {
        console.log('Step 3: Copying data...');
        const oldCols = db.prepare("PRAGMA table_info(subscriptions_old)").all().map(c => c.name);
        console.log('Old Columns:', JSON.stringify(oldCols));

        const pkgId = oldCols.includes('packageId') ? 'packageId' : 'NULL';
        const purDate = oldCols.includes('purchaseDate') ? 'purchaseDate' : (oldCols.includes('createdAt') ? 'createdAt' : 'NULL');
        const amt = oldCols.includes('amount') ? 'amount' : '0';
        
        let dur = '90'; // Default
        if (oldCols.includes('durationDays')) dur = 'durationDays';
        else if (oldCols.includes('duration')) dur = 'duration';

        const insertSql = `
            INSERT INTO subscriptions (id, userId, packageId, status, expiresAt, purchaseDate, amount, durationDays)
            SELECT id, userId, ${pkgId}, status, expiresAt, ${purDate}, ${amt}, ${dur}
            FROM subscriptions_old
        `;
        
        console.log('Running INSERT SQL:', insertSql);
        
        try {
            const info = db.prepare(insertSql).run();
            console.log('Insert Result:', info);
        } catch (e) {
            console.error('Insert Failed:', e.message);
            // Don't throw, let's see if we can continue or if this is critical
            throw e; 
        }

        // Step 4: Drop Old
        console.log('Step 4: Dropping subscriptions_old...');
        db.prepare('DROP TABLE subscriptions_old').run();
    } else {
        console.log('Skipping data copy (no old table).');
    }

    console.log('Migration Complete.');

} catch (e) {
    console.error('CRITICAL FAILURE:', e);
}

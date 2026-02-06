const fs = require('fs');
const db = require('better-sqlite3')('medbank.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
fs.writeFileSync('tables.txt', tables.map(t => t.name).join('\n'));

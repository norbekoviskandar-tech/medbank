import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Database file path - stored in project root
const findDbPath = () => {
    // Priority 1: Current working directory
    const cwdPath = path.join(process.cwd(), 'medbank.db');
    if (fs.existsSync(cwdPath)) return cwdPath;
    
    // Priority 2: One level up (if running from src or app)
    const upPath = path.join(process.cwd(), '..', 'medbank.db');
    if (fs.existsSync(upPath)) return upPath;
    
    // Default to root
    return cwdPath;
};

export const DB_PATH = findDbPath();

let db = null;

export function getDb() {
  if (!db) {
    console.log('DB: Opening database at:', DB_PATH);
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    seedDemoUsers();
    console.log('DB: Connection established and schemas verified');
  }
  return db;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Global safe JSON parser for DB fields
const safeParse = (str, fallback) => {
  if (!str) return fallback;
  try {
    let parsed = JSON.parse(str);
    // Handle double-stringified JSON which sometimes happens in SQLite with JSON columns
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return parsed;
  } catch (e) {
    return fallback;
  }
};

function seedDemoUsers() {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (userCount === 0) {
    console.log('Seeding demo users...');
    const adminId = 'cc06b8c9-76e9-4e78-be75-2d4e9d722de8'; // Consistent UUIDs
    const studentId = 'cc06b8c9-76e9-4e78-be75-2d4e9d722de9';
    const iskandarId = 'd80c2827-f876-4755-9b1f-c2a6e54e8231';

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, role, subscriptionStatus, createdAt, subscriptionDuration, productName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(adminId, 'Admin', 'admin@medbank.local', hashPassword('admin123'), 'admin', 'active', new Date().toISOString(), 365, 'Admin Access');
    stmt.run(studentId, 'Student', 'student@medbank.local', hashPassword('student123'), 'student', 'trial', new Date().toISOString(), 3, 'Free Trial');
    stmt.run(iskandarId, 'Iskandar', 'e@medbank.local', hashPassword('student123'), 'student', 'trial', new Date().toISOString(), 3, 'Free Trial');
    console.log('Demo users seeded');
  }

  // Independent Seed for subscription_packages
  try {
    const packageCount = db.prepare('SELECT COUNT(*) as count FROM subscription_packages').get().count;
    if (packageCount === 0) {
      console.log('Seeding subscription packages...');
      const stmt = db.prepare('INSERT INTO subscription_packages (name, duration_days, price, description, createdAt) VALUES (?, ?, ?, ?, ?)');
      stmt.run('90-Day QBank Subscription', 90, 49.99, 'Full access to medical QBank for 90 days.', new Date().toISOString());
      stmt.run('180-Day QBank Subscription', 180, 89.99, 'Full access to medical QBank for 180 days.', new Date().toISOString());
      stmt.run('365-Day QBank Subscription', 365, 149.99, 'Full access to medical QBank for 365 days.', new Date().toISOString());
      console.log('Subscription packages seeded');
    }
  } catch (err) {
    console.error('Error seeding subscription packages:', err.message);
  }
}

function initializeSchema() {
  const database = db;

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      subscriptionStatus TEXT DEFAULT 'trial',
      purchased INTEGER DEFAULT 0,
      activatedByPurchase INTEGER DEFAULT 0,
      hasPendingPurchase INTEGER DEFAULT 0,
      trialUsed INTEGER DEFAULT 0,
      activatedAt TEXT,
      expiresAt TEXT,
      lastRenewedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      isBanned INTEGER DEFAULT 0,
      stats TEXT DEFAULT '{"attempted":0,"correct":0,"tests":0}',
      pendingDuration INTEGER DEFAULT 0,
      subscriptionDuration INTEGER DEFAULT 0,
      productName TEXT
    )
  `);

  // Migrate users table for existing databases (add new columns if missing)
  const userColumnsToAdd = [
    { name: 'pendingDuration', type: 'INTEGER DEFAULT 0' },
    { name: 'subscriptionDuration', type: 'INTEGER DEFAULT 0' },
    { name: 'productName', type: 'TEXT' },
    { name: 'purchasedProducts', type: "TEXT DEFAULT '[]'" }
  ];
  const existingUserCols = database.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  for (const col of userColumnsToAdd) {
    if (!existingUserCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column ${col.name} to users table`);
      } catch (err) {
        console.warn(`Could not add column ${col.name} to users:`, err.message);
      }
    }
  }

  // Questions table (global library) - Expanded for Authoring
  database.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      stem TEXT NOT NULL,
      stemImage TEXT DEFAULT '{}',
      choices TEXT NOT NULL,
      correct TEXT NOT NULL,
      explanation TEXT,
      explanationCorrect TEXT,
      explanationCorrectImage TEXT DEFAULT '{}',
      explanationWrong TEXT,
      explanationWrongImage TEXT DEFAULT '{}',
      summary TEXT,
      summaryImage TEXT DEFAULT '{}',
      subject TEXT,
      system TEXT,
      topic TEXT,
      difficulty TEXT DEFAULT 'medium',
      cognitiveLevel TEXT DEFAULT 'understanding',
      type TEXT DEFAULT 'multiple-choice',
      published INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      "references" TEXT,
      tags TEXT DEFAULT '[]',
      version INTEGER DEFAULT 1,
      stemImageMode TEXT DEFAULT 'auto',
      explanationImageMode TEXT DEFAULT 'auto',
      packageId TEXT,
      productId TEXT,
      conceptId TEXT, -- Link to eternal Question Concept
      status TEXT DEFAULT 'draft', -- draft, published, archived, deprecated
      versionNumber INTEGER DEFAULT 1,
      isLatest INTEGER DEFAULT 1,
      globalAttempts INTEGER DEFAULT 0,
      globalCorrect INTEGER DEFAULT 0,
      choiceDistribution TEXT DEFAULT '{}',
      totalTimeSpent INTEGER DEFAULT 0, -- Total seconds across all users
      totalVolatility INTEGER DEFAULT 0, -- Total answer changes across all users
      totalStrikes INTEGER DEFAULT 0,
      totalMarks INTEGER DEFAULT 0
    )
  `);

  // Migrate questions table for existing databases
  const questionColumnsToAdd = [
    { name: 'explanationCorrect', type: 'TEXT' },
    { name: 'explanationWrong', type: 'TEXT' },
    { name: 'summary', type: 'TEXT' },
    { name: 'explanationCorrectImage', type: "TEXT DEFAULT '{}'" },
    { name: 'explanationWrongImage', type: "TEXT DEFAULT '{}'" },
    { name: 'summaryImage', type: "TEXT DEFAULT '{}'" },
    { name: 'stemImageMode', type: "TEXT DEFAULT 'auto'" },
    { name: 'explanationImageMode', type: "TEXT DEFAULT 'auto'" },
    { name: 'difficulty', type: "TEXT DEFAULT 'medium'" },
    { name: 'cognitiveLevel', type: "TEXT DEFAULT 'understanding'" },
    { name: 'type', type: "TEXT DEFAULT 'multiple-choice'" },
    { name: 'versionNumber', type: 'INTEGER DEFAULT 1' },
    { name: 'isLatest', type: 'INTEGER DEFAULT 1' },
    { name: 'conceptId', type: 'TEXT' },
    { name: 'status', type: "TEXT DEFAULT 'published'" }
  ];
  const existingQuestionCols = database.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
  for (const col of questionColumnsToAdd) {
    if (!existingQuestionCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE questions ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column ${col.name} to questions table`);
      } catch (err) {
        console.warn(`Could not add column ${col.name} to questions:`, err.message);
      }
    }
  }

  // NEW: Question Concepts Table (The eternal learning objective)
  database.exec(`
    CREATE TABLE IF NOT EXISTS question_concepts (
      id TEXT PRIMARY KEY,
      packageId TEXT,
      productId TEXT,
      system TEXT,
      subject TEXT,
      topic TEXT,
      tags TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Migrate schema for existing databases (idempotent addition of new columns)
  const columnsToAdd = [
    { name: 'stemImage', type: 'TEXT DEFAULT "{}"' },
    { name: 'explanationCorrect', type: 'TEXT' },
    { name: 'explanationCorrectImage', type: 'TEXT DEFAULT "{}"' },
    { name: 'explanationWrong', type: 'TEXT' },
    { name: 'explanationWrongImage', type: 'TEXT DEFAULT "{}"' },
    { name: 'summary', type: 'TEXT' },
    { name: 'summaryImage', type: 'TEXT DEFAULT "{}"' },
    { name: 'topic', type: 'TEXT' },
    { name: 'cognitiveLevel', type: 'TEXT DEFAULT "understanding"' },
    { name: 'type', type: 'TEXT DEFAULT "multiple-choice"' },
    { name: 'references', type: 'TEXT' },
    { name: 'tags', type: 'TEXT DEFAULT "[]"' },
    { name: 'version', type: 'INTEGER DEFAULT 1' },
    { name: 'stemImageMode', type: 'TEXT DEFAULT "auto"' },
    { name: 'explanationImageMode', type: 'TEXT DEFAULT "auto"' },
    { name: 'packageId', type: 'TEXT' },
    { name: 'productId', type: 'TEXT' }
  ];

  const existingCols = database.prepare("PRAGMA table_info(questions)").all().map(c => c.name);
  for (const col of columnsToAdd) {
    if (!existingCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE questions ADD COLUMN "${col.name}" ${col.type}`);
        console.log(`Added column ${col.name} to questions table`);
      } catch (err) {
        console.warn(`Could not add column ${col.name}:`, err.message);
      }
    }
  }

  // Lifecycle & Versioning columns
  const lifecycleCols = [
      { name: 'conceptId', type: 'TEXT' },
      { name: 'status', type: "TEXT DEFAULT 'draft'" },
      { name: 'versionNumber', type: 'INTEGER DEFAULT 1' },
      { name: 'isLatest', type: 'INTEGER DEFAULT 1' },
      { name: 'globalAttempts', type: 'INTEGER DEFAULT 0' },
      { name: 'globalCorrect', type: 'INTEGER DEFAULT 0' },
      { name: 'choiceDistribution', type: "TEXT DEFAULT '{}'" },
      { name: 'totalTimeSpent', type: 'INTEGER DEFAULT 0' },
      { name: 'totalVolatility', type: 'INTEGER DEFAULT 0' },
      { name: 'totalStrikes', type: 'INTEGER DEFAULT 0' },
      { name: 'totalMarks', type: 'INTEGER DEFAULT 0' }
  ];
  for (const col of lifecycleCols) {
      if (!existingCols.includes(col.name)) {
          database.exec(`ALTER TABLE questions ADD COLUMN ${col.name} ${col.type}`);
      }
  }

  // ONE-TIME MIGRATION: Bind existing questions to concepts
  const unlinkedCount = database.prepare("SELECT COUNT(*) as count FROM questions WHERE conceptId IS NULL").get().count;
  if (unlinkedCount > 0) {
      console.log(`MIGRATION: Linking ${unlinkedCount} questions to parent concepts...`);
      const questions = database.prepare("SELECT id, packageId, system, subject, topic, tags, createdAt, published FROM questions WHERE conceptId IS NULL").all();
      
      const insertConcept = database.prepare(`
          INSERT INTO question_concepts (id, packageId, system, subject, topic, tags, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const updateVersion = database.prepare(`
          UPDATE questions SET conceptId = ?, status = ?, versionNumber = ?, isLatest = 1 WHERE id = ?
      `);

      database.transaction(() => {
          for (const q of questions) {
              const conceptId = `concept_${q.id}`; // Stable legacy mapping
              insertConcept.run(conceptId, q.packageId, q.system, q.subject, q.topic, q.tags, q.createdAt);
              updateVersion.run(conceptId, q.published ? 'published' : 'draft', 1, q.id);
          }
      })();
      console.log("MIGRATION: Concept mapping complete.");
  }

  // User question progress (per-user stats for each question)
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      packageId TEXT,
      productId TEXT,
      status TEXT, -- NULL (in-progress), 'correct', 'incorrect', 'omitted'
      isMarked INTEGER DEFAULT 0,
      userAnswer TEXT,
      userHistory TEXT DEFAULT '[]',

      -- NEW: Usage-State Logic (Professional QBank Semantics)
      firstResponse TEXT,       -- Frozen at first attempt
      firstIsCorrect INTEGER,   -- Frozen at first attempt
      totalAttempts INTEGER DEFAULT 0,
      timeSpent INTEGER DEFAULT 0,
      lastAnswer TEXT,
      lastSeenAt TEXT,
      updatedAt TEXT,
      lastUpdated TEXT,

      UNIQUE(userId, questionId, packageId, productId)
    )
  `);

  // Migrate user_questions table
  const uqCols = database.prepare("PRAGMA table_info(user_questions)").all().map(c => c.name);
  const uqColsToAdd = [
    { name: 'packageId', type: 'TEXT' },
    { name: 'totalAttempts', type: 'INTEGER DEFAULT 0' },
    { name: 'timeSpent', type: 'INTEGER DEFAULT 0' },
    { name: 'lastAnswer', type: 'TEXT' },
    { name: 'lastSeenAt', type: 'TEXT' },
    { name: 'updatedAt', type: 'TEXT' },
    { name: 'lastUpdated', type: 'TEXT' }
  ];
  for (const col of uqColsToAdd) {
    if (!uqCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE user_questions ADD COLUMN ${col.name} ${col.type}`);
      } catch(e) {
        console.warn(`Migration: Could not add ${col.name} to user_questions:`, e.message);
      }
    }
  }

  // Ensure productId exists in user_questions
  if (!uqCols.includes('productId')) {
    try { database.exec('ALTER TABLE user_questions ADD COLUMN productId TEXT'); } catch(e) {}
  }

  // Intelligence Engine: Student Cognition Profiles
  database.exec(`
    CREATE TABLE IF NOT EXISTS student_cognition_profiles (
      userId TEXT NOT NULL,
      packageId TEXT NOT NULL,
      readinessScore REAL DEFAULT 0,
      overthinkingIndex REAL DEFAULT 0,
      impulsivityIndex REAL DEFAULT 0,
      fatigueFactor REAL DEFAULT 0,
      systemPerformance TEXT DEFAULT '{}',
      topWeaknessConcepts TEXT DEFAULT '[]',
      updatedAt TEXT,
      PRIMARY KEY (userId, packageId),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Intelligence Engine: Calibrated Item Intelligence
  database.exec(`
    CREATE TABLE IF NOT EXISTS calibrated_item_intelligence (
      questionId TEXT PRIMARY KEY,
      trapOption TEXT,
      confusionIndex REAL DEFAULT 0,
      misleadingSignal INTEGER DEFAULT 0,
      updatedAt TEXT,
      FOREIGN KEY (questionId) REFERENCES questions(id)
    )
  `);

  // Intelligence Engine: Calibrated Item Intelligence
  database.exec(`
    CREATE TABLE IF NOT EXISTS calibrated_item_intelligence (
      questionId TEXT PRIMARY KEY,
      trapOption TEXT,
      confusionIndex REAL DEFAULT 0,
      misleadingSignal INTEGER DEFAULT 0,
      updatedAt TEXT,
      FOREIGN KEY (questionId) REFERENCES questions(id)
    )
  `);

  // Tests table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tests (
      testId TEXT PRIMARY KEY,
      testNumber INTEGER,
      userId TEXT NOT NULL,
      mode TEXT,
      pool TEXT, -- JSON of all eligible IDs at creation
      questions TEXT NOT NULL, -- JSON array of selected IDs
      answers TEXT DEFAULT '{}',
      firstAnswers TEXT DEFAULT '{}',
      markedIds TEXT DEFAULT '[]',
      currentIndex INTEGER DEFAULT 0,
      elapsedTime INTEGER DEFAULT 0,
      isSuspended INTEGER DEFAULT 0,
      packageId TEXT,
      createdAt TEXT NOT NULL,
      date TEXT NOT NULL,

      -- NEW: Exam Runtime Engine
      sessionState TEXT DEFAULT '{}', -- Full JSON state (history, strikes, logs)
      
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  
  // Student Answers (Per-product isolation)
  database.exec(`
    CREATE TABLE IF NOT EXISTS student_answers (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      testId TEXT NOT NULL,
      productId TEXT NOT NULL,
      packageId TEXT,
      questionId TEXT NOT NULL,
      answer TEXT,
      isCorrect INTEGER,
      answeredAt TEXT DEFAULT CURRENT_TIMESTAMP,
      answerData TEXT,
      submittedAt TEXT
    );
  `);

  // Migrate tests table
  const tCols = database.prepare("PRAGMA table_info(tests)").all().map(c => c.name);
  const tColsToAdd = [
    { name: 'universeSize', type: 'INTEGER' },
    { name: 'eligiblePoolSize', type: 'INTEGER' },
    { name: 'poolLogic', type: 'TEXT' },
    { name: 'sessionState', type: "TEXT DEFAULT '{}'" }
  ];
  for (const col of tColsToAdd) {
    if (!tCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE tests ADD COLUMN ${col.name} ${col.type}`);
      } catch(e) {
        console.warn(`Migration: Could not add ${col.name} to tests:`, e.message);
      }
    }
  }

  // Migrate tests table
  const testColsToAdd = [
    { name: 'packageId', type: 'TEXT' },
    { name: 'packageName', type: 'TEXT' },
    { name: 'productId', type: 'TEXT' }
  ];
  const existingTestCols = database.prepare("PRAGMA table_info(tests)").all().map(c => c.name);
  for (const col of testColsToAdd) {
    if (!existingTestCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE tests ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {}
    }
  }

  // Planner table
  database.exec(`
    CREATE TABLE IF NOT EXISTS planner (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      dueDate TEXT,
      completed INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Archive Tables for Data Retention & Restoration
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_questions_archive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      packageId TEXT,
      status TEXT,
      isMarked INTEGER,
      userAnswer TEXT,
      userHistory TEXT,
      archivedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tests_archive (
      testId TEXT PRIMARY KEY,
      testNumber INTEGER,
      userId TEXT NOT NULL,
      mode TEXT,
      pool TEXT,
      questions TEXT NOT NULL,
      answers TEXT,
      firstAnswers TEXT,
      markedIds TEXT,
      currentIndex INTEGER,
      elapsedTime INTEGER,
      isSuspended INTEGER,
      packageId TEXT,
      createdAt TEXT NOT NULL,
      date TEXT NOT NULL,
      archivedAt TEXT NOT NULL
    );
  `);

  // Migrate user_questions_archive
  const uqaCols = database.prepare("PRAGMA table_info(user_questions_archive)").all().map(c => c.name);
  if (!uqaCols.includes('packageId')) {
      try {
          database.exec(`ALTER TABLE user_questions_archive ADD COLUMN packageId TEXT`);
      } catch(e) {}
  }

  // Migrate tests_archive table
  const existingArchiveCols = database.prepare("PRAGMA table_info(tests_archive)").all().map(c => c.name);
  const archiveColsToAdd = [{ name: 'packageId', type: 'TEXT' }, { name: 'packageName', type: 'TEXT' }];
  for (const col of archiveColsToAdd) {
    if (!existingArchiveCols.includes(col.name)) {
        try {
            database.exec(`ALTER TABLE tests_archive ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) {}
    }
  }

  // Products table (The central offering)
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      is_published INTEGER DEFAULT 1,
      isDeleted INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      deletedAt TEXT,
      duration_days INTEGER DEFAULT 0,
      templateType TEXT DEFAULT 'DEFAULT',
      defaultCreateTestConfig TEXT DEFAULT '{}',
      systems TEXT DEFAULT '[]',
      subjects TEXT DEFAULT '[]',
      plans TEXT DEFAULT '[]'
    )
  `);

  // Migrate products table for existing databases
  const prodCols = database.prepare("PRAGMA table_info(products)").all().map(c => c.name);
  const prodColsToAdd = [
    { name: 'is_published', type: 'INTEGER DEFAULT 1' },
    { name: 'isDeleted', type: 'INTEGER DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT' },
    { name: 'templateType', type: "TEXT DEFAULT 'DEFAULT'" },
    { name: 'defaultCreateTestConfig', type: "TEXT DEFAULT '{}'" }
  ];
  for (const col of prodColsToAdd) {
    if (!prodCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) { }
    }
  }

  // Subscription Packages table - Multi-plan support
  database.exec(`
    CREATE TABLE IF NOT EXISTS subscription_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      systems TEXT DEFAULT '[]',
      subjects TEXT DEFAULT '[]',
      plans TEXT DEFAULT '[]',
      defaultCreateTestConfig TEXT,
      is_published INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `);

  // Migrate subscription_packages for custom systems/subjects/plans
  const packageColsToAdd = [
    { name: 'systems', type: "TEXT DEFAULT '[]'" },
    { name: 'subjects', type: "TEXT DEFAULT '[]'" },
    { name: 'plans', type: "TEXT DEFAULT '[]'" },
    { name: 'defaultCreateTestConfig', type: 'TEXT' }
  ];
  const existingPkgCols = database.prepare("PRAGMA table_info(subscription_packages)").all().map(c => c.name);
  for (const col of packageColsToAdd) {
    if (!existingPkgCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE subscription_packages ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column ${col.name} to subscription_packages table`);
      } catch (err) {
        console.warn(`Could not add column ${col.name} to subscription_packages:`, err.message);
      }
    }
  }


  // Notifications table
  database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'registration', 'purchase', 'alert'
      message TEXT NOT NULL,
      userId TEXT,
      metadata TEXT,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);

  // NEW: Governance History Table
  database.exec(`
    CREATE TABLE IF NOT EXISTS governance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      versionId TEXT NOT NULL,
      conceptId TEXT NOT NULL,
      fromState TEXT,
      toState TEXT NOT NULL,
      performedBy TEXT NOT NULL,
      performedAt TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (versionId) REFERENCES questions(id),
      FOREIGN KEY (conceptId) REFERENCES question_concepts(id)
    )
  `);

 
  // --- START: Standardized Subscription Registry (Multi-subscription support) ---

  // Migration: Rename old table if exists
  const tableCheck = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_subscriptions'")
    .get();

  if (tableCheck) {
    try {
      database.exec(`ALTER TABLE user_subscriptions RENAME TO subscriptions;`);
      console.log('Renamed user_subscriptions to subscriptions');

      // Rename purchaseDate if needed
      const subCols = database.prepare("PRAGMA table_info(subscriptions)").all().map(c => c.name);
      if (subCols.includes('createdAt') && !subCols.includes('purchaseDate')) {
        database.exec(`ALTER TABLE subscriptions RENAME COLUMN createdAt TO purchaseDate;`);
        console.log('Renamed subscriptions.createdAt to purchaseDate');
      }
    } catch (e) {
      console.warn('Migration warning:', e.message);
    }
  }

  // Ensure subscriptions table exists
  database.exec(`
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
  `);

  // Add packageId column if it doesn't exist
  const columnExists = database
    .prepare("PRAGMA table_info(subscriptions);")
    .all()
    .some(col => col.name === "packageId");

  if (!columnExists) {
    database.exec(`ALTER TABLE subscriptions ADD COLUMN packageId TEXT;`);
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

  // Add isDeleted column for soft delete functionality
  const productColsToAdd = [
    { name: 'isDeleted', type: 'INTEGER DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT' },
    { name: 'templateType', type: "TEXT DEFAULT 'DEFAULT'" }
  ];
  const existingProductCols = database.prepare("PRAGMA table_info(products)").all().map(c => c.name);
  for (const col of productColsToAdd) {
    if (!existingProductCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column ${col.name} to products table`);
      } catch (err) {
        console.warn(`Could not add column ${col.name} to products:`, err.message);
      }
    }
  }

  // Indexes for Performance and Governance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_questions_conceptId ON questions(conceptId);
    CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
    CREATE INDEX IF NOT EXISTS idx_questions_packageId ON questions(packageId);
    CREATE INDEX IF NOT EXISTS idx_questions_productId ON questions(productId);
    CREATE INDEX IF NOT EXISTS idx_governance_history_versionId ON governance_history(versionId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_packageId ON subscriptions(packageId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_productId ON subscriptions(productId);
    CREATE INDEX IF NOT EXISTS idx_tests_productId ON tests(productId);
    CREATE INDEX IF NOT EXISTS idx_tests_packageId ON tests(packageId);
    CREATE INDEX IF NOT EXISTS idx_student_answers_productId ON student_answers(productId);
  `);

  // NEW: Test Attempts (Per-session results snapshot)
  database.exec(`
    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      userId TEXT NOT NULL,
      testId TEXT, -- Link to original test session
      startedAt TEXT NOT NULL,
      finishedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Migrate test_attempts snapshot columns
  const taCols = database.prepare("PRAGMA table_info(test_attempts)").all().map(c => c.name);
  const taColsToAdd = [
    { name: 'questionIds', type: 'TEXT' },
    { name: 'markedIds', type: 'TEXT' },
    { name: 'timeSpent', type: 'TEXT' },
    { name: 'elapsedTime', type: 'INTEGER DEFAULT 0' },
    { name: 'questionSnapshots', type: 'TEXT' },
    { name: 'review_metadata', type: "TEXT DEFAULT '{}'" }
  ];
  for (const col of taColsToAdd) {
    if (!taCols.includes(col.name)) {
      try {
        database.exec(`ALTER TABLE test_attempts ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        console.warn(`Migration: Could not add ${col.name} to test_attempts:`, e.message);
      }
    }
  }

  // NEW: Test Answers (Detailed question-level breakdown for an attempt)
  database.exec(`
    CREATE TABLE IF NOT EXISTS test_answers (
      testAttemptId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      selectedOption TEXT,
      isCorrect INTEGER,
      isFlagged INTEGER,
      FOREIGN KEY (testAttemptId) REFERENCES test_attempts(id)
    )
  `);

  // Migrate test_answers for timeSpent tracking
  const ansCols = database.prepare("PRAGMA table_info(test_answers)").all().map(c => c.name);
  if (!ansCols.includes('correctOption')) {
    try {
      database.exec('ALTER TABLE test_answers ADD COLUMN correctOption TEXT');
    } catch (e) {
      console.warn('Migration: Could not add correctOption to test_answers:', e.message);
    }
  }
  if (!ansCols.includes('timeSpentSec')) {
    try {
      database.exec('ALTER TABLE test_answers ADD COLUMN timeSpentSec INTEGER DEFAULT 0');
    } catch (e) {
      console.warn('Migration: Could not add timeSpentSec to test_answers:', e.message);
    }
  }
  if (!ansCols.includes('timeSpentSec')) {
    try {
      database.exec('ALTER TABLE test_answers ADD COLUMN timeSpentSec INTEGER DEFAULT 0');
    } catch (e) {
      console.warn('Migration: Could not add timeSpentSec to test_answers:', e.message);
    }
  }

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_test_answers_attemptId ON test_answers(testAttemptId);
  `);

  // Unique constraint to prevent duplicate active subscriptions
  // Removed UNIQUE index to allow subscription extension logic
  try {
    database.exec(`DROP INDEX IF EXISTS idx_unique_active_subscription`);
  } catch (e) {}

  // View for product-isolated student answers (joins with tests for consistency)
  database.exec(`
    CREATE VIEW IF NOT EXISTS student_answers_per_product AS
    SELECT sa.*, t.packageName, t.mode, t.date as testDate
    FROM student_answers sa
    JOIN tests t ON sa.testId = t.testId;
  `);

  console.log('Database schema initialized');
}

export function createUser(user) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, passwordHash, role, subscriptionStatus, createdAt, stats, pendingDuration, subscriptionDuration, productName)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    user.id,
    user.name,
    user.email,
    user.passwordHash,
    user.role || 'student',
    user.subscriptionStatus || 'trial',
    user.createdAt || new Date().toISOString(),
    JSON.stringify(user.stats || { attempted: 0, correct: 0, tests: 0 }),
    user.pendingDuration || 0,
    user.subscriptionDuration || 0,
    user.productName || null
  );
  return user;
}

export function getUserByEmail(email) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
  const user = stmt.get(email);
  if (user) {
    user.stats = JSON.parse(user.stats || '{}');
    user.purchased = !!user.purchased;
    user.activatedByPurchase = !!user.activatedByPurchase;
    user.hasPendingPurchase = !!user.hasPendingPurchase;
    user.trialUsed = !!user.trialUsed;
    user.isBanned = !!user.isBanned;
  }
  return user;
}

export function getUserById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id);
  if (user) {
    user.stats = JSON.parse(user.stats || '{}');
    user.purchased = !!user.purchased;
    user.activatedByPurchase = !!user.activatedByPurchase;
    user.hasPendingPurchase = !!user.hasPendingPurchase;
    user.trialUsed = !!user.trialUsed;
    user.isBanned = !!user.isBanned;
  }
  return user;
}

export function getAllUsers() {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users');
  return stmt.all().map(user => {
    user.stats = JSON.parse(user.stats || '{}');
    user.purchased = !!user.purchased;
    user.activatedByPurchase = !!user.activatedByPurchase;
    user.hasPendingPurchase = !!user.hasPendingPurchase;
    user.trialUsed = !!user.trialUsed;
    user.isBanned = !!user.isBanned;
    return user;
  });
}

export function updateUser(user) {
  const db = getDb();
  console.log('DB: Updating user record for ID:', user.id);
  
  if (!user.id) {
    throw new Error('Database error: User ID is required for update');
  }

  // Handle stats stringification defensively
  let statsString = '{}';
  if (user.stats) {
    if (typeof user.stats === 'string') {
      statsString = user.stats; // Already a string
    } else {
      statsString = JSON.stringify(user.stats);
    }
  }

  const stmt = db.prepare(`
    UPDATE users SET
      name = ?, email = ?, passwordHash = ?, role = ?,
      subscriptionStatus = ?, purchased = ?, activatedByPurchase = ?,
      hasPendingPurchase = ?, trialUsed = ?, activatedAt = ?,
      expiresAt = ?, lastRenewedAt = ?, updatedAt = ?, isBanned = ?, stats = ?,
      pendingDuration = ?, subscriptionDuration = ?, productName = ?
    WHERE id = ?
  `);

  const params = [
    user.name || '',
    user.email || '',
    user.passwordHash || '',
    user.role || 'student',
    user.subscriptionStatus || 'trial',
    user.purchased ? 1 : 0,
    user.activatedByPurchase ? 1 : 0,
    user.hasPendingPurchase ? 1 : 0,
    user.trialUsed ? 1 : 0,
    user.activatedAt || null,
    user.expiresAt || null,
    user.lastRenewedAt || null,
    new Date().toISOString(),
    user.isBanned ? 1 : 0,
    statsString,
    user.pendingDuration || 0,
    user.subscriptionDuration || 0,
    user.productName || null,
    user.id
  ];

  console.log('DB: Executing UPDATE with', params.length, 'parameters');
  const result = stmt.run(...params);
  
  if (result.changes === 0) {
    console.warn('DB: Update completed but 0 rows were affected for ID:', user.id);
  }

  return user;
}

export function deleteUser(id) {
  try {
    const db = getDb();

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Start transaction to ensure atomic deletion of related data
    const deleteTx = db.transaction((userId) => {
      // 1. Cleanup related data (tests, student_answers, subscriptions, etc.)
      // These must be deleted BEFORE the user to avoid foreign key violations
      db.prepare('DELETE FROM subscriptions WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM user_questions WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM notifications WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM student_cognition_profiles WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM planner WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM user_questions_archive WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM tests_archive WHERE userId = ?').run(userId);

      // Handle tests and student_answers carefully
      const testIds = db.prepare('SELECT testId FROM tests WHERE userId = ?').all(userId).map(t => t.testId);
      if (testIds.length > 0) {
        const placeholders = testIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM student_answers WHERE testId IN (${placeholders})`).run(...testIds);
        db.prepare('DELETE FROM tests WHERE userId = ?').run(userId);
      }

      // Handle test_attempts and related answer tables
      const attemptIds = db.prepare('SELECT id FROM test_attempts WHERE userId = ?').all(userId).map(a => a.id);
      if (attemptIds.length > 0) {
        const placeholders = attemptIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM test_answers WHERE testAttemptId IN (${placeholders})`).run(...attemptIds);
        // Also check for legacy or alternate attempt answer tables
        try {
          db.prepare(`DELETE FROM test_attempt_answers WHERE attempt_id IN (${placeholders})`).run(...attemptIds);
        } catch (e) { }
        db.prepare('DELETE FROM test_attempts WHERE userId = ?').run(userId);
      }

      // 2. FINALLY: Delete user record once all dependencies are cleared
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteTx(id);
    console.log(`User ${id} ("${user.name}") PERMANENTLY purged from registry`);
    return true;
  } catch (err) {
    console.error(`DB: Failed to permanently delete user ${id}:`, err.message);
    throw err;
  }
}

// User Subscription Operations
export function createUserSubscription({ userId, packageId, productId, durationDays, amount = 0, status = 'pending' }) {
    const db = getDb();
    
    // Standardize IDs as Strings
    const uidStr = String(userId);
    const pidStr = String(packageId || productId);
    
    console.log(`[Subscription Registry] Processing sub for user ${uidStr}, product ${pidStr}`);

    // Check if product is deleted (prevent new subscriptions)
    const product = db.prepare('SELECT isDeleted FROM products WHERE id = ?').get(pidStr);
    if (product && product.isDeleted) {
        throw new Error('Cannot create subscription for deleted product');
    }

    // Goal 1: Prevent duplicate subscriptions; extend existing if same userId + packageId
    const existing = db.prepare(`
        SELECT * FROM subscriptions 
        WHERE userId = ? AND packageId = ? AND status = 'active'
        ORDER BY expiresAt DESC LIMIT 1
    `).get(uidStr, pidStr);

    if (existing) {
        // Check if the product is deleted before allowing renewal
        const existingProduct = db.prepare('SELECT isDeleted FROM products WHERE id = ?').get(pidStr);
        if (existingProduct && existingProduct.isDeleted) {
            throw new Error('Cannot renew subscription for deleted product');
        }
        
        console.log(`[Subscription Registry] Found existing active sub ${existing.id}. Extending by ${durationDays} days.`);
        const currentExpiry = new Date(existing.expiresAt);
        const newExpiry = new Date(currentExpiry.getTime() + (Number(durationDays) * 24 * 60 * 60 * 1000));
        
        db.prepare('UPDATE subscriptions SET expiresAt = ?, durationDays = durationDays + ?, amount = amount + ? WHERE id = ?')
          .run(newExpiry.toISOString(), Number(durationDays), Number(amount), existing.id);
          
        return { ...existing, expiresAt: newExpiry.toISOString(), extended: true };
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const purchaseDate = now.toISOString();

    let expiresAt = null;
    if (status === 'active') {
        expiresAt = new Date(now.getTime() + (Number(durationDays) * 24 * 60 * 60 * 1000)).toISOString();
    }

    console.log(`[Subscription Registry] Inserting new sub ${id} (Status: ${status})`);
    db.prepare(`
        INSERT INTO subscriptions (id, userId, packageId, productId, status, expiresAt, purchaseDate, amount, durationDays)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, uidStr, pidStr, pidStr, status, expiresAt, purchaseDate, amount, durationDays);

    return { id, userId: uidStr, packageId: pidStr, productId: pidStr, durationDays, amount, status, expiresAt, purchaseDate };
}

export function getUserSubscriptions(userId) {
    const db = getDb();
    const uidStr = String(userId);
    // Get only latest subscription per product, including deleted products for existing users
    console.log(`[Subscription Registry] Fetching subs for user ${uidStr}`);
    return db.prepare(`
        SELECT s.*, pr.name as productName, pr.isDeleted as productDeleted
        FROM subscriptions s
        LEFT JOIN products pr ON s.packageId = CAST(pr.id AS TEXT) OR s.productId = CAST(pr.id AS TEXT)
        WHERE s.userId = ? 
        AND s.id IN (
            SELECT MAX(id) 
            FROM subscriptions 
            WHERE userId = ? 
            GROUP BY packageId
        )
        ORDER BY s.purchaseDate DESC
    `).all(uidStr, uidStr);
}

export function getActiveSubscriptionByUserAndProduct(userId, packageId) {
    const db = getDb();
    const pidStr = String(packageId);
    const uidStr = String(userId);
    return db.prepare(`
        SELECT * FROM subscriptions 
        WHERE userId = ? 
        AND (packageId = ? OR productId = ?)
        AND status = 'active'
        ORDER BY expiresAt DESC
        LIMIT 1
    `).get(uidStr, pidStr, pidStr);
}

export function activateSubscription(subscriptionId) {
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId);
    if (!sub) throw new Error('Subscription not found');

    const now = new Date();
    const startDate = now.toISOString();
    const expiresAt = new Date(now.getTime() + (sub.durationDays * 24 * 60 * 60 * 1000)).toISOString();

    db.prepare(`
        UPDATE subscriptions SET
            status = 'active',
            expiresAt = ?
        WHERE id = ?
    `).run(expiresAt, subscriptionId);

    // Backward Compatibility: Update the users table
    const uidStr = String(sub.userId);
    const pidStr = String(sub.packageId);
    
    const user = db.prepare('SELECT purchasedProducts FROM users WHERE id = ?').get(uidStr);
    let ids = [];
    try {
        ids = JSON.parse(user?.purchasedProducts || '[]');
        if (!Array.isArray(ids)) ids = [];
    } catch(e) { ids = []; }

    if (!ids.includes(pidStr)) {
        ids.push(pidStr);
        db.prepare("UPDATE users SET purchasedProducts = ?, purchased = 1, activatedByPurchase = 1 WHERE id = ?")
          .run(JSON.stringify(ids), uidStr);
    }

    return { ...sub, status: 'active', startDate, expiresAt };
}

export function extendSubscription(subscriptionId, additionalDays) {
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId);
    if (!sub) throw new Error('Subscription not found');

    const now = new Date();
    let newExpiresAt;
    
    // If current subscription is still active, extend from current expiry
    // If expired, extend from now
    if (sub.expiresAt && new Date(sub.expiresAt) > now) {
        newExpiresAt = new Date(new Date(sub.expiresAt).getTime() + (Number(additionalDays) * 24 * 60 * 60 * 1000));
    } else {
        newExpiresAt = new Date(now.getTime() + (Number(additionalDays) * 24 * 60 * 60 * 1000));
    }

    db.prepare(`
        UPDATE subscriptions SET
            status = 'active',
            expiresAt = ?
        WHERE id = ?
    `).run(newExpiresAt.toISOString(), subscriptionId);

    return { ...sub, status: 'active', expiresAt: newExpiresAt.toISOString() };
}


// User Question Progress
export function getUserQuestions(userId, productId) {
  const db = getDb();
  
  if (!productId || productId === 'null' || productId === 'undefined') {
    console.warn('getUserQuestions called without valid productId');
    return [];
  }

  try {
    const pidStr = productId.toString();
    const pidInt = parseInt(productId);

    // Attempt is the single source of truth: derive status from latest FINISHED attempt only
    const latestPerQuestion = db.prepare(`
      SELECT questionId, selectedOption, isCorrect, isFlagged
      FROM (
        SELECT 
          a.questionId as questionId,
          a.selectedOption as selectedOption,
          a.isCorrect as isCorrect,
          a.isFlagged as isFlagged,
          ta.finishedAt as finishedAt,
          ROW_NUMBER() OVER (PARTITION BY a.questionId ORDER BY ta.finishedAt DESC) as rn
        FROM test_attempts ta
        JOIN test_answers a ON a.testAttemptId = ta.id
        WHERE ta.userId = ? AND ta.productId = ? AND ta.finishedAt IS NOT NULL
      )
      WHERE rn = 1
    `).all(String(userId), pidStr);

    const latestMap = new Map(latestPerQuestion.map(r => [String(r.questionId), r]));

    // Product-specific question pool: Strictly published and latest only for students
    const allQuestions = db.prepare(`
      SELECT * FROM questions 
      WHERE status = 'published' 
      AND isLatest = 1 
      AND (productId = ? OR packageId = ?)
    `).all(pidStr, pidStr);

    return allQuestions.map(q => {
      const latest = latestMap.get(String(q.id));

      // UNUSED = never appeared in any finished attempt
      let computedStatus = 'unused';
      let userAnswer = null;
      let isMarked = false;

      if (latest) {
        userAnswer = latest.selectedOption ?? null;
        isMarked = !!latest.isFlagged;

        // Correct/Incorrect/Omitted are computed per attempt snapshot
        if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
          // Only mark as omitted if the question was previously unused
          const existingUserQuestion = db.prepare(
            'SELECT status FROM user_questions WHERE userId = ? AND questionId = ? AND (productId = ? OR packageId = ?)'
          ).get(String(userId), String(q.id), String(productId), String(productId));
          
          if (existingUserQuestion && existingUserQuestion.status === 'unused') {
            computedStatus = 'omitted';
          } else if (existingUserQuestion) {
            // Keep the previous status (correct/incorrect) for questions from those pools
            computedStatus = existingUserQuestion.status;
          } else {
            // New question, mark as omitted
            computedStatus = 'omitted';
          }
        } else {
          computedStatus = Number(latest.isCorrect) === 1 ? 'correct' : 'incorrect';
        }
      }

      return {
        ...q,
        choices: safeParse(q.choices, []),
        status: computedStatus,
        isMarked,
        userAnswer,
        userHistory: [],
        lifecycleStatus: q.status
      };
    });
  } catch (err) {
    console.error('getUserQuestions error:', err);
    return [];
  }
}

/**
 * NEW: Initialize questions as "used" during test creation
 */
export function initializeUserQuestions(userId, packageId, questionIds) {
  const db = getDb();
  const uidStr = String(userId);
  const pidStr = String(packageId);
  const now = new Date().toISOString();
  
  console.log(`[Content Engine] Initializing ${questionIds.length} questions for user ${uidStr} in product ${pidStr}`);

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO user_questions (userId, questionId, packageId, productId, status, totalAttempts, updatedAt)
    VALUES (?, ?, ?, ?, NULL, 0, ?)
  `);

  const transaction = db.transaction((ids) => {
    for (const qid of ids) {
      stmt.run(uidStr, String(qid), pidStr, pidStr, now);
    }
  });

  transaction(questionIds);
  return true;
}

export function updateUserQuestion({ 
  userId, 
  questionId, 
  productId, 
  selectedAnswer = null, 
  newStatus = null, 
  toggleFlag = false, 
  timeSpent = 0 
}) {
  const db = getDb();
  const uidStr = String(userId);
  const qidStr = String(questionId);
  const pidStr = String(productId);
  
  if (!productId) {
    throw new Error('Database Error: productId (packageId) is required for updating user question progress.');
  }

  const now = new Date().toISOString();
  const timeSpentDelta = Number.isFinite(timeSpent) ? timeSpent : (Number(timeSpent) || 0);

  console.log(`[Content Engine] Updating progress for user ${uidStr}, question ${qidStr}, product ${pidStr}`);

  const existing = db.prepare(
    'SELECT status, isMarked FROM user_questions WHERE userId = ? AND questionId = ? AND (productId = ? OR packageId = ?)'
  ).get(uidStr, qidStr, pidStr, pidStr);

  if (!existing) {
    console.log(`[Content Engine] Progress record missing. Creating record.`);
    db.prepare(`
      INSERT INTO user_questions (
        userId, questionId, productId, packageId, status, isMarked, userAnswer, 
        totalAttempts, timeSpent, lastAnswer, lastSeenAt, updatedAt, lastUpdated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uidStr, qidStr, pidStr, pidStr,
      newStatus, toggleFlag ? 1 : 0, selectedAnswer,
      newStatus ? 1 : 0, timeSpentDelta, selectedAnswer, now, now, now
    );
    return true;
  }

  const finalMarked = toggleFlag ? (existing.isMarked ? 0 : 1) : existing.isMarked;
  
  // Only allow status to become 'omitted' if it was previously 'unused'
  let finalStatus = newStatus;
  if (newStatus === 'omitted' && existing.status && existing.status !== 'unused') {
    // Keep the original status (correct/incorrect) if not unused
    finalStatus = existing.status;
  }
  
  db.prepare(`
    UPDATE user_questions SET
      status = COALESCE(?, status),
      isMarked = ?,
      userAnswer = COALESCE(?, userAnswer),
      lastAnswer = ?,
      totalAttempts = totalAttempts + ?,
      timeSpent = timeSpent + ?,
      lastSeenAt = ?,
      updatedAt = ?,
      lastUpdated = ?
    WHERE userId = ? AND questionId = ? AND (productId = ? OR packageId = ?)
  `).run(
    finalStatus, 
    finalMarked, 
    selectedAnswer,
    selectedAnswer,
    newStatus ? 1 : 0, 
    timeSpentDelta, 
    now, now, now,
    uidStr, qidStr, pidStr, pidStr
  );

  return true;
}

export function getEligiblePool(userId, packageId, filters = {}, limit = null) {
  const db = getDb();
  const uidStr = String(userId);
  const pidStr = String(packageId);

  console.log(`[Content Engine] Calculating eligible pool for user ${uidStr} in product ${pidStr}`);
  
  let query = `
    WITH latest AS (
      SELECT questionId, selectedOption, isCorrect, isFlagged
      FROM (
        SELECT 
          a.questionId as questionId,
          a.selectedOption as selectedOption,
          a.isCorrect as isCorrect,
          a.isFlagged as isFlagged,
          ta.finishedAt as finishedAt,
          ROW_NUMBER() OVER (PARTITION BY a.questionId ORDER BY ta.finishedAt DESC) as rn
        FROM test_attempts ta
        JOIN test_answers a ON a.testAttemptId = ta.id
        WHERE ta.userId = ? AND ta.productId = ? AND ta.finishedAt IS NOT NULL
      )
      WHERE rn = 1
    )
    SELECT q.id
    FROM questions q
    LEFT JOIN latest l ON l.questionId = q.id
    WHERE (q.packageId = ? OR q.productId = ?)
      AND q.status = 'published'
      AND q.isLatest = 1
  `;

  const params = [uidStr, pidStr, pidStr, pidStr];

  if (filters.systems && filters.systems.length > 0) {
    query += ` AND q.system IN (${filters.systems.map(() => '?').join(',')})`;
    params.push(...filters.systems);
  }

  if (filters.subjects && filters.subjects.length > 0) {
    query += ` AND q.subject IN (${filters.subjects.map(() => '?').join(',')})`;
    params.push(...filters.subjects);
  }

  if (filters.usageState === 'unused') {
    query += ` AND l.questionId IS NULL`;
  } else if (filters.usageState === 'incorrect') {
    query += ` AND l.selectedOption IS NOT NULL AND l.selectedOption != '' AND l.isCorrect = 0`;
  } else if (filters.usageState === 'correct') {
    query += ` AND l.selectedOption IS NOT NULL AND l.selectedOption != '' AND l.isCorrect = 1`;
  } else if (filters.usageState === 'omitted') {
    query += ` AND l.questionId IS NOT NULL AND (l.selectedOption IS NULL OR l.selectedOption = '')`;
  } else if (filters.usageState === 'marked') {
    query += ` AND l.isFlagged = 1`;
  }

  if (limit) {
    query += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(limit);
  }

  const results = db.prepare(query).all(...params);
  console.log(`[Content Engine] Pool size calculated: ${results.length} questions`);
  return results.map(r => String(r.id));
}

export function getUniverseSize(packageId) {
  const db = getDb();
  const pidStr = String(packageId);
  const res = db.prepare(
    `
    SELECT COUNT(*) as count
    FROM questions
    WHERE (packageId = ? OR productId = ?) AND status = 'published' AND isLatest = 1
    `
  ).get(pidStr, pidStr);
  return res ? res.count : 0;
}

export function resetUserQuestions(userId) {
  const db = getDb();
  const now = new Date().toISOString();
  
  const transaction = db.transaction(() => {
    // Archive existing data
    db.prepare(`
      INSERT INTO user_questions_archive 
      (userId, questionId, status, isMarked, userAnswer, userHistory, archivedAt)
      SELECT userId, questionId, status, isMarked, userAnswer, userHistory, ?
      FROM user_questions WHERE userId = ?
    `).run(now, userId);

    // Delete current data
    db.prepare('DELETE FROM user_questions WHERE userId = ?').run(userId);

    // Cleanup: Remove archives older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM user_questions_archive WHERE archivedAt < ?').run(thirtyDaysAgo);
  });

  transaction();
  return true;
}

export function restoreUserQuestions(userId) {
  const db = getDb();
  
  // Find the most recent archive timestamp for this user
  const latest = db.prepare('SELECT MAX(archivedAt) as lastArchived FROM user_questions_archive WHERE userId = ?').get(userId);
  
  if (!latest.lastArchived) return false;

  const transaction = db.transaction(() => {
    // Restore from archive (Upserting to overwrite any current progress if conflicts)
    // Note: We need to handle potential conflicts if user started new progress. 
    // Requirement implies "Restoration", assume overwriting empty state usually.
    
    // We select items from the LATEST archive batch.
    const records = db.prepare('SELECT * FROM user_questions_archive WHERE userId = ? AND archivedAt = ?').all(userId, latest.lastArchived);
    
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO user_questions (userId, questionId, status, isMarked, userAnswer, userHistory)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const rec of records) {
      insertStmt.run(rec.userId, rec.questionId, rec.status, rec.isMarked, rec.userAnswer, rec.userHistory);
    }
  });

  transaction();
  return true;
}

// Test CRUD operations
export function saveTest(test) {
  const db = getDb();
  const uidStr = String(test.userId);
  const tidStr = String(test.testId);
  const pidStr = String(test.productId || test.packageId);
  
  if (!pidStr || pidStr === 'null') {
    throw new Error('Database Error: productId (packageId) is required for saving or updating a test.');
  }

  console.log(`[Exam Runtime] Saving test ${tidStr} for user ${uidStr} in product ${pidStr}`);

  const existing = db.prepare('SELECT * FROM tests WHERE testId = ? AND userId = ?').get(tidStr, uidStr);
  
  if (existing) {
    db.prepare(`
      UPDATE tests SET
        questions = ?, answers = ?, firstAnswers = ?, markedIds = ?,
        currentIndex = ?, elapsedTime = ?, isSuspended = ?, date = ?, 
        packageId = ?, packageName = ?, productId = ?,
        universeSize = ?, eligiblePoolSize = ?, poolLogic = ?,
        sessionState = ?
      WHERE testId = ? AND userId = ?
    `).run(
      JSON.stringify(test.questions),
      JSON.stringify(test.answers || {}),
      JSON.stringify(test.firstAnswers || {}),
      JSON.stringify(test.markedIds || []),
      test.currentIndex || 0,
      test.elapsedTime || 0,
      test.isSuspended ? 1 : 0,
      test.date || new Date().toISOString(),
      pidStr,
      test.packageName || null,
      pidStr, 
      test.universeSize || existing.universeSize,
      test.eligiblePoolSize || existing.eligiblePoolSize,
      JSON.stringify(test.poolLogic || {}),
      JSON.stringify(test.sessionState || {}),
      tidStr,
      uidStr
    );
  } else {
    db.prepare(`
      INSERT INTO tests (
        testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, 
        markedIds, currentIndex, elapsedTime, isSuspended, createdAt, date, 
        packageId, packageName, productId, universeSize, eligiblePoolSize, poolLogic, sessionState
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tidStr,
      test.testNumber || 1,
      uidStr,
      test.mode || 'tutor',
      JSON.stringify(test.pool || []),
      JSON.stringify(test.questions),
      JSON.stringify(test.answers || {}),
      JSON.stringify(test.firstAnswers || {}),
      JSON.stringify(test.markedIds || []),
      test.currentIndex || 0,
      test.elapsedTime || 0,
      test.isSuspended ? 1 : 0,
      new Date().toISOString(),
      test.date || new Date().toISOString(),
      pidStr,
      test.packageName || null,
      pidStr,
      test.universeSize || 0,
      test.eligiblePoolSize || 0,
      JSON.stringify(test.poolLogic || {}),
      JSON.stringify(test.sessionState || {})
    );
  }

  // Refactor: Per-attempt result lockdown
  // In the new architecture, we pre-create AttemptAnswer rows for all selected questions.
  const isSuspendedFlag = (test.isSuspended === true || test.isSuspended === 1 || test.isSuspended === '1');
  if (!isSuspendedFlag && !test.testAttemptId) {
    const existingUnfinished = db
      .prepare('SELECT id FROM test_attempts WHERE testId = ? AND finishedAt IS NULL ORDER BY startedAt DESC LIMIT 1')
      .get(tidStr);

    if (existingUnfinished?.id) {
      test.testAttemptId = existingUnfinished.id;
    } else {
      const attemptId = crypto.randomUUID();
      console.log(`[Exam Runtime] Creating Attempt ${attemptId} for test ${tidStr}`);

      db.prepare(`
        INSERT INTO test_attempts (id, productId, userId, testId, startedAt, finishedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(attemptId, pidStr, uidStr, tidStr, test.date || new Date().toISOString(), null); // finishedAt is NULL initially

      const insertAnswer = db.prepare(`
        INSERT INTO test_answers (testAttemptId, questionId, selectedOption, isCorrect, isFlagged, correctOption, timeSpentSec)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // We pre-create rows with null/false values.
      const questionsArray = Array.isArray(test.questions) ? test.questions : [];
      const answersMap = test.answers || {};
      const markedIds = new Set(test.markedIds || []);

      questionsArray.forEach(qItem => {
        const qId = typeof qItem === 'object' ? qItem.id : qItem;
        let correctOption = typeof qItem === 'object' ? qItem.correct : null;

        if (!correctOption) {
          const row = db.prepare('SELECT correct FROM questions WHERE id = ?').get(String(qId));
          correctOption = row?.correct || null;
        }
        
        const selected = (answersMap[qId] === undefined || answersMap[qId] === '') ? null : answersMap[qId];
        const isCorrectVal = selected === null || !correctOption ? null : (selected === correctOption ? 1 : 0);

        insertAnswer.run(
          attemptId,
          qId,
          selected,
          isCorrectVal,
          markedIds.has(qId) ? 1 : 0,
          correctOption,
          0
        );
      });

      // Baseline snapshot on attempt creation (Attempt is single source of truth)
      try {
        const qIds = questionsArray.map(qItem => String(typeof qItem === 'object' ? qItem.id : qItem)).filter(Boolean);
        const qSnap = qIds.map((qid) => {
          const fromPayload = questionsArray.find(x => typeof x === 'object' && x && String(x.id) === qid);
          if (fromPayload && typeof fromPayload === 'object') return fromPayload;

          const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(String(qid));
          if (!row) return { id: qid };
          return {
            ...row,
            id: String(row.id),
            choices: safeParse(row.choices, []),
            tags: safeParse(row.tags, []),
            stemImage: safeParse(row.stemImage, {}),
            explanationCorrectImage: safeParse(row.explanationCorrectImage, {}),
            explanationWrongImage: safeParse(row.explanationWrongImage, {}),
            summaryImage: safeParse(row.summaryImage, {}),
          };
        }).filter(Boolean);

        db.prepare(`
          UPDATE test_attempts SET
            questionIds = ?,
            questionSnapshots = ?
          WHERE id = ?
        `).run(JSON.stringify(qIds), JSON.stringify(qSnap), attemptId);
      } catch (e) {
        console.error('[Exam Runtime] Failed to store baseline attempt snapshot:', e);
      }

      test.testAttemptId = attemptId;
    }
  }

  return test;
}

export function updateAttemptAnswer(attemptId, questionId, selectedOption, secondsToAdd = 0) {
  const db = getDb();

  // Validation: Do not allow answer updates if attempt is finished
  const attempt = db.prepare('SELECT finishedAt FROM test_attempts WHERE id = ?').get(attemptId);
  if (attempt?.finishedAt) {
    console.warn('[DB] Attempting to update answer on finished attempt:', attemptId);
    return false;
  }

  const selected = (selectedOption === undefined || selectedOption === '') ? null : selectedOption;
  const correct = db.prepare('SELECT correctOption FROM test_answers WHERE testAttemptId = ? AND questionId = ?').get(attemptId, String(questionId));
  const correctOption = correct?.correctOption || null;
  const isCorrectVal = selected === null || !correctOption ? null : (selected === correctOption ? 1 : 0);

  // Use a transaction to atomically update both tables
  const runTransaction = db.transaction(() => {
    // Increment specific question time using COALESCE to handle initial null values
    db.prepare(`
      UPDATE test_answers 
      SET selectedOption = ?, 
          isCorrect = ?,
          timeSpentSec = COALESCE(timeSpentSec, 0) + ? 
      WHERE testAttemptId = ? AND questionId = ?
    `).run(selected, isCorrectVal, secondsToAdd, attemptId, questionId);

    // Increment global session time (Crucial for refresh persistence)
    db.prepare(`
      UPDATE test_attempts 
      SET elapsedTime = COALESCE(elapsedTime, 0) + ? 
      WHERE id = ?
    `).run(secondsToAdd, attemptId);
  });

  return runTransaction();
}

export function getPerformanceStats(userId, productId) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      SUM(timeSpentSec) as totalTime,
      AVG(timeSpentSec) as avgTime,
      SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correctCount,
      COUNT(*) as totalAnswered
    FROM test_answers ta
    JOIN test_attempts att ON ta.testAttemptId = att.id
    WHERE att.userId = ? AND att.productId = ?
  `).get(userId, productId);
}

export function updateAttemptFlag(attemptId, questionId, isFlagged) {
  const db = getDb();
  // Flag updates ARE allowed even after finish for review purposes
  return db.prepare(`
    UPDATE test_answers 
    SET isFlagged = ?
    WHERE testAttemptId = ? AND questionId = ?
  `).run(isFlagged ? 1 : 0, attemptId, questionId);
}

export function snapshotAttempt(attemptId, snapshot) {
  const db = getDb();
  const attempt = db.prepare('SELECT id, finishedAt FROM test_attempts WHERE id = ?').get(attemptId);
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.finishedAt) throw new Error('Attempt already finished');

  const questionIds = Array.isArray(snapshot?.questionIds) ? snapshot.questionIds.map(String) : [];
  const markedIds = Array.isArray(snapshot?.markedIds) ? snapshot.markedIds.map(String) : [];
  const timeSpent = snapshot?.timeSpent && typeof snapshot.timeSpent === 'object' ? snapshot.timeSpent : {};
  const elapsedTime = Number.isFinite(snapshot?.elapsedTime) ? snapshot.elapsedTime : (Number(snapshot?.elapsedTime) || 0);
  const answersMap = snapshot?.answers && typeof snapshot.answers === 'object' ? snapshot.answers : {};
  const questionSnapshots = Array.isArray(snapshot?.questionSnapshots) ? snapshot.questionSnapshots : null;

  const updateAttemptStmt = db.prepare(`
    UPDATE test_attempts SET
      questionIds = ?,
      markedIds = ?,
      timeSpent = ?,
      elapsedTime = ?,
      questionSnapshots = ?
    WHERE id = ?
  `);

  const updateAnswerStmt = db.prepare(`
    UPDATE test_answers SET
      selectedOption = ?,
      isCorrect = ?,
      isFlagged = ?,
      timeSpentSec = ?
    WHERE testAttemptId = ? AND questionId = ?
  `);

  const tx = db.transaction(() => {
    updateAttemptStmt.run(
      JSON.stringify(questionIds),
      JSON.stringify(markedIds),
      JSON.stringify(timeSpent),
      elapsedTime,
      questionSnapshots ? JSON.stringify(questionSnapshots) : null,
      attemptId
    );

    const markedSet = new Set(markedIds);
    for (const qId of questionIds) {
      const selected = (answersMap[qId] === undefined || answersMap[qId] === '') ? null : answersMap[qId];
      const flagged = markedSet.has(qId) ? 1 : 0;
      const ts = Number(timeSpent[qId] || 0);

      const correctRow = db.prepare('SELECT correctOption FROM test_answers WHERE testAttemptId = ? AND questionId = ?').get(attemptId, qId);
      const correctOption = correctRow?.correctOption || null;
      const isCorrectVal = selected === null || !correctOption ? null : (selected === correctOption ? 1 : 0);

      updateAnswerStmt.run(selected, isCorrectVal, flagged, ts, attemptId, qId);
    }
  });

  tx();
  return { success: true };
}

export function finishAttempt(attemptId) {
  const db = getDb();
  const existing = db.prepare('SELECT id, finishedAt FROM test_attempts WHERE id = ?').get(attemptId);
  if (!existing) throw new Error('Attempt not found');
  if (existing.finishedAt) return { success: true, alreadyFinished: true };

  // Mark the attempt as finished
  db.prepare(`
    UPDATE test_attempts 
    SET finishedAt = ?
    WHERE id = ?
  `).run(new Date().toISOString(), attemptId);

  // Get the attempt details to update user_questions
  const attempt = db.prepare(`
    SELECT ta.*, t.userId, t.packageId, t.productId 
    FROM test_attempts ta
    JOIN tests t ON ta.testId = t.testId
    WHERE ta.id = ?
  `).get(attemptId);

  if (attempt) {
    // Get all answers for this attempt
    const answers = db.prepare('SELECT * FROM test_answers WHERE testAttemptId = ?').all(attemptId);
    
    answers.forEach(answer => {
      const userId = attempt.userId;
      const productId = attempt.productId || attempt.packageId;
      
      // Get the current status of this question in user_questions
      const currentStatus = db.prepare(
        'SELECT status FROM user_questions WHERE userId = ? AND questionId = ? AND (productId = ? OR packageId = ?)'
      ).get(String(userId), String(answer.questionId), String(productId), String(productId))?.status || 'unused';
      
      // Determine the new status
      let newStatus;
      if (answer.selectedOption === null || answer.selectedOption === undefined || answer.selectedOption === '') {
        // Only mark as omitted if it was previously unused
        if (currentStatus === 'unused') {
          newStatus = 'omitted';
        } else {
          // Keep the previous status for questions from correct/incorrect pools
          newStatus = currentStatus;
        }
      } else {
        // Question was answered, update based on correctness
        newStatus = answer.isCorrect ? 'correct' : 'incorrect';
      }
      
      // Update user_questions with the new status
      db.prepare(`
        INSERT OR REPLACE INTO user_questions 
        (userId, questionId, productId, packageId, status, userAnswer, totalAttempts, lastSeenAt, updatedAt, lastUpdated)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        String(userId),
        String(answer.questionId),
        String(productId),
        String(productId),
        newStatus,
        answer.selectedOption,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      );
    });
  }

  return { success: true, alreadyFinished: false };
}

export function updateAttemptReviewMetadata(attemptId, meta) {
  const db = getDb();
  db.prepare('UPDATE test_attempts SET review_metadata = ? WHERE id = ?').run(
    JSON.stringify(meta),
    attemptId
  );
  return true;
}

export function getTestAttempt(attemptId) {
  const db = getDb();
  const attempt = db.prepare('SELECT * FROM test_attempts WHERE id = ?').get(attemptId);
  if (!attempt) return null;

  // Link back to original test for metadata (questions list, mode, etc.)
  const test = db.prepare('SELECT * FROM tests WHERE testId = ?').get(attempt.testId);
  const answers = db.prepare('SELECT * FROM test_answers WHERE testAttemptId = ?').all(attemptId);

  // Reconstruct answer map consistent with frozen attempt logic
  // Step 1: preserved nulls for Omitted logic
  const answersMap = {};
  const markedIds = [];
  answers.forEach(a => {
    answersMap[a.questionId] = a.selectedOption;
    if (a.isFlagged) markedIds.push(a.questionId);
  });

  // Step 7: Unused formula uses total product universe
  const pidStr = attempt.productId.toString();
  const universe = db.prepare('SELECT COUNT(*) as count FROM questions WHERE (productId = ? OR packageId = ?) AND status = "published" AND isLatest = 1').get(pidStr, pidStr);



  const questionIds = safeParse(attempt.questionIds, null);
  const questionSnapshots = safeParse(attempt.questionSnapshots, null);
  const questionsInTest = questionSnapshots || questionIds || safeParse(test?.questions, []);

  const totalQuestions = Array.isArray(questionIds)
    ? questionIds.length
    : (Array.isArray(questionsInTest) ? questionsInTest.length : 0);

  const attemptAnswers = answers.map(a => {
    // Get question details for subject, system, topic, and global stats
    const question = db.prepare('SELECT subject, system, topic, globalAttempts, globalCorrect FROM questions WHERE id = ?').get(a.questionId);
    
    // Calculate % correct others
    let percentCorrectOthers = '--';
    if (question && question.globalAttempts > 0) {
      percentCorrectOthers = Math.round((question.globalCorrect / question.globalAttempts) * 100) + '%';
    }
    
    return {
      questionId: a.questionId,
      selectedOption: a.selectedOption,
      isCorrect: a.isCorrect,
      isFlagged: a.isFlagged,
      correctOption: a.correctOption ?? null,
      timeSpentSec: a.timeSpentSec ?? 0,
      subject: question?.subject || null,
      system: question?.system || null,
      topic: question?.topic || null,
      percentCorrectOthers
    };
  });

  return {
    ...test,
    testAttemptId: attempt.id,
    id: attempt.id,
    testId: attempt.testId,
    answers: answersMap,
    attemptAnswers,
    markedIds: markedIds,
    questions: questionsInTest,
    questionIds: Array.isArray(questionIds) ? questionIds : null,
    totalQuestions,
    elapsedTime: attempt.elapsedTime || test?.elapsedTime || 0,
    timeSpent: safeParse(attempt.timeSpent, {}),
    finishedAt: attempt.finishedAt,
    startedAt: attempt.startedAt,
    isAttempt: true,
    totalProductQuestions: universe?.count || 0
  };
}

export function getTestAttemptStats(attemptId) {
  const db = getDb();
  const attempt = db.prepare('SELECT finishedAt FROM test_attempts WHERE id = ?').get(attemptId);
  const rows = db.prepare('SELECT selectedOption, isCorrect, isFlagged FROM test_answers WHERE testAttemptId = ?').all(attemptId);
  
  let correct = 0;
  let incorrect = 0;
  let omitted = 0;
  let flagged = 0;
  
  rows.forEach(r => {
    if (r.isFlagged) flagged++;
    
    // Step 6: Derive status
    const hasAnswer = r.selectedOption !== null && r.selectedOption !== undefined && r.selectedOption !== '';
    
    if (hasAnswer) {
      if (r.isCorrect) correct++;
      else incorrect++;
    } else if (attempt?.finishedAt) {
      omitted++;
    }
  });

  const total = rows.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, incorrect, omitted, flagged, total, percentage };
}

export function getUserTests(userId, packageId) {
  const db = getDb();
  
  if (!packageId) {
    console.warn('getUserTests called without packageId');
    return [];
  }

  const pidStr = packageId.toString();

  const tests = db.prepare(`
    SELECT 
      t.*,
      la.id as latestAttemptId,
      COALESCE(s.total, 0) as attemptTotal,
      COALESCE(s.correct, 0) as attemptCorrect,
      COALESCE(s.incorrect, 0) as attemptIncorrect,
      COALESCE(s.omitted, 0) as attemptOmitted,
      COALESCE(s.flagged, 0) as attemptFlagged
    FROM tests t
    LEFT JOIN test_attempts la ON la.id = (
      SELECT id FROM test_attempts
      WHERE testId = t.testId AND finishedAt IS NOT NULL
      ORDER BY finishedAt DESC
      LIMIT 1
    )
    LEFT JOIN (
      SELECT 
        testAttemptId,
        COUNT(*) as total,
        SUM(CASE WHEN selectedOption IS NOT NULL AND selectedOption != '' AND isCorrect = 1 THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN selectedOption IS NOT NULL AND selectedOption != '' AND isCorrect = 0 THEN 1 ELSE 0 END) as incorrect,
        SUM(CASE WHEN (selectedOption IS NULL OR selectedOption = '') THEN 1 ELSE 0 END) as omitted,
        SUM(CASE WHEN isFlagged = 1 THEN 1 ELSE 0 END) as flagged
      FROM test_answers
      GROUP BY testAttemptId
    ) s ON s.testAttemptId = la.id
    WHERE t.userId = ? AND (t.productId = ? OR t.packageId = ?) 
    ORDER BY t.createdAt DESC
  `).all(userId, pidStr, pidStr);

  return tests.map(t => {
    try {
      const safeParse = (str, fallback) => {
        if (!str) return fallback;
        try {
          let parsed = JSON.parse(str);
          // Handle double-stringification
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          return parsed;
        } catch (e) { return fallback; }
      };

      return {
        ...t,
        questions: safeParse(t.questions, []),
        answers: safeParse(t.answers, {}),
        firstAnswers: safeParse(t.firstAnswers, {}),
        markedIds: safeParse(t.markedIds, []),
        pool: safeParse(t.pool, []),
        poolLogic: safeParse(t.poolLogic, {}),
        sessionState: safeParse(t.sessionState, {}),
        isSuspended: !!t.isSuspended,
        latestAttemptId: t.latestAttemptId || null,
        attemptStats: {
          total: Number(t.attemptTotal || 0),
          correct: Number(t.attemptCorrect || 0),
          incorrect: Number(t.attemptIncorrect || 0),
          omitted: Number(t.attemptOmitted || 0),
          flagged: Number(t.attemptFlagged || 0)
        }
      };
    } catch (e) {
      console.error(`Error parsing test ${t.testId}:`, e);
      return { ...t, questions: [], answers: {}, firstAnswers: {}, markedIds: [], pool: [], isSuspended: !!t.isSuspended };
    }
  });
}

export function getTestById(testId, productId) {
  const db = getDb();
  const tidStr = String(testId);
  const pidStr = String(productId);

  console.log(`[Exam Runtime] Fetching details for test ${tidStr}`);

  // Primary lookup by testId. Unique constraint ensures isolation.
  const t = db.prepare('SELECT * FROM tests WHERE testId = ?').get(tidStr);
  if (t) {
    try {
      const safeParse = (str, fallback) => {
        if (!str) return fallback;
        try {
          let parsed = JSON.parse(str);
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          return parsed;
        } catch (e) { return fallback; }
      };

      t.questions = safeParse(t.questions, []);
      t.answers = safeParse(t.answers, {});
      t.firstAnswers = safeParse(t.firstAnswers, {});
      t.markedIds = safeParse(t.markedIds, []);
      t.pool = safeParse(t.pool, []);
      t.poolLogic = safeParse(t.poolLogic, {});
      t.sessionState = safeParse(t.sessionState, {});
      t.isSuspended = !!t.isSuspended;
    } catch (e) {
      console.error(`[Exam Runtime] Error parsing test ${t.testId}:`, e);
      t.questions = []; t.answers = {}; t.firstAnswers = {}; t.markedIds = []; t.pool = []; t.isSuspended = !!t.isSuspended;
    }
  }
  return t;
}

export function deleteTest(testId) {
  const db = getDb();
  db.prepare('DELETE FROM tests WHERE testId = ?').run(testId);
  return true;
}

export function clearUserTests(userId) {
  const db = getDb();
  const now = new Date().toISOString();

  try {
    const transaction = db.transaction(() => {
      // Archive tests
      db.prepare(`
        INSERT INTO tests_archive 
        (testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, markedIds, currentIndex, elapsedTime, isSuspended, packageId, packageName, createdAt, date, archivedAt)
        SELECT testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, markedIds, currentIndex, elapsedTime, isSuspended, packageId, packageName, createdAt, date, ?
        FROM tests WHERE userId = ?
      `).run(now, userId);

      // Date delete
      db.prepare('DELETE FROM tests WHERE userId = ?').run(userId);

      // Cleanup: Remove archives older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('DELETE FROM tests_archive WHERE archivedAt < ?').run(thirtyDaysAgo);
    });

    transaction();
    return true;
  } catch (err) {
    console.error(`DB: Failed to clear tests for user ${userId}:`, err.message);
    throw err;
  }
}

export function restoreUserTests(userId) {
  const db = getDb();
  try {
    const latest = db.prepare('SELECT MAX(archivedAt) as lastArchived FROM tests_archive WHERE userId = ?').get(userId);
    
    if (!latest || !latest.lastArchived) return false;

    const transaction = db.transaction(() => {
      // Restore tests
      db.prepare(`
        INSERT OR REPLACE INTO tests 
        (testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, markedIds, currentIndex, elapsedTime, isSuspended, packageId, packageName, createdAt, date)
        SELECT testId, testNumber, userId, mode, pool, questions, answers, firstAnswers, markedIds, currentIndex, elapsedTime, isSuspended, packageId, packageName, createdAt, date
        FROM tests_archive WHERE userId = ? AND archivedAt = ?
      `).run(userId, latest.lastArchived);
    });

    transaction();
    return true;
  } catch (err) {
    console.error(`DB: Failed to restore tests for user ${userId}:`, err.message);
    return false;
  }
}

// NEW: Universe Forensics & Analytics
export function getProductUniverseAnalytics(packageId) {
    const db = getDb();
    const pidStr = packageId.toString();

    // 1. Core Inventory - check both productId and packageId
    const totalQuestions = db.prepare("SELECT COUNT(*) as count FROM questions WHERE productId = ? OR packageId = ?").get(pidStr, pidStr).count;
    const publishedQuestions = db.prepare("SELECT COUNT(*) as count FROM questions WHERE (productId = ? OR packageId = ?) AND status = 'published' AND isLatest = 1").get(pidStr, pidStr).count;
    
    // 2. Exposure Distribution (Aggregate across all students in this product)
    const exposure = db.prepare(`
        SELECT 
            COUNT(DISTINCT userId) as activeStudents,
            SUM(totalAttempts) as totalProductEngagements,
            AVG(totalAttempts) as avgExposurePerQuestion
        FROM user_questions 
        WHERE (productId = ? OR packageId = ?)
    `).get(pidStr, pidStr);

    // 3. System-level Sizing (For authoring visibility)
    // 3. Behavioral Aggregates (Forensics for Calibration)
    const forensics = db.prepare(`
        SELECT 
            AVG(totalTimeSpent / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgSecondsPerQuestion,
            AVG(totalVolatility / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgVolatility,
            AVG(totalStrikes / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgStrikes,
            SUM(globalCorrect) * 100.0 / SUM(globalAttempts) as aggregateCorrectRate
        FROM questions 
        WHERE (productId = ? OR packageId = ?) AND status = 'published' AND isLatest = 1
    `).get(pidStr, pidStr);

    // 4. System-level Sizing
    const systems = db.prepare(`
        SELECT system, COUNT(*) as count 
        FROM questions 
        WHERE (productId = ? OR packageId = ?) AND status = 'published' AND isLatest = 1
        GROUP BY system
    `).all(pidStr, pidStr);

    return {
        inventory: {
            total: totalQuestions,
            published: publishedQuestions,
            systems
        },
        engagement: exposure,
        forensics: forensics
    };
}


// Analytics functions
export function getGlobalStats(packageId) {
  const db = getDb();
  const pidStr = packageId ? String(packageId) : null;

  console.log(`[Summary Engine] Generating global stats (Product: ${pidStr || 'Full Platform'})`);
  
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  let questionsCountQuery = 'SELECT COUNT(*) as count FROM questions';
  let testsCountQuery = 'SELECT COUNT(*) as count FROM tests';
  let timeQuery = 'SELECT SUM(elapsedTime) as total FROM tests';
  
  if (pidStr) {
    // Goal 4: Filter by packageId for global aggregates
    questionsCountQuery += ' WHERE productId = ? OR packageId = ?';
    testsCountQuery += ' WHERE productId = ? OR packageId = ?';
    timeQuery += ' WHERE productId = ? OR packageId = ?';
  }

  const totalQuestions = pidStr ? db.prepare(questionsCountQuery).get(pidStr, pidStr).count : db.prepare(questionsCountQuery).get().count;
  const totalTests = pidStr ? db.prepare(testsCountQuery).get(pidStr, pidStr).count : db.prepare(testsCountQuery).get().count;
  
  // Last 24h active users
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const dau = db.prepare('SELECT COUNT(*) as count FROM users WHERE updatedAt > ? OR createdAt > ?').get(last24h, last24h).count;
  const paidUsersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE subscriptionStatus = 'active' AND purchased = 1").get().count;
  
  const totalTime = (pidStr ? db.prepare(timeQuery).get(pidStr, pidStr).total : db.prepare(timeQuery).get().total) || 0;
  const avgSeconds = totalTests > 0 ? totalTime / totalTests : 0;
  
  const behavioralQuery = `
    SELECT 
        AVG(totalTimeSpent / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgSeconds,
        AVG(totalVolatility / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgVolatility,
        SUM(globalCorrect) * 100.0 / CAST(NULLIF(SUM(globalAttempts), 0) AS REAL) as avgDifficulty
    FROM questions
    ${pidStr ? 'WHERE productId = ? OR packageId = ?' : ''}
  `;
  const behavioral = pidStr ? db.prepare(behavioralQuery).get(pidStr, pidStr) : db.prepare(behavioralQuery).get();

  return {
    totalUsers,
    paidUsers: paidUsersCount,
    dau,
    avgSession: `${Math.floor(avgSeconds / 60)}m ${Math.round(avgSeconds % 60)}s`,
    totalQuestions,
    totalTests,
    behavioral: behavioral || { avgSeconds: 0, avgVolatility: 0, avgDifficulty: 0 }
  };
}

export function getEngagementData(packageId) {
  if (!packageId) {
    console.warn('getEngagementData called without packageId - failing closed');
    return [];
  }
  const db = getDb();
  let stmt;
  const pidStr = packageId ? packageId.toString() : null;
  if (pidStr) {
    stmt = db.prepare('SELECT createdAt FROM tests WHERE productId = ?');
  } else {
    stmt = db.prepare('SELECT createdAt FROM tests');
  }

  const tests = pidStr ? stmt.all(pidStr) : stmt.all();
  
  // Group by month (simplified)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const last7Months = [];

  for (let i = 6; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      last7Months.push({ name: months[m], val: 0 });
  }

  tests.forEach(t => {
      const date = new Date(t.createdAt);
      const mName = months[date.getMonth()];
      const entry = last7Months.find(e => e.name === mName || e.name === months[date.getUTCMonth()]);
      if (entry) entry.val += 1;
  });

  return last7Months;
}

// NEW: Cognition & Intelligence Operations
export function updateCognitionProfile(userId, packageId, sessionAnalytics) {
  const db = getDb();
  const now = new Date().toISOString();

  // 1. Fetch current profile to average-in new signals
  let profile = db.prepare('SELECT * FROM student_cognition_profiles WHERE userId = ? AND packageId = ?').get(userId, packageId.toString());

  if (!profile) {
    db.prepare(`
      INSERT INTO student_cognition_profiles (userId, packageId, readinessScore, overthinkingIndex, impulsivityIndex, fatigueFactor, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, packageId.toString(), 0, sessionAnalytics.overthinkingScore, sessionAnalytics.impulsivityScore, sessionAnalytics.fatigueFactor, now);
    profile = { overthinkingIndex: sessionAnalytics.overthinkingScore, impulsivityIndex: sessionAnalytics.impulsivityScore, fatigueFactor: sessionAnalytics.fatigueFactor };
  } else {
    // Cumulative Moving Average for indices
    const alpha = 0.3; // Weight for new session
    const newOverthinking = (profile.overthinkingIndex * (1 - alpha)) + (sessionAnalytics.overthinkingScore * alpha);
    const newImpulsivity = (profile.impulsivityIndex * (1 - alpha)) + (sessionAnalytics.impulsivityScore * alpha);
    const newFatigue = (profile.fatigueFactor * (1 - alpha)) + (sessionAnalytics.fatigueFactor * alpha);

    db.prepare(`
      UPDATE student_cognition_profiles SET
        overthinkingIndex = ?,
        impulsivityIndex = ?,
        fatigueFactor = ?,
        updatedAt = ?
      WHERE userId = ? AND packageId = ?
    `).run(newOverthinking, newImpulsivity, newFatigue, now, userId, packageId.toString());
  }

  // 2. Recalculate Readiness (simplified version for now)
  // Calculate aggregate accuracy for THIS product
  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'correct' THEN 1 ELSE 0 END) as correct,
      COUNT(*) as total,
      COUNT(DISTINCT questionId) as uniqueUsed
    FROM user_questions 
    WHERE userId = ? AND packageId = ?
  `).get(userId, packageId.toString());

  const productUniverse = db.prepare('SELECT COUNT(*) as count FROM questions WHERE packageId = ? AND status = "published"').get(packageId).count;
  
  const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
  const exposure = productUniverse > 0 ? stats.uniqueUsed / productUniverse : 0;
  
  // Readiness Score Logic: Accuracy scaled by exposure
  const readiness = Math.round(accuracy * 100 * (0.7 + (0.3 * exposure)));

  db.prepare('UPDATE student_cognition_profiles SET readinessScore = ? WHERE userId = ? AND packageId = ?')
    .run(readiness, userId, packageId.toString());

  return true;
}

export function getUserProductStats(userId, packageId) {
  if (!userId || !packageId) {
    console.warn('getUserProductStats called without userId or packageId');
    return { accuracy: 0, usage: 0, completedTests: 0, totalQuestions: 0, attemptedQuestions: 0 };
  }
  
  const db = getDb();
  const pidStr = packageId.toString();
  const pidInt = parseInt(packageId);

  // 1. Get total published questions for this product
  const productUniverse = db.prepare('SELECT COUNT(*) as count FROM questions WHERE (productId = ? OR packageId = ?) AND status = "published" AND isLatest = 1').get(pidStr, pidStr).count;

  // 2. Get user progress for this product
  const userProgress = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'correct' THEN 1 ELSE 0 END) as correct,
      SUM(CASE WHEN status = 'incorrect' THEN 1 ELSE 0 END) as incorrect,
      SUM(CASE WHEN status = 'omitted' THEN 1 ELSE 0 END) as omitted,
      COUNT(DISTINCT questionId) as uniqueUsed
    FROM user_questions 
    WHERE userId = ? AND (productId = ? OR packageId = ?)
  `).get(userId, pidStr, pidStr);

  // 3. Get completed tests count
  const completedTests = db.prepare('SELECT COUNT(*) as count FROM tests WHERE userId = ? AND (productId = ? OR packageId = ?) AND isSuspended = 0').get(userId, pidStr, pidStr).count;

  // 4. Get performance stats (Time & Validated Accuracy)
  const perfStats = getPerformanceStats(userId, pidStr);

  const attempted = (userProgress.correct || 0) + (userProgress.incorrect || 0);
  const totalAnswered = attempted + (userProgress.omitted || 0);
  const accuracy = attempted > 0 ? Math.round((userProgress.correct / attempted) * 100) : 0;
  const usagePerc = productUniverse > 0 ? Math.round((userProgress.uniqueUsed / productUniverse) * 100) : 0;

  return {
    accuracy,
    usage: usagePerc,
    completedTests,
    totalQuestions: productUniverse,
    attemptedQuestions: attempted,
    totalAnswered,
    correctAnswers: userProgress.correct || 0,
    incorrectAnswers: userProgress.incorrect || 0,
    omittedAnswers: userProgress.omitted || 0,
    usedQuestions: userProgress.uniqueUsed || 0,
    unusedQuestions: Math.max(0, productUniverse - (userProgress.uniqueUsed || 0)),
    // New Performance Metrics
    totalTime: perfStats?.totalTime || 0,
    avgTime: Math.round(perfStats?.avgTime || 0)
  };
}

// Phase 2: Content Governance Logic (Standardized on governance_history)
export function logGovernanceAction(entry) {
  let conceptId = entry.conceptId;
  
  // Auto-resolve conceptId if missing (often occurs in status transitions)
  if (!conceptId && entry.questionId) {
    const db = getDb();
    const q = db.prepare('SELECT conceptId FROM questions WHERE id = ?').get(entry.questionId);
    if (q) conceptId = q.conceptId;
  }

  logGovernanceHistory({
    versionId: entry.questionId,
    conceptId: conceptId,
    fromState: entry.fromState,
    toState: entry.toState,
    performedBy: entry.actorId,
    notes: entry.reason
  });
  return true;
}

// Product operations
export function getAllProducts() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM products WHERE isDeleted = 0 ORDER BY name ASC').all();
    return rows.map(mapProductRow);
  } catch (err) {
    console.error('DB: Failed to get all products:', err.message);
    return [];
  }
}

export function getPublishedProducts() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM products WHERE isActive = 1 AND isDeleted = 0 ORDER BY name ASC').all();
    return rows.map(mapProductRow);
  } catch (err) {
    console.error('DB: Failed to get published products:', err.message);
    return [];
  }
}

export function getProductById(id) {
  try {
    const db = getDb();
    const p = db.prepare('SELECT * FROM products WHERE id = ? AND isDeleted = 0').get(id);
    return mapProductRow(p);
  } catch (err) {
    console.error(`DB: Failed to get product ${id}:`, err.message);
    return null;
  }
}

// New function to get product including deleted ones (for existing user access)
export function getProductByIdIncludeDeleted(id) {
  try {
    const db = getDb();
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return mapProductRow(p);
  } catch (err) {
    console.error(`DB: Failed to get product ${id}:`, err.message);
    return null;
  }
}

export function createProduct(product) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO products (name, slug, duration_days, price, description, templateType, systems, subjects, plans, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    product.name, 
    product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
    product.duration_days || 0, 
    product.price || 0, 
    product.description || '', 
    product.templateType || 'DEFAULT',
    JSON.stringify(product.systems || []),
    JSON.stringify(product.subjects || []),
    JSON.stringify(product.plans || []),
    new Date().toISOString(),
    1
  );
  return getProductById(info.lastInsertRowid);
}

export function updateProduct(product) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE products SET
      name = ?, duration_days = ?, price = ?, description = ?, isActive = ?, templateType = ?, systems = ?, subjects = ?, plans = ?, updatedAt = ?
    WHERE id = ?
  `);
  stmt.run(
    product.name, 
    product.duration_days || 0, 
    product.price || 0, 
    product.description, 
    product.isActive ? 1 : 0, 
    product.templateType || 'DEFAULT',
    JSON.stringify(product.systems || []),
    JSON.stringify(product.subjects || []),
    JSON.stringify(product.plans || []),
    new Date().toISOString(),
    product.id
  );
  return getProductById(product.id);
}

export function deleteProduct(id) {
  try {
    const db = getDb();
    
    // Check if product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // PERMANENT DELETE: Remove from database completely
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      throw new Error('Failed to delete product from database');
    }
    
    // Also cleanup related mappings if necessary
    // Note: If you want to delete questions linked to this product, you'd add that here.
    // However, usually questions might belong to multiple products via packageId.

    console.log(`Product ${id} ("${product.name}") PERMANENTLY deleted from database`);
    return true;
  } catch (err) {
    console.error(`DB: Failed to permanently delete product ${id}:`, err.message);
    throw err;
  }
}

// Notification Operations
export function createNotification(type, message, userId = null, metadata = null) {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO notifications (type, message, userId, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      type,
      message,
      userId,
      metadata ? JSON.stringify(metadata) : null,
      new Date().toISOString()
    );
    return info.lastInsertRowid;
  } catch (err) {
    console.error('DB: Failed to create notification:', err.message);
    return null;
  }
}

export function getNotifications(limit = 50, onlyUnread = false) {
  try {
    const db = getDb();
    let query = 'SELECT * FROM notifications';
    if (onlyUnread) query += ' WHERE isRead = 0';
    query += ' ORDER BY createdAt DESC LIMIT ?';
    
    const stmt = db.prepare(query);
    return stmt.all(limit).map(n => ({
      ...n,
      isRead: !!n.isRead,
      metadata: n.metadata ? JSON.parse(n.metadata) : null
    }));
  } catch (err) {
    console.error('DB: Failed to fetch notifications:', err.message);
    return [];
  }
}

export function markNotificationRead(id) {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(id);
    return true;
  } catch (err) {
    console.error('DB: Failed to mark notification as read:', err.message);
    return false;
  }
}

/**
 * Get Governance History for a specific version or concept
 */
export function getGovernanceHistory(versionId, conceptId) {
    const db = getDb();
    let query = 'SELECT * FROM governance_history';
    let params = [];
    
    if (versionId) {
        query += ' WHERE versionId = ?';
        params.push(versionId);
    } else if (conceptId) {
        query += ' WHERE conceptId = ?';
        params.push(conceptId);
    } else {
        return [];
    }
    
    query += ' ORDER BY performedAt DESC';
    return db.prepare(query).all(...params);
}

/**
 * SAFE DB WRAPPER
 * Use this to debug database connection issues without modifying existing code.
 * Wraps getDb() with comprehensive error logging.
 */
export function safeGetDb() {
  try {
    console.log("🧠 safeGetDb() called");
    const database = getDb();
    console.log("✅ DB instance ready:", !!database);
    return database;
  } catch (e) {
    console.error("🔥 DATABASE CRASH ORIGIN:", e.message);
    console.error("📍 Stack trace:", e.stack);
    throw e;
  }
}

// Question CRUD operations
export function getAllQuestions(productId = null, includeUnpublished = false) {
  const db = getDb();
  let query = `
    SELECT q.*, p.name as productName 
    FROM questions q 
    LEFT JOIN products p ON q.productId = p.id
  `;
  const params = [];
  
  if (productId) {
    query += ` WHERE (q.productId = ? OR q.packageId = ?)`;
    params.push(productId, productId);
  }
  
  if (!includeUnpublished) {
    query += productId ? ` AND q.status = 'published' AND q.isLatest = 1` : ` WHERE q.status = 'published' AND q.isLatest = 1`;
  }
  
  query += ` ORDER BY q.createdAt DESC`;
  
  const questions = db.prepare(query).all(...params);
  return questions.map(q => ({
    ...q,
    choices: safeParse(q.choices, []),
    stemImage: safeParse(q.stemImage, {}),
    explanationCorrectImage: safeParse(q.explanationCorrectImage, {}),
    explanationWrongImage: safeParse(q.explanationWrongImage, {}),
    summaryImage: safeParse(q.summaryImage, {}),
    tags: safeParse(q.tags, []),
    choiceDistribution: safeParse(q.choiceDistribution, {}),
    published: !!q.published,
    isLatest: !!q.isLatest
  }));
}

export function getQuestionById(id) {
  const db = getDb();
  const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  if (!q) return null;
  
  return {
    ...q,
    choices: safeParse(q.choices, []),
    stemImage: safeParse(q.stemImage, {}),
    explanationCorrectImage: safeParse(q.explanationCorrectImage, {}),
    explanationWrongImage: safeParse(q.explanationWrongImage, {}),
    summaryImage: safeParse(q.summaryImage, {}),
    tags: safeParse(q.tags, []),
    choiceDistribution: safeParse(q.choiceDistribution, {}),
    published: !!q.published,
    isLatest: !!q.isLatest
  };
}

export function createQuestion(question) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO questions (
      id, stem, stemImage, choices, correct, explanation, explanationCorrect, explanationCorrectImage,
      explanationWrong, explanationWrongImage, summary, summaryImage, subject, system, topic,
      difficulty, cognitiveLevel, type, published, createdAt, updatedAt, packageId, productId,
      conceptId, status, versionNumber, isLatest, globalAttempts, globalCorrect,
      choiceDistribution, totalTimeSpent, totalVolatility, totalStrikes, totalMarks, tags
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    question.id,
    question.stem,
    JSON.stringify(question.stemImage || {}),
    JSON.stringify(question.choices || []),
    question.correct,
    question.explanation || null,
    question.explanationCorrect || null,
    JSON.stringify(question.explanationCorrectImage || {}),
    question.explanationWrong || null,
    JSON.stringify(question.explanationWrongImage || {}),
    question.summary || null,
    JSON.stringify(question.summaryImage || {}),
    question.subject || null,
    question.system || null,
    question.topic || null,
    question.difficulty || 'medium',
    question.cognitiveLevel || 'understanding',
    question.type || 'multiple-choice',
    question.published ? 1 : 0,
    question.createdAt || new Date().toISOString(),
    question.updatedAt || new Date().toISOString(),
    question.packageId || null,
    question.productId || null,
    question.conceptId || null,
    question.status || 'draft',
    question.versionNumber || 1,
    question.isLatest ? 1 : 0,
    question.globalAttempts || 0,
    question.globalCorrect || 0,
    JSON.stringify(question.choiceDistribution || {}),
    question.totalTimeSpent || 0,
    question.totalVolatility || 0,
    question.totalStrikes || 0,
    question.totalMarks || 0,
    JSON.stringify(question.tags || [])
  );
  
  return question;
}

export function updateQuestion(id, updates) {
  const db = getDb();

  // WHITELIST: Only editable question content fields
  // NEVER update: id, conceptId, packageId, productId, createdAt, versionNumber
  const EDITABLE_FIELDS = [
    'stem', 'stemImage', 'stemImageMode',
    'choices', 'correct',
    'explanationCorrect', 'explanationCorrectImage',
    'explanationWrong', 'explanationWrongImage',
    'summary', 'summaryImage',
    'explanationImageMode',
    'system', 'subject', 'topic',
    'difficulty', 'cognitiveLevel', 'type',
    'references', 'tags',
    'status', 'published', 'isLatest',
    'globalAttempts', 'globalCorrect', 'choiceDistribution',
    'totalTimeSpent', 'totalVolatility', 'totalStrikes', 'totalMarks'
  ];

  const fields = [];
  const params = [];
  
  // First, fetch the existing question to preserve relational fields
  const existing = getQuestionById(id);
  if (!existing) {
    throw new Error(`Question ${id} not found`);
  }

  Object.keys(updates).forEach(key => {
    // Skip non-editable fields
    if (!EDITABLE_FIELDS.includes(key)) {
      console.warn(`updateQuestion: Ignoring non-editable field "${key}"`);
      return;
    }

    // Skip null/undefined values to prevent overwriting existing data
    if (updates[key] === null || updates[key] === undefined) {
      console.warn(`updateQuestion: Skipping null/undefined value for "${key}"`);
      return;
    }

    // JSON fields
    if (['choices', 'stemImage', 'explanationCorrectImage', 'explanationWrongImage', 'summaryImage', 'tags', 'choiceDistribution'].includes(key)) {
      fields.push(`"${key}" = ?`);
      params.push(JSON.stringify(updates[key]));
    }
    // Boolean/Integer fields
    else if (['published', 'isLatest'].includes(key)) {
      fields.push(`"${key}" = ?`);
      params.push(updates[key] ? 1 : 0);
    }
    // Regular fields
    else {
      fields.push(`"${key}" = ?`);
      params.push(updates[key]);
    }
  });
  
  // Always update the timestamp
  fields.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  if (fields.length === 1) {
    // Only updatedAt would be set, nothing else to update
    console.warn('updateQuestion: No valid editable fields to update');
    return existing;
  }

  console.log(`updateQuestion: Updating question ${id} with fields:`, fields.map(f => f.split(' = ')[0]));
  db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  return getQuestionById(id);
}

export function deleteQuestion(id) {
  const db = getDb();
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  return true;
}

export function updateQuestionStats(questionId, stats) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE questions SET
      globalAttempts = COALESCE(globalAttempts, 0) + ?,
      globalCorrect = COALESCE(globalCorrect, 0) + ?,
      totalTimeSpent = COALESCE(totalTimeSpent, 0) + ?,
      totalVolatility = COALESCE(totalVolatility, 0) + ?,
      totalStrikes = COALESCE(totalStrikes, 0) + ?,
      totalMarks = COALESCE(totalMarks, 0) + ?,
      choiceDistribution = ?,
      updatedAt = ?
    WHERE id = ?
  `);
  
  stmt.run(
    stats.globalAttempts || 0,
    stats.globalCorrect || 0,
    stats.totalTimeSpent || 0,
    stats.totalVolatility || 0,
    stats.totalStrikes || 0,
    stats.totalMarks || 0,
    JSON.stringify(stats.choiceDistribution || {}),
    new Date().toISOString(),
    questionId
  );
  
  return true;
}

// Governance functions (stubs for now)
export function submitQuestionForReview(questionId, userId) {
  logGovernanceAction({
    questionId,
    conceptId: null,
    fromState: 'draft',
    toState: 'review',
    actorId: userId,
    reason: 'Submitted for review'
  });
  return updateQuestion(questionId, { status: 'review' });
}

export function approveQuestion(questionId, userId) {
  logGovernanceAction({
    questionId,
    conceptId: null,
    fromState: 'review',
    toState: 'published',
    actorId: userId,
    reason: 'Approved'
  });
  return updateQuestion(questionId, { status: 'published' });
}

export function publishQuestion(questionId, userId) {
  return approveQuestion(questionId, userId);
}

export function deprecateQuestion(questionId, userId) {
  logGovernanceAction({
    questionId,
    conceptId: null,
    fromState: 'published',
    toState: 'deprecated',
    actorId: userId,
    reason: 'Deprecated'
  });
  return updateQuestion(questionId, { status: 'deprecated' });
}

export function reviseQuestion(questionId, updates, userId) {
  logGovernanceAction({
    questionId,
    conceptId: null,
    fromState: 'published',
    toState: 'draft',
    actorId: userId,
    reason: 'Revised'
  });
  return updateQuestion(questionId, { ...updates, status: 'draft' });
}

// Internal helper for product data normalization
function mapProductRow(p) {
  if (!p) return null;
  
  const safeParse = (str, fallback) => {
    if (!str) return fallback;
    try {
      let parsed = JSON.parse(str);
      // Double parsing in case it was double-stringified
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed;
    } catch (e) {
      console.warn('DB Mapping: Failed to parse JSON column:', e.message, str);
      return fallback; 
    }
  };

  return {
    ...p,
    isActive: !!p.isActive,
    is_published: !!(p.isActive || p.is_published),
    templateType: p.templateType || 'DEFAULT',
    systems: safeParse(p.systems, []),
    subjects: safeParse(p.subjects, []),
    plans: safeParse(p.plans, []),
    defaultCreateTestConfig: safeParse(p.defaultCreateTestConfig, {
      columns: ["system", "difficulty"],
      modes: ["timed", "tutor"],
      blockSize: 40,
      negativeMarking: false
    })
  };
}

export function logGovernanceHistory(entry) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO governance_history (versionId, conceptId, fromState, toState, performedBy, performedAt, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    entry.versionId,
    entry.conceptId,
    entry.fromState,
    entry.toState,
    entry.performedBy,
    entry.performedAt || new Date().toISOString(),
    entry.notes || null
  );
  return true;
}

/**
 * SAFE QUESTION CREATE WRAPPER
 * Wraps createQuestion() with comprehensive error logging.
 */
export function safeCreateQuestion(q) {
  try {
    const pidStr = String(q.packageId || q.productId);
    console.log("📝 safeCreateQuestion() called with:", {
      id: q.id,
      packageId: pidStr,
      system: q.system,
      subject: q.subject,
      choicesCount: q.choices?.length
    });
    const result = createQuestion({ ...q, packageId: pidStr, productId: pidStr });
    console.log("✅ Question created successfully:", result.id);
    return result;
  } catch (e) {
    console.error("🔥 CREATE QUESTION CRASH:", e.message);
    console.error("📍 Stack trace:", e.stack);
    throw e;
  }
}
export function addStudentAnswer({ userId, testId, productId, questionId, answer, isCorrect }) {
  const db = getDb();
  const id = crypto.randomUUID();
  const pidStr = String(productId);
  const uidStr = String(userId);
  const qidStr = String(questionId);
  const tidStr = String(testId);
  
  try {
      db.prepare(`
        INSERT INTO student_answers (id, studentId, testId, productId, packageId, questionId, answer, isCorrect)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, uidStr, tidStr, pidStr, pidStr, qidStr, answer, isCorrect ? 1 : 0);
      return true;
  } catch (e) {
      console.error('[Summary Engine] Error adding student answer:', e);
      return false;
  }
}

// Fetch student results per product using the view for full isolation
export function fetchResultsByProduct(userId, productId) {
  const db = getDb();
  const uidStr = String(userId);
  const pidStr = String(productId);
  return db.prepare(`
    SELECT *
    FROM student_answers_per_product
    WHERE studentId = ? AND (productId = ? OR packageId = ?)
  `).all(uidStr, pidStr, pidStr);
}

// 1️⃣ Fetch all active subscriptions for a student
export function fetchActiveSubscriptions(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT *
    FROM subscriptions
    WHERE userId = ? AND status = 'active'
  `).all(userId);
}

// 2️⃣ Update test creation/save to use the selected subscription
export function saveStudentAnswer(answer) {
  const db = getDb();
  const id = crypto.randomUUID();

  // Ensure we always have a valid packageId
  const packageIdStr = String(answer.packageId || answer.productId || '');
  if (!packageIdStr) throw new Error('No packageId specified for this answer');

  const userIdStr = String(answer.studentId || answer.userId);
  const testIdStr = String(answer.testId);

  try {
    db.prepare(`
      INSERT INTO student_answers (id, studentId, testId, answerData, productId, packageId, submittedAt, questionId, answer, isCorrect)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userIdStr,
      testIdStr,
      JSON.stringify(answer.answerData || {}),
      packageIdStr,
      packageIdStr,
      answer.submittedAt || new Date().toISOString(),
      String(answer.questionId || ''),
      answer.answer || null,
      answer.isCorrect ? 1 : 0
    );
    console.log(`[Summary Engine] Saved answer for student ${userIdStr} under product ${packageIdStr}`);
    return true;
  } catch (e) {
    console.error('[Summary Engine] Error saving student answer:', e);
    return false;
  }
}

// 3️⃣ Update student dashboard to list all active products
export function fetchStudentProducts(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT s.*, p.name AS productName
    FROM subscriptions s
    LEFT JOIN subscription_packages p ON CAST(p.id AS TEXT) = s.packageId
    WHERE s.userId = ? AND s.status = 'active'
  `).all(userId);
}

import { getDb } from "../server-db";

export function getProductUniverseAnalytics(packageId) {
  const db = getDb();
  const pidStr = packageId.toString();

  const totalQuestions = db.prepare("SELECT COUNT(*) as count FROM questions WHERE productId = ? OR packageId = ?").get(pidStr, pidStr).count;
  const publishedQuestions = db.prepare("SELECT COUNT(*) as count FROM questions WHERE (productId = ? OR packageId = ?) AND status = 'published' AND isLatest = 1").get(pidStr, pidStr).count;

  const exposure = db
    .prepare(`
        SELECT
            COUNT(DISTINCT userId) as activeStudents,
            SUM(totalAttempts) as totalProductEngagements,
            AVG(totalAttempts) as avgExposurePerQuestion
        FROM user_questions
        WHERE (productId = ? OR packageId = ?)
    `)
    .get(pidStr, pidStr);

  const forensics = db
    .prepare(`
        SELECT
            AVG(totalTimeSpent / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgSecondsPerQuestion,
            AVG(totalVolatility / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgVolatility,
            AVG(totalStrikes / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgStrikes,
            SUM(globalCorrect) * 100.0 / SUM(globalAttempts) as aggregateCorrectRate
        FROM questions
        WHERE (productId = ? OR packageId = ?) AND status = 'published' AND isLatest = 1
    `)
    .get(pidStr, pidStr);

  const systems = db
    .prepare(`
        SELECT system, COUNT(*) as count
        FROM questions
        WHERE (productId = ? OR packageId = ?) AND status = 'published' AND isLatest = 1
        GROUP BY system
    `)
    .all(pidStr, pidStr);

  return {
    inventory: {
      total: totalQuestions,
      published: publishedQuestions,
      systems,
    },
    engagement: exposure,
    forensics,
  };
}

export function getGlobalStats(packageId) {
  const db = getDb();
  const pidStr = packageId ? String(packageId) : null;

  console.log(`[Summary Engine] Generating global stats (Product: ${pidStr || "Full Platform"})`);

  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;

  let questionsCountQuery = "SELECT COUNT(*) as count FROM questions";
  let testsCountQuery = "SELECT COUNT(*) as count FROM tests";
  let timeQuery = "SELECT SUM(elapsedTime) as total FROM tests";

  if (pidStr) {
    questionsCountQuery += " WHERE productId = ? OR packageId = ?";
    testsCountQuery += " WHERE productId = ? OR packageId = ?";
    timeQuery += " WHERE productId = ? OR packageId = ?";
  }

  const totalQuestions = pidStr ? db.prepare(questionsCountQuery).get(pidStr, pidStr).count : db.prepare(questionsCountQuery).get().count;
  const totalTests = pidStr ? db.prepare(testsCountQuery).get(pidStr, pidStr).count : db.prepare(testsCountQuery).get().count;

  const publishedCountQuery = `
    SELECT COUNT(*) as count
    FROM questions
    WHERE (status = 'published' OR published = 1)
    ${pidStr ? "AND (productId = ? OR packageId = ?)" : ""}
  `;
  const publishedCount = pidStr
    ? db.prepare(publishedCountQuery).get(pidStr, pidStr).count
    : db.prepare(publishedCountQuery).get().count;
  const draftCount = Math.max(0, totalQuestions - publishedCount);

  const topSystemsQuery = `
    SELECT system as name, COUNT(*) as val
    FROM questions
    WHERE system IS NOT NULL AND TRIM(system) <> ''
    ${pidStr ? "AND (productId = ? OR packageId = ?)" : ""}
    GROUP BY system
    ORDER BY val DESC
    LIMIT 5
  `;
  const topSystems = pidStr
    ? db.prepare(topSystemsQuery).all(pidStr, pidStr)
    : db.prepare(topSystemsQuery).all();

  const recentQuestionsQuery = `
    SELECT id, published, updatedAt, createdAt
    FROM questions
    ${pidStr ? "WHERE (productId = ? OR packageId = ?)" : ""}
    ORDER BY COALESCE(updatedAt, createdAt) DESC
    LIMIT 5
  `;
  const recentQuestions = pidStr
    ? db.prepare(recentQuestionsQuery).all(pidStr, pidStr)
    : db.prepare(recentQuestionsQuery).all();

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const dau = db.prepare("SELECT COUNT(*) as count FROM users WHERE updatedAt > ? OR createdAt > ?").get(last24h, last24h).count;
  const paidUsersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE subscriptionStatus = 'active' AND purchased = 1").get().count;

  const totalTime = (pidStr ? db.prepare(timeQuery).get(pidStr, pidStr).total : db.prepare(timeQuery).get().total) || 0;
  const avgSeconds = totalTests > 0 ? totalTime / totalTests : 0;

  const behavioralQuery = `
    SELECT
        AVG(totalTimeSpent / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgSeconds,
        AVG(totalVolatility / CAST(NULLIF(globalAttempts, 0) AS REAL)) as avgVolatility,
        SUM(globalCorrect) * 100.0 / CAST(NULLIF(SUM(globalAttempts), 0) AS REAL) as avgCorrectRate
    FROM questions
    ${pidStr ? "WHERE productId = ? OR packageId = ?" : ""}
  `;
  const behavioral = pidStr ? db.prepare(behavioralQuery).get(pidStr, pidStr) : db.prepare(behavioralQuery).get();

  return {
    totalUsers,
    paidUsers: paidUsersCount,
    dau,
    avgSession: `${Math.floor(avgSeconds / 60)}m ${Math.round(avgSeconds % 60)}s`,
    totalQuestions,
    publishedCount,
    draftCount,
    systemData: topSystems,
    recentQuestions,
    totalTests,
    behavioral: behavioral || { avgSeconds: 0, avgVolatility: 0, avgCorrectRate: 0 },
  };
}

export function getEngagementData(packageId) {
  if (!packageId) {
    console.warn("getEngagementData called without packageId - failing closed");
    return [];
  }
  const db = getDb();
  let stmt;
  const pidStr = packageId ? packageId.toString() : null;
  if (pidStr) {
    stmt = db.prepare("SELECT createdAt FROM tests WHERE productId = ?");
  } else {
    stmt = db.prepare("SELECT createdAt FROM tests");
  }

  const tests = pidStr ? stmt.all(pidStr) : stmt.all();

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const last7Months = [];

  for (let i = 6; i >= 0; i--) {
    const m = (currentMonth - i + 12) % 12;
    last7Months.push({ name: months[m], val: 0 });
  }

  tests.forEach((t) => {
    const date = new Date(t.createdAt);
    const mName = months[date.getMonth()];
    const entry = last7Months.find((e) => e.name === mName || e.name === months[date.getUTCMonth()]);
    if (entry) entry.val += 1;
  });

  return last7Months;
}

export function getAllProducts() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM products WHERE isDeleted = 0 ORDER BY name ASC").all();
    return rows.map(mapProductRow);
  } catch (err) {
    console.error("DB: Failed to get all products:", err.message);
    return [];
  }
}

export function getPublishedProducts() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM products WHERE isActive = 1 AND isDeleted = 0 ORDER BY name ASC").all();
    return rows.map(mapProductRow);
  } catch (err) {
    console.error("DB: Failed to get published products:", err.message);
    return [];
  }
}

export function getProductById(id) {
  try {
    const db = getDb();
    const p = db.prepare("SELECT * FROM products WHERE id = ? AND isDeleted = 0").get(id);
    return mapProductRow(p);
  } catch (err) {
    console.error(`DB: Failed to get product ${id}:`, err.message);
    return null;
  }
}

export function getProductByIdIncludeDeleted(id) {
  try {
    const db = getDb();
    const p = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    return mapProductRow(p);
  } catch (err) {
    console.error(`DB: Failed to get product ${id}:`, err.message);
    return null;
  }
}

export function createProduct(product) {
  const db = getDb();
  const stmt = db.prepare("INSERT INTO products (name, slug, duration_days, price, description, templateType, systems, subjects, plans, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const info = stmt.run(
    product.name,
    product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
    product.duration_days || 0,
    product.price || 0,
    product.description || "",
    product.templateType || "DEFAULT",
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
    product.templateType || "DEFAULT",
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

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);

    if (result.changes === 0) {
      throw new Error("Failed to delete product from database");
    }

    console.log(`Product ${id} ("${product.name}") PERMANENTLY deleted from database`);
    return true;
  } catch (err) {
    console.error(`DB: Failed to permanently delete product ${id}:`, err.message);
    throw err;
  }
}

function mapProductRow(p) {
  if (!p) return null;

  const safeParse = (str, fallback) => {
    if (!str) return fallback;
    try {
      let parsed = JSON.parse(str);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      return parsed;
    } catch (e) {
      console.warn("DB Mapping: Failed to parse JSON column:", e.message, str);
      return fallback;
    }
  };

  const parsedConfig = safeParse(p.defaultCreateTestConfig, {
    columns: ["system"],
    modes: ["timed", "tutor"],
    blockSize: 40,
    negativeMarking: false,
  });
  const normalizedColumns = Array.isArray(parsedConfig?.columns)
    ? parsedConfig.columns.filter((c) => String(c).toLowerCase() !== "difficulty")
    : ["system"];

  return {
    ...p,
    isActive: !!p.isActive,
    is_published: !!(p.isActive || p.is_published),
    templateType: p.templateType || "DEFAULT",
    systems: safeParse(p.systems, []),
    subjects: safeParse(p.subjects, []),
    plans: safeParse(p.plans, []),
    defaultCreateTestConfig: {
      ...parsedConfig,
      columns: normalizedColumns,
    },
  };
}

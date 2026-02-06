





let dbs = {};

export function openDB(name = "global") {
  // Use "medbank" as the platform database for backward compatibility with existing data
  const dbName = name === "global" ? "medbank" : `medbank_user_${name}`;

  return new Promise((resolve, reject) => {
    if (dbs[dbName]) return resolve(dbs[dbName]);

    const request = indexedDB.open(dbName, 2);

    request.onerror = () => reject(`Failed to open DB: ${dbName}`);

    request.onsuccess = () => {
      dbs[dbName] = request.result;
      resolve(dbName === "medbank" ? resolvePlatformSchema(dbs[dbName]) : resolveUserSchema(dbs[dbName]));
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      const transaction = e.target.transaction;

      // Users store
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" });
      }

      // Questions store
      if (!db.objectStoreNames.contains("questions")) {
        db.createObjectStore("questions", { keyPath: "id" });
      }

      // Tests store - Migration: change keyPath from "id" to "testId"
      if (db.objectStoreNames.contains("tests")) {
        const testStore = transaction.objectStore("tests");
        if (testStore.keyPath !== "testId") {
          db.deleteObjectStore("tests");
          db.createObjectStore("tests", { keyPath: "testId" });
        }
      } else {
        db.createObjectStore("tests", { keyPath: "testId" });
      }

      // Planner store
      if (!db.objectStoreNames.contains("planner")) {
        db.createObjectStore("planner", { keyPath: "id" });
      }
    };
  });
}

function resolvePlatformSchema(db) {
  return db;
}
function resolveUserSchema(db) {
  return db;
}

let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open("medbank", 1);

    request.onerror = () => reject("Failed to open DB");

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("questions")) {
        db.createObjectStore("questions", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("tests")) {
        db.createObjectStore("tests", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("planner")) {
        db.createObjectStore("planner", { keyPath: "id" });
      }
    };
  });
}

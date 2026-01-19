import { openDB } from "@/lib/db";

export async function addQuestion(question) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");
    store.put(question);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject("Add question failed");
  });
}

export async function getAllQuestions() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("questions", "readonly");
    const store = tx.objectStore("questions");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getQuestionById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("questions", "readonly");
    const store = tx.objectStore("questions");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Get question failed");
  });
}

export async function updateQuestion(updatedQuestion) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");
    const request = store.put(updatedQuestion);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject("Update question failed");
  });
}

export async function deleteQuestion(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject("Delete question failed");
  });
}

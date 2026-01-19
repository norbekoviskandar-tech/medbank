import { openDB } from "@/lib/db";

export async function addUser(user) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    store.put(user);
    tx.oncomplete = () => {
      localStorage.setItem('medbank_users_updated', Date.now().toString());
      resolve(true);
    };
    tx.onerror = () => reject("Add user failed");
  });
}

export async function getUserByEmail(email) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const request = store.getAll();

    request.onsuccess = () => {
      const user = request.result.find(u => u.email === email);
      resolve(user);
    };
  });
}

export async function getUserById(id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAllUsers() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("users", "readonly");
    const store = tx.objectStore("users");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}
export async function updateUser(user) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    store.put(user);
    tx.oncomplete = () => {
      localStorage.setItem('medbank_users_updated', Date.now().toString());
      resolve(true);
    };
    tx.onerror = () => reject("Update user failed");
  });
}

export async function deleteUser(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const store = tx.objectStore("users");
    store.delete(id);
    tx.oncomplete = () => {
      localStorage.setItem('medbank_users_updated', Date.now().toString());
      resolve(true);
    };
    tx.onerror = () => reject("Delete user failed");
  });
}

export async function activateUserSubscription(id) {
  const user = await getUserById(id);
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  const days = user.purchased ? 90 : 3;
  const expiry = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000)); 

  const updatedUser = {
    ...user,
    subscriptionStatus: 'active',
    activatedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    activatedByPurchase: !!user.purchased
  };
  
 await updateUser(updatedUser);
 return updatedUser;
}
 export async function renewUserSubscription(id) {
  const user = await getUserById(id);
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  let baseDate = now;

  // If subscription is active and was a paid one, extend from current expiry
  if (user.subscriptionStatus === 'active' && user.activatedByPurchase && user.expiresAt) {
    const currentExpiry = new Date(user.expiresAt);
    if (currentExpiry > now) {
      baseDate = currentExpiry;
    }
  }

  const expiry = new Date(baseDate.getTime() + (90 * 24 * 60 * 60 * 1000)); 

  const updatedUser = {
    ...user,
    subscriptionStatus: 'active',
    purchased: true,
    activatedByPurchase: true,
    expiresAt: expiry.toISOString(),
    lastRenewedAt: now.toISOString()
  };
  
  await updateUser(updatedUser);
  return updatedUser;
}

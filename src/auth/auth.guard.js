export function getCurrentUserId() {
  return localStorage.getItem("medbank_user");
}

export function requireAuth(router) {
  const userId = getCurrentUserId();
  if (!userId) {
    router.push("/login");
  }
}

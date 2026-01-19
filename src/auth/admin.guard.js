import { getCurrentUserId } from "./auth.guard";
import { getAllUsers } from "@/services/user.service";

export async function requireAdmin(router) {
  const userId = getCurrentUserId();
  if (!userId) return router.push("/login");

  const users = await getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role !== "admin") router.push("/app/dashboard");
}

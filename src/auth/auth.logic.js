import { getUserByEmail, addUser } from "@/services/user.service";
import { hashPassword } from "@/utils/crypto";
import { createUser } from "@/models/user.model";

export async function registerUser(name, email, password, role = "student") {
  const existing = await getUserByEmail(email);
  if (existing) throw "User already exists";

  const passwordHash = await hashPassword(password);

  const user = createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role
  });

  await addUser(user);
  return user;
}

export async function loginUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) throw "User not found";

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) throw "Wrong password";

  localStorage.setItem("medbank_user", user.id);
  return user;
}

export async function changeUserPassword(userId, oldPassword, newPassword) {
  const { getUserById, updateUser } = await import("@/services/user.service");
  const user = await getUserById(userId);
  if (!user) throw "User not found";

  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.passwordHash) throw "Current password incorrect";

  const newHash = await hashPassword(newPassword);
  user.passwordHash = newHash;
  await updateUser(user);
  return true;
}

export function logout() {
  localStorage.removeItem("medbank_user");
}

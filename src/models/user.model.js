export function createUser({ id, name, email, passwordHash, role }) {
  return {
    id,
    name,
    email,
    passwordHash,
    role, // "author" | "student"
    subscriptionStatus: "trial",
    purchased: false,
    createdAt: new Date().toISOString(),
    stats: {
      attempted: 0,
      correct: 0,
      tests: 0
    }
  };
}

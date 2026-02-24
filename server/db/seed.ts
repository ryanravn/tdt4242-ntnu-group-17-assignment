import { db } from "./client";
import { users } from "./schema";

const passwordHash = await Bun.password.hash("password123");

await db.insert(users).values([
  {
    email: "student@ntnu.no",
    password: passwordHash,
    name: "Test Student",
    role: "student",
  },
  {
    email: "admin@ntnu.no",
    password: passwordHash,
    name: "Test Admin",
    role: "admin",
  },
]).onConflictDoNothing();

console.log("Seeded users");
process.exit(0);

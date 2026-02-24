import { db } from "./client";
import { users, assignments } from "./schema";

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

await db.insert(assignments).values([
  { title: "Essay on AI Ethics", course: "TDT4242" },
  { title: "Programming Assignment 1", course: "TDT4242" },
  { title: "Final Project Report", course: "TDT4242" },
]).onConflictDoNothing();

console.log("Seeded assignments");

process.exit(0);

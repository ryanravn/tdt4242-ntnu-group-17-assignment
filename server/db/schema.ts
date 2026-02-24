import { pgTable, serial, text, timestamp, pgEnum, integer, unique } from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["student", "admin"]);

export const toolEnum = pgEnum("tool", ["chatgpt", "copilot", "claude", "other"]);

export const taskTypeEnum = pgEnum("task_type", ["grammar", "summarizing", "drafting", "coding", "direct_answers"]);

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

// ── Tables ─────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  course: text("course").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  tool: toolEnum("tool").notNull(),
  taskTypes: text("task_types").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const declarations = pgTable("declarations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  declaredTools: text("declared_tools").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.studentId, t.assignmentId)]);

export const classifications = pgTable("classifications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  undeclaredTools: text("undeclared_tools").array(),
  declaredNotLogged: text("declared_not_logged").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  classificationId: integer("classification_id").notNull().references(() => classifications.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

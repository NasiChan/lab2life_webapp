import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Health profile types
export type HealthProfile = {
  age?: number;
  sex?: "male" | "female" | "other";
  heightCm?: number;
  weightKg?: number;
  allergies?: string[];
  conditions?: string[];
  currentMedications?: string[];
  activityLevel?: "low" | "moderate" | "high";
};

export type HealthProfileStatus = {
  isComplete: boolean;
  skippedAt?: string;
  lastUpdated?: string;
};

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  healthProfile: jsonb("health_profile").$type<HealthProfile>().default({}),
  healthProfileStatus: jsonb("health_profile_status").$type<HealthProfileStatus>().default({ isComplete: false }),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const healthProfileSchema = z.object({
  age: z.number().min(1).max(150).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(10).max(500).optional(),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  activityLevel: z.enum(["low", "moderate", "high"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Lab Results table
export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  uploadDate: timestamp("upload_date").default(sql`CURRENT_TIMESTAMP`).notNull(),
  rawText: text("raw_text"),
  status: text("status").notNull().default("processing"), // processing, completed, error
});

export const insertLabResultSchema = createInsertSchema(labResults).omit({
  id: true,
  uploadDate: true,
});

export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type LabResult = typeof labResults.$inferSelect;

// Health Markers extracted from lab results
export const healthMarkers = pgTable("health_markers", {
  id: serial("id").primaryKey(),
  labResultId: integer("lab_result_id").references(() => labResults.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: decimal("value", { precision: 10, scale: 3 }),
  unit: text("unit"),
  normalMin: decimal("normal_min", { precision: 10, scale: 3 }),
  normalMax: decimal("normal_max", { precision: 10, scale: 3 }),
  status: text("status").notNull(), // low, normal, high
  category: text("category").notNull(), // vitamins, minerals, blood, hormones, etc
});

export const insertHealthMarkerSchema = createInsertSchema(healthMarkers).omit({
  id: true,
});

export type InsertHealthMarker = z.infer<typeof insertHealthMarkerSchema>;
export type HealthMarker = typeof healthMarkers.$inferSelect;

// Separation rule type for conflict tracking
export type SeparationRule = {
  pillId: number;
  pillType: "medication" | "supplement";
  pillName: string;
  minutesApart: number;
  reason: string;
};

// Medications table with enhanced pill planner fields
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  timeOfDay: text("time_of_day"), // legacy field
  timeBlock: text("time_block").default("morning"), // morning, midday, evening, bedtime
  scheduledTime: text("scheduled_time"), // specific HH:MM time if needed
  foodRule: text("food_rule").default("either"), // with_food, empty_stomach, either
  withFood: boolean("with_food").default(false), // legacy field
  separationRules: jsonb("separation_rules").$type<SeparationRule[]>().default([]),
  allowedTogetherWith: jsonb("allowed_together_with").$type<number[]>().default([]), // medication IDs
  userOverride: boolean("user_override").default(false), // user chose to ignore conflicts
  stackId: integer("stack_id"), // reference to pill stack
  notes: text("notes"),
  whyTaking: text("why_taking"), // one-line explanation
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Supplements table with enhanced pill planner fields
export const supplements = pgTable("supplements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  timeOfDay: text("time_of_day"), // legacy field
  timeBlock: text("time_block").default("morning"), // morning, midday, evening, bedtime
  scheduledTime: text("scheduled_time"), // specific HH:MM time if needed
  foodRule: text("food_rule").default("either"), // with_food, empty_stomach, either
  withFood: boolean("with_food").default(false), // legacy field
  separationRules: jsonb("separation_rules").$type<SeparationRule[]>().default([]),
  allowedTogetherWith: jsonb("allowed_together_with").$type<number[]>().default([]), // supplement IDs
  userOverride: boolean("user_override").default(false), // user chose to ignore conflicts
  stackId: integer("stack_id"), // reference to pill stack
  reason: text("reason"),
  whyTaking: text("why_taking"), // one-line explanation
  source: text("source"), // link to clinical guideline
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSupplementSchema = createInsertSchema(supplements).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplement = z.infer<typeof insertSupplementSchema>;
export type Supplement = typeof supplements.$inferSelect;

// Pill Stacks - groups of pills taken together
export const pillStacks = pgTable("pill_stacks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Morning Stack", "Evening Stack"
  timeBlock: text("time_block").notNull(), // morning, midday, evening, bedtime
  scheduledTime: text("scheduled_time"), // specific HH:MM time
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPillStackSchema = createInsertSchema(pillStacks).omit({
  id: true,
  createdAt: true,
});

export type InsertPillStack = z.infer<typeof insertPillStackSchema>;
export type PillStack = typeof pillStacks.$inferSelect;

// Pill Doses - tracks when pills were taken
export const pillDoses = pgTable("pill_doses", {
  id: serial("id").primaryKey(),
  pillType: text("pill_type").notNull(), // medication, supplement
  pillId: integer("pill_id").notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTimeBlock: text("scheduled_time_block").notNull(), // morning, midday, evening, bedtime
  status: text("status").notNull().default("pending"), // pending, taken, skipped, snoozed
  takenAt: timestamp("taken_at"),
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPillDoseSchema = createInsertSchema(pillDoses).omit({
  id: true,
  createdAt: true,
});

export type InsertPillDose = z.infer<typeof insertPillDoseSchema>;
export type PillDose = typeof pillDoses.$inferSelect;

// Recommendations table
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  labResultId: integer("lab_result_id").references(() => labResults.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // supplement, dietary, physical
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  relatedMarker: text("related_marker"),
  actionItems: jsonb("action_items").$type<string[]>().default([]),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  time: text("time").notNull(), // HH:MM format
  days: jsonb("days").$type<string[]>().default([]), // ['monday', 'tuesday', etc]
  type: text("type").notNull(), // medication, supplement, activity
  relatedId: integer("related_id"), // id of medication or supplement
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

// Interactions table (medication-supplement conflicts)
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").references(() => medications.id, { onDelete: "cascade" }),
  supplementId: integer("supplement_id").references(() => supplements.id, { onDelete: "cascade" }),
  severity: text("severity").notNull(), // mild, moderate, severe
  description: text("description").notNull(),
  recommendation: text("recommendation").notNull(),
  separationMinutes: integer("separation_minutes"), // how many minutes apart if applicable
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

// Chat models for AI integration
export * from "./models/chat";

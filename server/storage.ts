import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  users,
  labResults,
  healthMarkers,
  medications,
  supplements,
  recommendations,
  reminders,
  interactions,
  pillStacks,
  pillDoses,
  type User,
  type InsertUser,
  type LabResult,
  type InsertLabResult,
  type HealthMarker,
  type InsertHealthMarker,
  type Medication,
  type InsertMedication,
  type Supplement,
  type InsertSupplement,
  type Recommendation,
  type InsertRecommendation,
  type Reminder,
  type InsertReminder,
  type Interaction,
  type InsertInteraction,
  type PillStack,
  type InsertPillStack,
  type PillDose,
  type InsertPillDose,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Lab Results
  getLabResults(): Promise<LabResult[]>;
  getLabResult(id: number): Promise<LabResult | undefined>;
  createLabResult(data: InsertLabResult): Promise<LabResult>;
  updateLabResult(id: number, data: Partial<InsertLabResult>): Promise<LabResult | undefined>;
  deleteLabResult(id: number): Promise<void>;

  // Health Markers
  getHealthMarkers(): Promise<HealthMarker[]>;
  getHealthMarkersByLabResult(labResultId: number): Promise<HealthMarker[]>;
  createHealthMarker(data: InsertHealthMarker): Promise<HealthMarker>;
  deleteHealthMarkersByLabResult(labResultId: number): Promise<void>;

  // Medications
  getMedications(): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(data: InsertMedication): Promise<Medication>;
  updateMedication(id: number, data: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<void>;

  // Supplements
  getSupplements(): Promise<Supplement[]>;
  getSupplement(id: number): Promise<Supplement | undefined>;
  createSupplement(data: InsertSupplement): Promise<Supplement>;
  updateSupplement(id: number, data: Partial<InsertSupplement>): Promise<Supplement | undefined>;
  deleteSupplement(id: number): Promise<void>;

  // Recommendations
  getRecommendations(): Promise<Recommendation[]>;
  getRecommendationsByLabResult(labResultId: number): Promise<Recommendation[]>;
  createRecommendation(data: InsertRecommendation): Promise<Recommendation>;
  deleteRecommendationsByLabResult(labResultId: number): Promise<void>;

  // Reminders
  getReminders(): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(data: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, data: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<void>;

  // Interactions
  getInteractions(): Promise<Interaction[]>;
  createInteraction(data: InsertInteraction): Promise<Interaction>;
  deleteAllInteractions(): Promise<void>;

  // Pill Stacks
  getPillStacks(): Promise<PillStack[]>;
  getPillStack(id: number): Promise<PillStack | undefined>;
  createPillStack(data: InsertPillStack): Promise<PillStack>;
  updatePillStack(id: number, data: Partial<InsertPillStack>): Promise<PillStack | undefined>;
  deletePillStack(id: number): Promise<void>;

  // Pill Doses
  getPillDoses(): Promise<PillDose[]>;
  getPillDosesByDate(date: string): Promise<PillDose[]>;
  createPillDose(data: InsertPillDose): Promise<PillDose>;
  updatePillDose(id: number, data: Partial<InsertPillDose>): Promise<PillDose | undefined>;
  deletePillDose(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  // Lab Results
  async getLabResults(): Promise<LabResult[]> {
    return db.select().from(labResults).orderBy(desc(labResults.uploadDate));
  }

  async getLabResult(id: number): Promise<LabResult | undefined> {
    const [result] = await db.select().from(labResults).where(eq(labResults.id, id));
    return result;
  }

  async createLabResult(data: InsertLabResult): Promise<LabResult> {
    const [created] = await db.insert(labResults).values(data).returning();
    return created;
  }

  async updateLabResult(id: number, data: Partial<InsertLabResult>): Promise<LabResult | undefined> {
    const [updated] = await db.update(labResults).set(data).where(eq(labResults.id, id)).returning();
    return updated;
  }

  async deleteLabResult(id: number): Promise<void> {
    await db.delete(labResults).where(eq(labResults.id, id));
  }

  // Health Markers
  async getHealthMarkers(): Promise<HealthMarker[]> {
    return db.select().from(healthMarkers);
  }

  async getHealthMarkersByLabResult(labResultId: number): Promise<HealthMarker[]> {
    return db.select().from(healthMarkers).where(eq(healthMarkers.labResultId, labResultId));
  }

  async createHealthMarker(data: InsertHealthMarker): Promise<HealthMarker> {
    const [created] = await db.insert(healthMarkers).values(data).returning();
    return created;
  }

  async deleteHealthMarkersByLabResult(labResultId: number): Promise<void> {
    await db.delete(healthMarkers).where(eq(healthMarkers.labResultId, labResultId));
  }

  // Medications
  async getMedications(): Promise<Medication[]> {
    return db.select().from(medications).orderBy(desc(medications.createdAt));
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    const [result] = await db.select().from(medications).where(eq(medications.id, id));
    return result;
  }

  async createMedication(data: InsertMedication): Promise<Medication> {
    const [created] = await db.insert(medications).values(data).returning();
    return created;
  }

  async updateMedication(id: number, data: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updated] = await db.update(medications).set(data).where(eq(medications.id, id)).returning();
    return updated;
  }

  async deleteMedication(id: number): Promise<void> {
    await db.delete(medications).where(eq(medications.id, id));
  }

  // Supplements
  async getSupplements(): Promise<Supplement[]> {
    return db.select().from(supplements).orderBy(desc(supplements.createdAt));
  }

  async getSupplement(id: number): Promise<Supplement | undefined> {
    const [result] = await db.select().from(supplements).where(eq(supplements.id, id));
    return result;
  }

  async createSupplement(data: InsertSupplement): Promise<Supplement> {
    const [created] = await db.insert(supplements).values(data).returning();
    return created;
  }

  async updateSupplement(id: number, data: Partial<InsertSupplement>): Promise<Supplement | undefined> {
    const [updated] = await db.update(supplements).set(data).where(eq(supplements.id, id)).returning();
    return updated;
  }

  async deleteSupplement(id: number): Promise<void> {
    await db.delete(supplements).where(eq(supplements.id, id));
  }

  // Recommendations
  async getRecommendations(): Promise<Recommendation[]> {
    return db.select().from(recommendations).orderBy(desc(recommendations.createdAt));
  }

  async getRecommendationsByLabResult(labResultId: number): Promise<Recommendation[]> {
    return db.select().from(recommendations).where(eq(recommendations.labResultId, labResultId));
  }

  async createRecommendation(data: InsertRecommendation): Promise<Recommendation> {
    const [created] = await db.insert(recommendations).values(data).returning();
    return created;
  }

  async deleteRecommendationsByLabResult(labResultId: number): Promise<void> {
    await db.delete(recommendations).where(eq(recommendations.labResultId, labResultId));
  }

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return db.select().from(reminders).orderBy(reminders.time);
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    const [result] = await db.select().from(reminders).where(eq(reminders.id, id));
    return result;
  }

  async createReminder(data: InsertReminder): Promise<Reminder> {
    const [created] = await db.insert(reminders).values(data).returning();
    return created;
  }

  async updateReminder(id: number, data: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [updated] = await db.update(reminders).set(data).where(eq(reminders.id, id)).returning();
    return updated;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  // Interactions
  async getInteractions(): Promise<Interaction[]> {
    return db.select().from(interactions);
  }

  async createInteraction(data: InsertInteraction): Promise<Interaction> {
    const [created] = await db.insert(interactions).values(data).returning();
    return created;
  }

  async deleteAllInteractions(): Promise<void> {
    await db.delete(interactions);
  }

  // Pill Stacks
  async getPillStacks(): Promise<PillStack[]> {
    return db.select().from(pillStacks).orderBy(pillStacks.timeBlock);
  }

  async getPillStack(id: number): Promise<PillStack | undefined> {
    const [result] = await db.select().from(pillStacks).where(eq(pillStacks.id, id));
    return result;
  }

  async createPillStack(data: InsertPillStack): Promise<PillStack> {
    const [created] = await db.insert(pillStacks).values(data).returning();
    return created;
  }

  async updatePillStack(id: number, data: Partial<InsertPillStack>): Promise<PillStack | undefined> {
    const [updated] = await db.update(pillStacks).set(data).where(eq(pillStacks.id, id)).returning();
    return updated;
  }

  async deletePillStack(id: number): Promise<void> {
    await db.delete(pillStacks).where(eq(pillStacks.id, id));
  }

  // Pill Doses
  async getPillDoses(): Promise<PillDose[]> {
    return db.select().from(pillDoses).orderBy(desc(pillDoses.scheduledDate));
  }

  async getPillDosesByDate(date: string): Promise<PillDose[]> {
    return db.select().from(pillDoses).where(eq(pillDoses.scheduledDate, date));
  }

  async createPillDose(data: InsertPillDose): Promise<PillDose> {
    const [created] = await db.insert(pillDoses).values(data).returning();
    return created;
  }

  async updatePillDose(id: number, data: Partial<InsertPillDose>): Promise<PillDose | undefined> {
    const [updated] = await db.update(pillDoses).set(data).where(eq(pillDoses.id, id)).returning();
    return updated;
  }

  async deletePillDose(id: number): Promise<void> {
    await db.delete(pillDoses).where(eq(pillDoses.id, id));
  }
}

export const storage = new DatabaseStorage();

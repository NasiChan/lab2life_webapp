import type { Express, Request, Response } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { extractLabData, checkInteractions } from "./gemini";
import {
  insertMedicationSchema,
  insertSupplementSchema,
  insertReminderSchema,
  insertPillStackSchema,
  insertPillDoseSchema,
  healthProfileSchema,
  type HealthProfile,
  type HealthProfileStatus,
} from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Convert a value that might be string | string[] | unknown into a single string.
 *
 * @param value - A value that may come from req.query / req.params / req.headers.
 * @returns The string value, or first element if it's an array, otherwise undefined.
 *
 * Preconditions:
 * - value may be unknown, string, string[], or other types.
 * Postconditions:
 * - Never returns an array.
 */
function toSingleString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

/**
 * Safely read a single query param as a string.
 *
 * @param req - Express request
 * @param key - Query param key
 * @returns A single string value (never string[]) or undefined.
 *
 * Preconditions:
 * - req.query may contain repeated parameters (arrays).
 * Postconditions:
 * - Never returns an array.
 */
function getQueryString(req: Request, key: string): string | undefined {
  return toSingleString((req.query as Record<string, unknown>)[key]);
}

/**
 * Safely parse an integer route param (like :id).
 *
 * @param req - Express request
 * @param res - Express response (used to send 400s)
 * @param key - Route param key (e.g., "id")
 * @returns Parsed integer, or undefined if invalid (response is sent).
 *
 * Preconditions:
 * - req.params[key] may be string or string[] depending on typings.
 * Postconditions:
 * - If returns number, it is a valid integer.
 * - If returns undefined, an error response has been sent.
 */
function requireIntParam(req: Request, res: Response, key: string): number | undefined {
  const raw = toSingleString((req.params as Record<string, unknown>)[key]);
  if (!raw) {
    res.status(400).json({ error: `Missing ${key}` });
    return undefined;
  }

  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    res.status(400).json({ error: `Invalid ${key}` });
    return undefined;
  }

  return n;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // =========================================================
  // Lab Results
  // =========================================================
  app.get("/api/lab-results", async (_req: Request, res: Response) => {
    try {
      const results = await storage.getLabResults();
      res.json(results);
    } catch (error) {
      console.error("Error fetching lab results:", error);
      res.status(500).json({ error: "Failed to fetch lab results" });
    }
  });

  app.post(
    "/api/lab-results/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const labResult = await storage.createLabResult({
          fileName: req.file.originalname,
          status: "processing",
          rawText: null,
        });

        // Fire-and-forget processing (do not block response)
        void processLabResult(labResult.id, req.file.buffer.toString("utf-8"));

        res.status(201).json(labResult);
      } catch (error) {
        console.error("Error uploading lab result:", error);
        res.status(500).json({ error: "Failed to upload lab result" });
      }
    }
  );

  /**
   * Process a lab result asynchronously.
   *
   * @param labResultId - ID of the lab result record
   * @param rawText - Extracted text from uploaded file
   *
   * Preconditions:
   * - labResultId exists in storage.
   * Postconditions:
   * - Updates lab result status to completed or error.
   */
  async function processLabResult(labResultId: number, rawText: string) {
    try {
      const extractedData = await extractLabData(rawText);

      for (const marker of extractedData.markers) {
        await storage.createHealthMarker({
          labResultId,
          name: marker.name,
          value: String(marker.value),
          unit: marker.unit,
          normalMin: String(marker.normalMin),
          normalMax: String(marker.normalMax),
          status: marker.status,
          category: marker.category,
        });
      }

      for (const rec of extractedData.recommendations) {
        await storage.createRecommendation({
          labResultId,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          relatedMarker: rec.relatedMarker,
          actionItems: rec.actionItems,
        });
      }

      await storage.updateLabResult(labResultId, {
        status: "completed",
        rawText,
      });
    } catch (error) {
      console.error("Error processing lab result:", error);
      await storage.updateLabResult(labResultId, { status: "error" });
    }
  }

  app.delete("/api/lab-results/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      await storage.deleteLabResult(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lab result:", error);
      res.status(500).json({ error: "Failed to delete lab result" });
    }
  });

  // =========================================================
  // Health Markers
  // =========================================================
  app.get("/api/health-markers", async (_req: Request, res: Response) => {
    try {
      const markers = await storage.getHealthMarkers();
      res.json(markers);
    } catch (error) {
      console.error("Error fetching health markers:", error);
      res.status(500).json({ error: "Failed to fetch health markers" });
    }
  });

  // =========================================================
  // Medications
  // =========================================================
  app.get("/api/medications", async (_req: Request, res: Response) => {
    try {
      const meds = await storage.getMedications();
      res.json(meds);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req: Request, res: Response) => {
    try {
      const parsed = insertMedicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const medication = await storage.createMedication(parsed.data);
      res.status(201).json(medication);
    } catch (error) {
      console.error("Error creating medication:", error);
      res.status(500).json({ error: "Failed to create medication" });
    }
  });

  app.patch("/api/medications/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      const medication = await storage.updateMedication(id, req.body);
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      console.error("Error updating medication:", error);
      res.status(500).json({ error: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      await storage.deleteMedication(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // =========================================================
  // Supplements
  // =========================================================
  app.get("/api/supplements", async (_req: Request, res: Response) => {
    try {
      const supps = await storage.getSupplements();
      res.json(supps);
    } catch (error) {
      console.error("Error fetching supplements:", error);
      res.status(500).json({ error: "Failed to fetch supplements" });
    }
  });

  app.post("/api/supplements", async (req: Request, res: Response) => {
    try {
      const parsed = insertSupplementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const supplement = await storage.createSupplement(parsed.data);
      res.status(201).json(supplement);
    } catch (error) {
      console.error("Error creating supplement:", error);
      res.status(500).json({ error: "Failed to create supplement" });
    }
  });

  app.patch("/api/supplements/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      const supplement = await storage.updateSupplement(id, req.body);
      if (!supplement) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      res.json(supplement);
    } catch (error) {
      console.error("Error updating supplement:", error);
      res.status(500).json({ error: "Failed to update supplement" });
    }
  });

  app.delete("/api/supplements/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      await storage.deleteSupplement(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplement:", error);
      res.status(500).json({ error: "Failed to delete supplement" });
    }
  });

  // =========================================================
  // Recommendations
  // =========================================================
  app.get("/api/recommendations", async (_req: Request, res: Response) => {
    try {
      const recs = await storage.getRecommendations();
      res.json(recs);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // =========================================================
  // Reminders
  // =========================================================
  app.get("/api/reminders", async (_req: Request, res: Response) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req: Request, res: Response) => {
    try {
      const parsed = insertReminderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const reminder = await storage.createReminder(parsed.data);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  app.patch("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      const reminder = await storage.updateReminder(id, req.body);
      if (!reminder) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      await storage.deleteReminder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  // =========================================================
  // Interactions
  // =========================================================
  app.get("/api/interactions", async (_req: Request, res: Response) => {
    try {
      const interactions = await storage.getInteractions();
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.post("/api/interactions/check", async (_req: Request, res: Response) => {
    try {
      const medications = (await storage.getMedications()).filter((m) => m.active);
      const supplements = (await storage.getSupplements()).filter((s) => s.active);

      const interactionResults = await checkInteractions(
        medications.map((m) => ({ id: m.id, name: m.name })),
        supplements.map((s) => ({ id: s.id, name: s.name }))
      );

      await storage.deleteAllInteractions();

      for (const interaction of interactionResults) {
        await storage.createInteraction({
          medicationId: interaction.medicationId,
          supplementId: interaction.supplementId,
          severity: interaction.severity,
          description: interaction.description,
          recommendation: interaction.recommendation,
        });
      }

      const savedInteractions = await storage.getInteractions();
      res.json(savedInteractions);
    } catch (error) {
      console.error("Error checking interactions:", error);
      res.status(500).json({ error: "Failed to check interactions" });
    }
  });

  // =========================================================
  // Pill Stacks
  // =========================================================
  app.get("/api/pill-stacks", async (_req: Request, res: Response) => {
    try {
      const stacks = await storage.getPillStacks();
      res.json(stacks);
    } catch (error) {
      console.error("Error fetching pill stacks:", error);
      res.status(500).json({ error: "Failed to fetch pill stacks" });
    }
  });

  app.post("/api/pill-stacks", async (req: Request, res: Response) => {
    try {
      const parsed = insertPillStackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const stack = await storage.createPillStack(parsed.data);
      res.status(201).json(stack);
    } catch (error) {
      console.error("Error creating pill stack:", error);
      res.status(500).json({ error: "Failed to create pill stack" });
    }
  });

  app.patch("/api/pill-stacks/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      const stack = await storage.updatePillStack(id, req.body);
      if (!stack) {
        return res.status(404).json({ error: "Pill stack not found" });
      }
      res.json(stack);
    } catch (error) {
      console.error("Error updating pill stack:", error);
      res.status(500).json({ error: "Failed to update pill stack" });
    }
  });

  app.delete("/api/pill-stacks/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      await storage.deletePillStack(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pill stack:", error);
      res.status(500).json({ error: "Failed to delete pill stack" });
    }
  });

  // =========================================================
  // Pill Doses
  // =========================================================
  app.get("/api/pill-doses", async (req: Request, res: Response) => {
    try {
      const date = getQueryString(req, "date");

      if (date) {
        const doses = await storage.getPillDosesByDate(date);
        return res.json(doses);
      }

      const doses = await storage.getPillDoses();
      res.json(doses);
    } catch (error) {
      console.error("Error fetching pill doses:", error);
      res.status(500).json({ error: "Failed to fetch pill doses" });
    }
  });

  app.post("/api/pill-doses", async (req: Request, res: Response) => {
    try {
      const parsed = insertPillDoseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const dose = await storage.createPillDose(parsed.data);
      res.status(201).json(dose);
    } catch (error) {
      console.error("Error creating pill dose:", error);
      res.status(500).json({ error: "Failed to create pill dose" });
    }
  });

  app.patch("/api/pill-doses/:id", async (req: Request, res: Response) => {
    try {
      const id = requireIntParam(req, res, "id");
      if (id === undefined) return;

      const updateData: Record<string, unknown> = { ...req.body };

      if (typeof updateData.takenAt === "string") {
        updateData.takenAt = new Date(updateData.takenAt);
      }
      if (typeof updateData.snoozedUntil === "string") {
        updateData.snoozedUntil = new Date(updateData.snoozedUntil);
      }

      const dose = await storage.updatePillDose(id, updateData);
      if (!dose) {
        return res.status(404).json({ error: "Pill dose not found" });
      }
      res.json(dose);
    } catch (error) {
      console.error("Error updating pill dose:", error);
      res.status(500).json({ error: "Failed to update pill dose" });
    }
  });

  app.post("/api/pill-doses/generate", async (req: Request, res: Response) => {
    try {
      const { date } = req.body as { date?: string };
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }

      const existingDoses = await storage.getPillDosesByDate(date);
      const existingKeys = new Set(
        existingDoses.map((d) => `${d.pillType}-${d.pillId}-${d.scheduledTimeBlock}`)
      );

      const medications = (await storage.getMedications()).filter((m) => m.active);
      const supplements = (await storage.getSupplements()).filter((s) => s.active);

      for (const med of medications) {
        const timeBlock = med.timeBlock || "morning";
        const key = `medication-${med.id}-${timeBlock}`;
        if (!existingKeys.has(key)) {
          await storage.createPillDose({
            pillType: "medication",
            pillId: med.id,
            scheduledDate: date,
            scheduledTimeBlock: timeBlock,
            status: "pending",
            takenAt: null,
            snoozedUntil: null,
          });
        }
      }

      for (const supp of supplements) {
        const timeBlock = supp.timeBlock || "morning";
        const key = `supplement-${supp.id}-${timeBlock}`;
        if (!existingKeys.has(key)) {
          await storage.createPillDose({
            pillType: "supplement",
            pillId: supp.id,
            scheduledDate: date,
            scheduledTimeBlock: timeBlock,
            status: "pending",
            takenAt: null,
            snoozedUntil: null,
          });
        }
      }

      const allDoses = await storage.getPillDosesByDate(date);
      res.json(allDoses);
    } catch (error) {
      console.error("Error generating pill doses:", error);
      res.status(500).json({ error: "Failed to generate pill doses" });
    }
  });

  // =========================================================
  // Demo User + Health Profile
  // =========================================================
  const DEMO_USER_ID = "demo-user";

  /**
   * Ensure the demo user exists.
   *
   * Preconditions:
   * - storage implements getUser/getUserByUsername/createUser/updateUser.
   * Postconditions:
   * - Demo user exists with healthProfile and healthProfileStatus fields initialized.
   */
  async function ensureDemoUser() {
    let user = await storage.getUser(DEMO_USER_ID);
    if (!user) {
      user = await storage.createUser({
        username: "demo",
        password: "demo",
      });

      await storage.updateUser(user.id, {
        healthProfile: {},
        healthProfileStatus: { isComplete: false },
      });
    }
    return user;
  }

  /**
   * Compute if the health profile is complete.
   *
   * @param hp - Health profile
   * @returns True if required numeric fields are present.
   */
  function computeHealthProfileComplete(hp: HealthProfile): boolean {
    return (
      typeof hp.age === "number" &&
      typeof hp.heightCm === "number" &&
      typeof hp.weightKg === "number"
    );
  }

  app.get("/api/me", async (_req: Request, res: Response) => {
    try {
      let user = await storage.getUserByUsername("demo");
      if (!user) user = await ensureDemoUser();

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/me/health-profile", async (req: Request, res: Response) => {
    try {
      const parseResult = healthProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid health profile data",
          details: parseResult.error.issues,
        });
      }

      const updates = parseResult.data;

      let user = await storage.getUserByUsername("demo");
      if (!user) user = await ensureDemoUser();

      const newHealthProfile: HealthProfile = {
        ...(user.healthProfile || {}),
        ...updates,
      };

      const newStatus: HealthProfileStatus = {
        isComplete: computeHealthProfileComplete(newHealthProfile),
        lastUpdated: new Date().toISOString(),
        skippedAt: undefined,
      };

      const updatedUser = await storage.updateUser(user.id, {
        healthProfile: newHealthProfile,
        healthProfileStatus: newStatus,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        healthProfile: updatedUser.healthProfile,
        healthProfileStatus: updatedUser.healthProfileStatus,
      });
    } catch (error) {
      console.error("Error updating health profile:", error);
      res.status(500).json({ error: "Failed to update health profile" });
    }
  });

  app.post("/api/me/health-profile/skip", async (_req: Request, res: Response) => {
    try {
      let user = await storage.getUserByUsername("demo");
      if (!user) user = await ensureDemoUser();

      const newStatus: HealthProfileStatus = {
        ...(user.healthProfileStatus || { isComplete: false }),
        skippedAt: new Date().toISOString(),
      };

      const updatedUser = await storage.updateUser(user.id, {
        healthProfileStatus: newStatus,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ healthProfileStatus: updatedUser.healthProfileStatus });
    } catch (error) {
      console.error("Error skipping health profile:", error);
      res.status(500).json({ error: "Failed to skip health profile" });
    }
  });

  return httpServer;
}

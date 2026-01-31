import { db } from "./db";
import {
  medications,
  supplements,
  reminders,
  labResults,
  healthMarkers,
  recommendations,
  pillStacks,
} from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingMeds = await db.select().from(medications).limit(1);
    if (existingMeds.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with sample data...");

    // Seed pill stacks first
    const [morningStack] = await db.insert(pillStacks).values({
      name: "Morning Stack",
      timeBlock: "morning",
      scheduledTime: "08:00",
      description: "Daily morning vitamins and medications with breakfast",
    }).returning();

    const [eveningStack] = await db.insert(pillStacks).values({
      name: "Evening Stack",
      timeBlock: "evening",
      scheduledTime: "21:00",
      description: "Evening medications and supplements before bed",
    }).returning();

    // Seed medications with enhanced pill planner fields
    await db.insert(medications).values([
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        timeOfDay: "morning",
        timeBlock: "morning",
        scheduledTime: "08:00",
        foodRule: "either",
        withFood: false,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: morningStack.id,
        notes: "Blood pressure medication - take consistently at the same time each day",
        whyTaking: "Controls blood pressure",
        active: true,
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        timeOfDay: "morning",
        timeBlock: "morning",
        scheduledTime: "08:00",
        foodRule: "with_food",
        withFood: true,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: morningStack.id,
        notes: "Take with meals to reduce stomach upset",
        whyTaking: "Blood sugar management",
        active: true,
      },
      {
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily",
        timeOfDay: "evening",
        timeBlock: "bedtime",
        scheduledTime: "21:00",
        foodRule: "either",
        withFood: false,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: eveningStack.id,
        notes: "Cholesterol medication - evening dosing is most effective",
        whyTaking: "Lowers cholesterol",
        active: true,
      },
    ]);

    // Seed supplements with enhanced pill planner fields
    await db.insert(supplements).values([
      {
        name: "Vitamin D3",
        dosage: "2000 IU",
        frequency: "Once daily",
        timeOfDay: "morning",
        timeBlock: "morning",
        scheduledTime: "08:00",
        foodRule: "with_food",
        withFood: true,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: morningStack.id,
        reason: "Lab results showed vitamin D deficiency (level: 18 ng/mL)",
        whyTaking: "Supports bone health and immunity",
        source: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
        active: true,
      },
      {
        name: "Omega-3 Fish Oil",
        dosage: "1000mg",
        frequency: "Twice daily",
        timeOfDay: "morning",
        timeBlock: "morning",
        scheduledTime: "08:00",
        foodRule: "with_food",
        withFood: true,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: morningStack.id,
        reason: "Heart health and to support healthy cholesterol levels",
        whyTaking: "Heart and brain health",
        source: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/fish-and-omega-3-fatty-acids",
        active: true,
      },
      {
        name: "Magnesium Glycinate",
        dosage: "400mg",
        frequency: "Once daily",
        timeOfDay: "evening",
        timeBlock: "bedtime",
        scheduledTime: "21:00",
        foodRule: "either",
        withFood: false,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: eveningStack.id,
        reason: "Muscle recovery and sleep support",
        whyTaking: "Better sleep and muscle relaxation",
        active: true,
      },
      {
        name: "B-Complex",
        dosage: "1 capsule",
        frequency: "Once daily",
        timeOfDay: "morning",
        timeBlock: "morning",
        scheduledTime: "08:00",
        foodRule: "with_food",
        withFood: true,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        stackId: morningStack.id,
        reason: "Energy support and nervous system health",
        whyTaking: "Energy and nerve function",
        active: true,
      },
      {
        name: "Iron",
        dosage: "18mg",
        frequency: "Once daily",
        timeOfDay: "midday",
        timeBlock: "midday",
        scheduledTime: "12:00",
        foodRule: "empty_stomach",
        withFood: false,
        separationRules: [
          {
            pillId: 0, // Will be updated after calcium is created
            pillType: "supplement",
            pillName: "Calcium",
            minutesApart: 120,
            reason: "Calcium reduces iron absorption",
          },
        ],
        allowedTogetherWith: [],
        userOverride: false,
        reason: "Supporting healthy iron levels",
        whyTaking: "Prevents anemia",
        active: true,
      },
      {
        name: "Calcium",
        dosage: "500mg",
        frequency: "Once daily",
        timeOfDay: "evening",
        timeBlock: "evening",
        scheduledTime: "18:00",
        foodRule: "with_food",
        withFood: true,
        separationRules: [],
        allowedTogetherWith: [],
        userOverride: false,
        reason: "Bone health support",
        whyTaking: "Strong bones",
        active: true,
      },
    ]);

    // Seed reminders
    await db.insert(reminders).values([
      {
        title: "Morning Medications",
        time: "08:00",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        type: "medication",
        enabled: true,
      },
      {
        title: "Take Vitamin D with breakfast",
        time: "08:30",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        type: "supplement",
        enabled: true,
      },
      {
        title: "Evening statin dose",
        time: "21:00",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        type: "medication",
        enabled: true,
      },
      {
        title: "15-minute walk",
        time: "12:30",
        days: ["monday", "wednesday", "friday"],
        type: "activity",
        enabled: true,
      },
    ]);

    // Seed a sample lab result with markers and recommendations
    const [labResult] = await db.insert(labResults).values({
      fileName: "Annual_Bloodwork_2024.pdf",
      status: "completed",
      rawText: "Sample lab result data",
    }).returning();

    // Seed health markers
    await db.insert(healthMarkers).values([
      {
        labResultId: labResult.id,
        name: "Vitamin D",
        value: "18",
        unit: "ng/mL",
        normalMin: "30",
        normalMax: "100",
        status: "low",
        category: "vitamins",
      },
      {
        labResultId: labResult.id,
        name: "Vitamin B12",
        value: "450",
        unit: "pg/mL",
        normalMin: "200",
        normalMax: "900",
        status: "normal",
        category: "vitamins",
      },
      {
        labResultId: labResult.id,
        name: "Iron (Ferritin)",
        value: "35",
        unit: "ng/mL",
        normalMin: "20",
        normalMax: "300",
        status: "normal",
        category: "minerals",
      },
      {
        labResultId: labResult.id,
        name: "Hemoglobin",
        value: "14.2",
        unit: "g/dL",
        normalMin: "12",
        normalMax: "17",
        status: "normal",
        category: "blood",
      },
      {
        labResultId: labResult.id,
        name: "Total Cholesterol",
        value: "225",
        unit: "mg/dL",
        normalMin: "0",
        normalMax: "200",
        status: "high",
        category: "lipids",
      },
      {
        labResultId: labResult.id,
        name: "Fasting Glucose",
        value: "105",
        unit: "mg/dL",
        normalMin: "70",
        normalMax: "100",
        status: "high",
        category: "metabolic",
      },
    ]);

    // Seed recommendations
    await db.insert(recommendations).values([
      {
        labResultId: labResult.id,
        type: "supplement",
        title: "Start Vitamin D Supplementation",
        description: "Your vitamin D level of 18 ng/mL is below the optimal range. Vitamin D is crucial for bone health, immune function, and mood regulation.",
        priority: "high",
        relatedMarker: "Vitamin D",
        actionItems: [
          "Take 2000-4000 IU of Vitamin D3 daily with a meal containing fat",
          "Get 15-20 minutes of sun exposure when possible",
          "Retest levels in 3 months"
        ],
      },
      {
        labResultId: labResult.id,
        type: "dietary",
        title: "Heart-Healthy Diet Adjustments",
        description: "Your cholesterol is slightly elevated. Making dietary changes can help bring it into a healthier range.",
        priority: "medium",
        relatedMarker: "Total Cholesterol",
        actionItems: [
          "Increase fiber intake with oatmeal, beans, and vegetables",
          "Add fatty fish like salmon 2-3 times per week",
          "Replace saturated fats with olive oil and nuts",
          "Limit processed foods and added sugars"
        ],
      },
      {
        labResultId: labResult.id,
        type: "physical",
        title: "Regular Walking Routine",
        description: "Light physical activity can help improve both blood sugar control and cholesterol levels.",
        priority: "medium",
        relatedMarker: "Fasting Glucose",
        actionItems: [
          "Start with 15-minute walks after meals",
          "Gradually increase to 30 minutes daily",
          "Consider adding light resistance exercises 2x per week"
        ],
      },
      {
        labResultId: labResult.id,
        type: "dietary",
        title: "Blood Sugar Management",
        description: "Your fasting glucose is slightly elevated. Dietary modifications can help stabilize blood sugar levels.",
        priority: "high",
        relatedMarker: "Fasting Glucose",
        actionItems: [
          "Choose whole grains over refined carbohydrates",
          "Pair carbs with protein and healthy fats",
          "Limit sugary beverages and snacks",
          "Consider adding cinnamon to meals"
        ],
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface ExtractedMarker {
  name: string;
  value: number;
  unit: string;
  normalMin: number;
  normalMax: number;
  status: "low" | "normal" | "high";
  category: string;
}

export interface ExtractedData {
  markers: ExtractedMarker[];
  recommendations: {
    type: "supplement" | "dietary" | "physical";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    relatedMarker: string;
    actionItems: string[];
  }[];
}

export async function extractLabData(text: string): Promise<ExtractedData> {
  const prompt = `Analyze this lab result text and extract health markers (vitamins, minerals, blood values) with recommendations.

Lab Result Text:
${text}

Respond with valid JSON only (no markdown):
{
  "markers": [
    {
      "name": "marker name",
      "value": numeric_value,
      "unit": "unit string",
      "normalMin": min_normal_value,
      "normalMax": max_normal_value,
      "status": "low" | "normal" | "high",
      "category": "vitamins" | "minerals" | "blood" | "hormones" | "lipids" | "metabolic"
    }
  ],
  "recommendations": [
    {
      "type": "supplement" | "dietary" | "physical",
      "title": "recommendation title",
      "description": "detailed explanation",
      "priority": "high" | "medium" | "low",
      "relatedMarker": "which marker this relates to",
      "actionItems": ["action 1", "action 2"]
    }
  ]
}

Focus on:
- Vitamin D, B12, Iron, Folate, Calcium, Magnesium levels
- Blood markers like hemoglobin, RBC, WBC
- Metabolic markers like glucose, cholesterol
- For each abnormal marker, provide a relevant recommendation
- Dietary recommendations should suggest specific foods
- Physical recommendations should suggest gentle activities
- Supplement recommendations should include dosage guidance`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", responseText);
      return { markers: [], recommendations: [] };
    }

    const data = JSON.parse(jsonMatch[0]) as ExtractedData;
    return data;
  } catch (error) {
    console.error("Error extracting lab data:", error);
    return { markers: [], recommendations: [] };
  }
}

export interface InteractionResult {
  medicationId: number;
  supplementId: number;
  severity: "mild" | "moderate" | "severe";
  description: string;
  recommendation: string;
}

export async function checkInteractions(
  medications: { id: number; name: string }[],
  supplements: { id: number; name: string }[]
): Promise<InteractionResult[]> {
  if (medications.length === 0 || supplements.length === 0) {
    return [];
  }

  const medicationList = medications.map((m) => `- ${m.name} (ID: ${m.id})`).join("\n");
  const supplementList = supplements.map((s) => `- ${s.name} (ID: ${s.id})`).join("\n");

  const prompt = `Check for potential drug-supplement interactions between these medications and supplements.

Medications:
${medicationList}

Supplements:
${supplementList}

Respond with valid JSON only (no markdown). If no interactions found, return empty array.
{
  "interactions": [
    {
      "medicationId": medication_id_number,
      "supplementId": supplement_id_number,
      "severity": "mild" | "moderate" | "severe",
      "description": "what the interaction does",
      "recommendation": "what to do about it"
    }
  ]
}

Common interactions to check:
- Blood thinners with Vitamin E, Fish Oil, Ginkgo
- Blood pressure meds with Potassium, Licorice
- Thyroid meds with Calcium, Iron
- Diabetes meds with Chromium, Alpha-lipoic acid
- Antidepressants with St. John's Wort, 5-HTP
- Antibiotics with Probiotics, Calcium, Zinc

Only report real, clinically significant interactions.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return [];
    }

    const data = JSON.parse(jsonMatch[0]) as { interactions: InteractionResult[] };
    return data.interactions || [];
  } catch (error) {
    console.error("Error checking interactions:", error);
    return [];
  }
}

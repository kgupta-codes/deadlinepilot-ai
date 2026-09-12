import "server-only";

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
  type ResponseSchema,
  type Schema,
} from "@google/generative-ai";

import {
  ACADEMIC_EXTRACTION_PROMPT_VERSION,
  ACADEMIC_EXTRACTION_SCHEMA_VERSION,
  academicDeadlineExtractionSchema,
  type AcademicDeadlineExtraction,
} from "./extractionSchema";

const MODEL_NAME = "gemini-3.6-flash";
const TIMEOUT_MS = 20_000;

const enumString = (values: string[]): Schema => ({
  type: SchemaType.STRING,
  format: "enum",
  enum: values,
});

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    schemaVersion: { type: SchemaType.STRING },
    inputLanguage: { type: SchemaType.STRING },
    deadlines: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          academicType: enumString([
              "assignment",
              "exam",
              "quiz",
              "project",
              "presentation",
              "lab",
              "reading",
              "admin",
              "other",
          ]),
          courseCode: { type: SchemaType.STRING, nullable: true },
          courseName: { type: SchemaType.STRING, nullable: true },
          dueDate: { type: SchemaType.STRING, nullable: true },
          dueTime: { type: SchemaType.STRING, nullable: true },
          timezone: { type: SchemaType.STRING, nullable: true },
          dueDateText: { type: SchemaType.STRING, nullable: true },
          dateAmbiguity: enumString([
              "none",
              "missing_year",
              "relative_date",
              "multiple_possible_dates",
              "unclear",
          ]),
          estimatedEffortHours: { type: SchemaType.NUMBER, nullable: true },
          effortRangeLow: { type: SchemaType.NUMBER, nullable: true },
          effortRangeHigh: { type: SchemaType.NUMBER, nullable: true },
          effortBasis: { type: SchemaType.STRING },
          effortConfidence: { type: SchemaType.INTEGER },
          academicImportance: enumString([
            "critical",
            "high",
            "medium",
            "low",
            "unknown",
          ]),
          weightPercent: { type: SchemaType.NUMBER, nullable: true },
          submissionMode: enumString([
            "online",
            "in_person",
            "email",
            "lms",
            "unknown",
          ]),
          description: { type: SchemaType.STRING },
          subtasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          evidence: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                field: { type: SchemaType.STRING },
                quote: { type: SchemaType.STRING },
                confidence: { type: SchemaType.INTEGER },
              },
              required: ["field", "quote", "confidence"],
            },
          },
          ambiguities: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                field: { type: SchemaType.STRING },
                issue: { type: SchemaType.STRING },
                options: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: ["field", "issue", "options"],
            },
          },
          extractionConfidence: { type: SchemaType.INTEGER },
        },
        required: [
          "title",
          "academicType",
          "courseCode",
          "courseName",
          "dueDate",
          "dueTime",
          "timezone",
          "dueDateText",
          "dateAmbiguity",
          "estimatedEffortHours",
          "effortRangeLow",
          "effortRangeHigh",
          "effortBasis",
          "effortConfidence",
          "academicImportance",
          "weightPercent",
          "submissionMode",
          "description",
          "subtasks",
          "evidence",
          "ambiguities",
          "extractionConfidence",
        ],
      },
    },
    globalAmbiguities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          field: { type: SchemaType.STRING },
          issue: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["field", "issue", "options"],
      },
    },
    shouldAskUser: { type: SchemaType.BOOLEAN },
  },
  required: [
    "schemaVersion",
    "inputLanguage",
    "deadlines",
    "globalAmbiguities",
    "shouldAskUser",
  ],
} satisfies ResponseSchema;

export type GeminiExtractionResult = {
  extraction: AcademicDeadlineExtraction;
  model: string;
  rawText: string;
  latencyMs: number;
};

const buildPrompt = (input: string, timezone: string | null, now: string) => `
You are the extraction layer for DeadlinePilot AI.

Return only JSON matching schema version ${ACADEMIC_EXTRACTION_SCHEMA_VERSION}.
Prompt version: ${ACADEMIC_EXTRACTION_PROMPT_VERSION}.

Rules:
1. Extract ALL academic deadlines present in the input. Multiple assignments mean multiple deadline objects.
2. Never invent missing dates. If a date is absent or unclear, set dueDate to null and describe ambiguity.
3. Preserve the original date wording in dueDateText.
4. Distinguish explicit dates from relative dates using dateAmbiguity.
5. Identify ambiguity instead of guessing.
6. Extract course code, course name, subject, academic task type, weight, and submission mode when present.
7. Estimate effort only when there is enough evidence. Otherwise return null and low effort confidence.
8. Provide short evidence quotes for important extracted fields.
9. Do not make final priority, risk, arithmetic, schedule, or calendar decisions.
10. If the input has no academic deadline, return an empty deadlines array and shouldAskUser true.

Current timestamp: ${now}
User timezone: ${timezone ?? "unknown"}

Student input:
${input}
`;

export const extractWithGemini = async ({
  input,
  timezone,
  now,
}: {
  input: string;
  timezone: string | null;
  now: string;
}): Promise<GeminiExtractionResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const startedAt = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    {
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 32,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    },
    { timeout: TIMEOUT_MS }
  );
  const result = await model.generateContent(buildPrompt(input, timezone, now), {
    timeout: TIMEOUT_MS,
  });
  const rawText = result.response.text();
  const parsed = JSON.parse(rawText) as unknown;
  const extraction = academicDeadlineExtractionSchema.parse(parsed);

  return {
    extraction,
    model: MODEL_NAME,
    rawText,
    latencyMs: Date.now() - startedAt,
  };
};

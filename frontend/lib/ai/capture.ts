import { SchemaType, type ResponseSchema } from "@google/generative-ai";

import { Priority } from "@/lib/agent";

export const CAPTURE_PROMPT_VERSION = "capture-v1";
export const CAPTURE_MODEL = "gemini-2.5-flash";

export type CaptureExtractionRequest = {
  input: string;
  currentDate: string;
  timeZone: string;
};

export type CaptureMode =
  | "natural_language"
  | "pdf"
  | "screenshot"
  | "gmail"
  | "voice";

export const CAPTURE_MODES: Array<{
  id: CaptureMode;
  label: string;
  description: string;
  enabled: boolean;
}> = [
  {
    id: "natural_language",
    label: "Natural Language",
    description: "Describe the work in your own words.",
    enabled: true,
  },
  {
    id: "pdf",
    label: "PDF Import",
    description: "Syllabus and brief ingestion from files.",
    enabled: false,
  },
  {
    id: "screenshot",
    label: "Screenshot",
    description: "Extract deadlines from an image.",
    enabled: false,
  },
  {
    id: "gmail",
    label: "Gmail Import",
    description: "Turn emails into tasks.",
    enabled: false,
  },
  {
    id: "voice",
    label: "Voice Capture",
    description: "Dictate a task into the system.",
    enabled: false,
  },
];

export type CaptureExtractionResult = {
  title: string;
  dueDate: string;
  estimatedHours: number | null;
  priority: Priority;
  category: string;
  notes: string;
  confidence: number;
};

const priorityValues: Priority[] = ["High", "Medium", "Low"];

export const CAPTURE_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "Clear task title stripped of filler language.",
    },
    dueDate: {
      type: SchemaType.STRING,
      description: "Deadline date formatted as YYYY-MM-DD in the user's timezone.",
    },
    estimatedHours: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: "Estimated work time in hours.",
    },
    priority: {
      type: SchemaType.STRING,
      format: "enum",
      enum: priorityValues,
      description: "Task priority.",
    },
    category: {
      type: SchemaType.STRING,
      description: "Short category such as Study, Assignment, Project, or Personal.",
    },
    notes: {
      type: SchemaType.STRING,
      description: "Helpful context, assumptions, or extracted details.",
    },
    confidence: {
      type: SchemaType.INTEGER,
      description: "Extraction confidence as an integer from 0 to 100.",
    },
  },
  required: [
    "title",
    "dueDate",
    "priority",
    "category",
    "notes",
    "confidence",
  ],
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const isPriority = (value: unknown): value is Priority =>
  value === "High" || value === "Medium" || value === "Low";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValidDate = (value: unknown): value is string =>
  typeof value === "string" &&
  datePattern.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());

export const buildCapturePrompt = (
  request: CaptureExtractionRequest
) => `You are DeadlinePilot AI's capture extractor.

Convert the user's natural language into a single structured deadline task.

Rules:
- Return only JSON that matches the provided schema.
- Use YYYY-MM-DD for dueDate.
- Interpret relative dates using the current date and timezone.
- Keep the title concise and human-readable.
- Estimate work in hours if the user implied effort.
- Set priority based on urgency and workload.
- Use short categories such as Study, Assignment, Project, Exam, Personal, or Research.
- Keep notes brief but useful.
- Confidence must be an integer from 0 to 100.

Current date: ${request.currentDate}
Timezone: ${request.timeZone}

User input:
${request.input}`;

export const validateCaptureExtraction = (
  value: unknown
): CaptureExtractionResult | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const title = candidate.title;
  const dueDate = candidate.dueDate;
  const estimatedHoursValue = candidate.estimatedHours;
  const confidenceValue = candidate.confidence;

  if (
    typeof title !== "string" ||
    title.trim().length === 0 ||
    !isValidDate(dueDate) ||
    !isPriority(candidate.priority) ||
    !isFiniteNumber(confidenceValue)
  ) {
    return null;
  }

  const estimatedHours =
    estimatedHoursValue === null || estimatedHoursValue === undefined
      ? null
      : isFiniteNumber(estimatedHoursValue) && estimatedHoursValue >= 0
        ? estimatedHoursValue
        : null;

  const confidence = Math.round(confidenceValue);

  if (confidence < 0 || confidence > 100) {
    return null;
  }

  return {
    title: title.trim(),
    dueDate,
    estimatedHours,
    priority: candidate.priority,
    category:
      typeof candidate.category === "string" && candidate.category.trim().length > 0
        ? candidate.category.trim()
        : "General",
    notes:
      typeof candidate.notes === "string" ? candidate.notes.trim() : "",
    confidence,
  };
};

export const buildCaptureExtractionFallbackMessage = () =>
  "Gemini could not extract a task from that input. Try adding more detail or rephrasing the due date.";

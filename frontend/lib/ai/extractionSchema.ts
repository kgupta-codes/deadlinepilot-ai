import { z } from "zod";

export const ACADEMIC_EXTRACTION_SCHEMA_VERSION =
  "academic-deadline-extraction-v1";
export const ACADEMIC_EXTRACTION_PROMPT_VERSION =
  "academic-deadline-prompt-v1";

export const academicTypeSchema = z.enum([
  "assignment",
  "exam",
  "quiz",
  "project",
  "presentation",
  "lab",
  "reading",
  "admin",
  "other",
]);

export const dateAmbiguitySchema = z.enum([
  "none",
  "missing_year",
  "relative_date",
  "multiple_possible_dates",
  "unclear",
]);

export const academicImportanceSchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "unknown",
]);

export const submissionModeSchema = z.enum([
  "online",
  "in_person",
  "email",
  "lms",
  "unknown",
]);

const trimmedString = (max = 1000) => z.string().trim().max(max);
const nullableTrimmedString = (max = 1000) => trimmedString(max).nullable();

export const isoDateOrNullSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Date must be a valid YYYY-MM-DD calendar date.")
  .nullable();

export const timeOrNullSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();

const confidenceSchema = z.number().int().min(0).max(100);

export const extractionEvidenceSchema = z
  .object({
    field: trimmedString(80),
    quote: trimmedString(500),
    confidence: confidenceSchema,
  })
  .strict();

export const extractionAmbiguitySchema = z
  .object({
    field: trimmedString(80),
    issue: trimmedString(500),
    options: z.array(trimmedString(200)).max(8),
  })
  .strict();

export const extractedAcademicDeadlineSchema = z
  .object({
    title: trimmedString(200).min(1),
    academicType: academicTypeSchema,
    courseCode: nullableTrimmedString(80),
    courseName: nullableTrimmedString(160),
    dueDate: isoDateOrNullSchema,
    dueTime: timeOrNullSchema,
    timezone: nullableTrimmedString(80),
    dueDateText: nullableTrimmedString(200),
    dateAmbiguity: dateAmbiguitySchema,
    estimatedEffortHours: z.number().finite().min(0).max(1000).nullable(),
    effortRangeLow: z.number().finite().min(0).max(1000).nullable(),
    effortRangeHigh: z.number().finite().min(0).max(1000).nullable(),
    effortBasis: trimmedString(500),
    effortConfidence: confidenceSchema,
    academicImportance: academicImportanceSchema,
    weightPercent: z.number().finite().min(0).max(100).nullable(),
    submissionMode: submissionModeSchema,
    description: trimmedString(5000),
    subtasks: z.array(trimmedString(300).min(1)).max(20),
    evidence: z.array(extractionEvidenceSchema).max(20),
    ambiguities: z.array(extractionAmbiguitySchema).max(20),
    extractionConfidence: confidenceSchema,
  })
  .strict()
  .superRefine((deadline, context) => {
    if (
      deadline.effortRangeLow != null &&
      deadline.effortRangeHigh != null &&
      deadline.effortRangeLow > deadline.effortRangeHigh
    ) {
      context.addIssue({
        code: "custom",
        path: ["effortRangeLow"],
        message: "effortRangeLow cannot exceed effortRangeHigh.",
      });
    }

    if (deadline.dueDate === null && deadline.dateAmbiguity === "none") {
      context.addIssue({
        code: "custom",
        path: ["dateAmbiguity"],
        message: "Missing dueDate must include date ambiguity.",
      });
    }
  });

export const academicDeadlineExtractionSchema = z
  .object({
    schemaVersion: z.literal(ACADEMIC_EXTRACTION_SCHEMA_VERSION),
    inputLanguage: trimmedString(80),
    deadlines: z.array(extractedAcademicDeadlineSchema).max(20),
    globalAmbiguities: z.array(extractionAmbiguitySchema).max(20),
    shouldAskUser: z.boolean(),
  })
  .strict();

export type AcademicType = z.infer<typeof academicTypeSchema>;
export type DateAmbiguity = z.infer<typeof dateAmbiguitySchema>;
export type AcademicImportance = z.infer<typeof academicImportanceSchema>;
export type SubmissionMode = z.infer<typeof submissionModeSchema>;
export type ExtractionEvidence = z.infer<typeof extractionEvidenceSchema>;
export type ExtractionAmbiguity = z.infer<typeof extractionAmbiguitySchema>;
export type ExtractedAcademicDeadline = z.infer<
  typeof extractedAcademicDeadlineSchema
>;
export type AcademicDeadlineExtraction = z.infer<
  typeof academicDeadlineExtractionSchema
>;

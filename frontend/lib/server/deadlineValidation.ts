import "server-only";

import { z } from "zod";

import {
  academicTypeSchema,
  dateAmbiguitySchema,
  submissionModeSchema,
  timeOrNullSchema,
} from "@/lib/ai/extractionSchema";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "dueDate must use YYYY-MM-DD format.",
}).refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}, {
  message: "dueDate must be a valid calendar date.",
});

const nullableTrimmedString = z
  .string()
  .trim()
  .max(5000)
  .nullable();

export const deadlineAiMetadataSchema = z
  .object({
    source: z.enum(["gemini", "mock", "manual"]),
    model: nullableTrimmedString,
    confidence: z.number().int().min(0).max(100).nullable(),
    rawText: nullableTrimmedString,
    promptVersion: nullableTrimmedString,
    extractedAt: nullableTrimmedString,
    schemaVersion: nullableTrimmedString.optional(),
    fallbackReason: nullableTrimmedString.optional(),
    validationWarnings: z.array(z.string().trim().max(500)).max(20).optional(),
    dateAmbiguity: dateAmbiguitySchema.optional(),
    reviewResolved: z.boolean().optional(),
  })
  .strict();

export const deadlineWriteSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    dueDate: isoDateSchema,
    dueTime: timeOrNullSchema.optional(),
    timezone: z.string().trim().max(80).nullable().optional(),
    priority: z.enum(["High", "Medium", "Low"]),
    status: z.enum(["Not Started", "In Progress", "Completed"]),
    estimatedHours: z.number().finite().min(0).max(1000).nullable().optional(),
    academicType: academicTypeSchema.optional(),
    courseCode: z.string().trim().max(80).nullable().optional(),
    courseName: z.string().trim().max(160).nullable().optional(),
    weightPercent: z.number().finite().min(0).max(100).nullable().optional(),
    submissionMode: submissionModeSchema.optional(),
    category: z.string().trim().max(100).optional(),
    description: z.string().trim().max(5000).optional(),
    subtasks: z.array(z.string().trim().min(1).max(300)).max(100).optional(),
    notes: z.string().trim().max(10000).optional(),
    origin: z
      .enum([
        "manual",
        "natural_language",
        "pdf",
        "screenshot",
        "gmail",
        "calendar",
        "voice",
        "drive",
      ])
      .optional(),
    aiMetadata: deadlineAiMetadataSchema.nullable().optional(),
  })
  .strict()
  .superRefine((deadline, context) => {
    const isAiDerived =
      deadline.origin === "natural_language" ||
      deadline.origin === "pdf" ||
      deadline.origin === "screenshot" ||
      deadline.origin === "gmail" ||
      deadline.origin === "voice" ||
      deadline.origin === "drive";

    if (!isAiDerived) {
      return;
    }

    if (!deadline.aiMetadata) {
      context.addIssue({
        code: "custom",
        path: ["aiMetadata"],
        message: "AI-derived deadlines require AI metadata.",
      });
      return;
    }

    if (deadline.aiMetadata.confidence == null) {
      context.addIssue({
        code: "custom",
        path: ["aiMetadata", "confidence"],
        message: "AI-derived deadlines require extraction confidence.",
      });
    }

    if (
      deadline.aiMetadata.confidence != null &&
      deadline.aiMetadata.confidence < 70 &&
      !deadline.aiMetadata.reviewResolved
    ) {
      context.addIssue({
        code: "custom",
        path: ["aiMetadata", "reviewResolved"],
        message: "Low-confidence AI deadlines require review confirmation.",
      });
    }

    if (
      deadline.aiMetadata.dateAmbiguity &&
      deadline.aiMetadata.dateAmbiguity !== "none"
    ) {
      context.addIssue({
        code: "custom",
        path: ["aiMetadata", "dateAmbiguity"],
        message: "Ambiguous AI due dates must be resolved before saving.",
      });
    }
  });

export type ValidatedDeadlineWrite = z.infer<typeof deadlineWriteSchema>;

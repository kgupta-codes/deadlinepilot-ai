import "server-only";

import { normalizePriority, type Priority } from "@/lib/agent";

import { normalizeExtractedDeadlineDate } from "./dateNormalizer";
import {
  ACADEMIC_EXTRACTION_PROMPT_VERSION,
  ACADEMIC_EXTRACTION_SCHEMA_VERSION,
  academicDeadlineExtractionSchema,
  type AcademicDeadlineExtraction,
  type AcademicImportance,
  type ExtractedAcademicDeadline,
} from "./extractionSchema";
import { buildFallbackExtraction } from "./fallbackExtractor";
import { extractWithGemini } from "./geminiClient";

export type CaptureDraft = {
  id: string;
  title: string;
  academicType: ExtractedAcademicDeadline["academicType"];
  courseCode: string | null;
  courseName: string | null;
  dueDate: string | null;
  dueTime: string | null;
  timezone: string | null;
  dueDateText: string | null;
  dateAmbiguity: ExtractedAcademicDeadline["dateAmbiguity"];
  estimatedHours: number | null;
  effortRangeLow: number | null;
  effortRangeHigh: number | null;
  effortBasis: string;
  effortConfidence: number;
  academicImportance: AcademicImportance;
  weightPercent: number | null;
  submissionMode: ExtractedAcademicDeadline["submissionMode"];
  priority: Priority;
  category: string;
  description: string;
  subtasks: string[];
  confidence: number;
  evidence: ExtractedAcademicDeadline["evidence"];
  ambiguities: ExtractedAcademicDeadline["ambiguities"];
  needsReview: boolean;
  reviewReasons: string[];
};

export type CaptureExtractionResponse = {
  success: true;
  source: "gemini" | "mock";
  model: string | null;
  promptVersion: string;
  schemaVersion: string;
  fallbackReason: string | null;
  validationWarnings: string[];
  extraction: AcademicDeadlineExtraction;
  drafts: CaptureDraft[];
  shouldAskUser: boolean;
};

const derivePriority = (
  importance: AcademicImportance,
  dueDate: string | null,
  now: Date
): Priority => {
  if (importance === "critical" || importance === "high") return "High";
  if (importance === "low") return "Low";

  if (dueDate) {
    const due = new Date(`${dueDate}T00:00:00Z`);
    if (!Number.isNaN(due.getTime())) {
      const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
      if (days <= 1) return "High";
      if (days > 14 && importance === "unknown") return "Low";
    }
  }

  return normalizePriority("Medium");
};

const deriveCategory = (deadline: ExtractedAcademicDeadline) =>
  deadline.courseCode ||
  deadline.courseName ||
  deadline.academicType[0].toUpperCase() + deadline.academicType.slice(1);

const buildReviewReasons = (deadline: ExtractedAcademicDeadline) => {
  const reasons: string[] = [];

  if (deadline.extractionConfidence < 70) {
    reasons.push("Extraction confidence is below 70%.");
  } else if (deadline.extractionConfidence < 90) {
    reasons.push("Review recommended because confidence is below 90%.");
  }

  if (!deadline.dueDate) {
    reasons.push("A confirmed due date is required before saving.");
  }

  if (deadline.dateAmbiguity !== "none") {
    reasons.push(`Date needs review: ${deadline.dateAmbiguity}.`);
  }

  deadline.ambiguities.forEach((ambiguity) => {
    reasons.push(`${ambiguity.field}: ${ambiguity.issue}`);
  });

  return Array.from(new Set(reasons));
};

const mapDrafts = (
  extraction: AcademicDeadlineExtraction,
  now: Date,
  timezone: string | null
): CaptureDraft[] =>
  extraction.deadlines.map((deadline, index) => {
    const normalized = normalizeExtractedDeadlineDate(
      deadline,
      now,
      timezone ?? deadline.timezone ?? "UTC"
    );
    const reviewReasons = buildReviewReasons(normalized);

    return {
      id: `draft-${index}-${normalized.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "deadline"}`,
      title: normalized.title,
      academicType: normalized.academicType,
      courseCode: normalized.courseCode,
      courseName: normalized.courseName,
      dueDate: normalized.dueDate,
      dueTime: normalized.dueTime,
      timezone: normalized.timezone,
      dueDateText: normalized.dueDateText,
      dateAmbiguity: normalized.dateAmbiguity,
      estimatedHours: normalized.estimatedEffortHours,
      effortRangeLow: normalized.effortRangeLow,
      effortRangeHigh: normalized.effortRangeHigh,
      effortBasis: normalized.effortBasis,
      effortConfidence: normalized.effortConfidence,
      academicImportance: normalized.academicImportance,
      weightPercent: normalized.weightPercent,
      submissionMode: normalized.submissionMode,
      priority: derivePriority(normalized.academicImportance, normalized.dueDate, now),
      category: deriveCategory(normalized),
      description: normalized.description,
      subtasks: normalized.subtasks,
      confidence: normalized.extractionConfidence,
      evidence: normalized.evidence,
      ambiguities: normalized.ambiguities,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
    };
  });

const normalizeExtraction = (
  extraction: AcademicDeadlineExtraction,
  now: Date,
  timezone: string | null
) => {
  const normalizedDeadlines = extraction.deadlines.map((deadline) =>
    normalizeExtractedDeadlineDate(deadline, now, timezone ?? deadline.timezone ?? "UTC")
  );

  return academicDeadlineExtractionSchema.parse({
    ...extraction,
    deadlines: normalizedDeadlines,
    shouldAskUser:
      extraction.shouldAskUser ||
      normalizedDeadlines.some(
        (deadline) =>
          deadline.dueDate === null ||
          deadline.dateAmbiguity !== "none" ||
          deadline.extractionConfidence < 90 ||
          deadline.ambiguities.length > 0
      ),
  });
};

const toResponse = ({
  extraction,
  source,
  model,
  fallbackReason,
  validationWarnings,
  now,
  timezone,
}: {
  extraction: AcademicDeadlineExtraction;
  source: "gemini" | "mock";
  model: string | null;
  fallbackReason: string | null;
  validationWarnings: string[];
  now: Date;
  timezone: string | null;
}): CaptureExtractionResponse => {
  const normalized = normalizeExtraction(extraction, now, timezone);

  return {
    success: true,
    source,
    model,
    promptVersion: ACADEMIC_EXTRACTION_PROMPT_VERSION,
    schemaVersion: ACADEMIC_EXTRACTION_SCHEMA_VERSION,
    fallbackReason,
    validationWarnings,
    extraction: normalized,
    drafts: mapDrafts(normalized, now, timezone),
    shouldAskUser: normalized.shouldAskUser,
  };
};

export const extractAcademicDeadlines = async ({
  input,
  timezone,
  now,
}: {
  input: string;
  timezone: string | null;
  now: Date;
}): Promise<CaptureExtractionResponse> => {
  try {
    const gemini = await extractWithGemini({
      input,
      timezone,
      now: now.toISOString(),
    });

    return toResponse({
      extraction: gemini.extraction,
      source: "gemini",
      model: gemini.model,
      fallbackReason: null,
      validationWarnings: [],
      now,
      timezone,
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Gemini extraction failed.";
    const fallback = buildFallbackExtraction(input, timezone);

    return toResponse({
      extraction: fallback,
      source: "mock",
      model: "offline-rules-v1",
      fallbackReason: reason,
      validationWarnings: [reason],
      now,
      timezone,
    });
  }
};

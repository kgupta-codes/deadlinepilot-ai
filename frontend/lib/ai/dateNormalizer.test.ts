import { describe, expect, it } from "vitest";

import { getCaptureDraftSaveBlockReason } from "./captureReviewRules";
import { normalizeExtractedDeadlineDate } from "./dateNormalizer";
import { buildFallbackExtraction } from "./fallbackExtractor";
import type { ExtractedAcademicDeadline } from "./extractionSchema";

const baseDeadline: ExtractedAcademicDeadline = {
  title: "Submit Report",
  academicType: "assignment",
  courseCode: null,
  courseName: "Writing",
  dueDate: null,
  dueTime: null,
  timezone: "UTC",
  dueDateText: null,
  dateAmbiguity: "unclear",
  estimatedEffortHours: null,
  effortRangeLow: null,
  effortRangeHigh: null,
  effortBasis: "No estimate.",
  effortConfidence: 20,
  academicImportance: "medium",
  weightPercent: null,
  submissionMode: "unknown",
  description: "Submit report.",
  subtasks: [],
  evidence: [],
  ambiguities: [],
  extractionConfidence: 80,
};

const normalize = (dueDateText: string) =>
  normalizeExtractedDeadlineDate(
    { ...baseDeadline, dueDateText },
    new Date("2026-08-24T12:00:00.000Z"),
    "UTC"
  );

describe("normalizeExtractedDeadlineDate", () => {
  it("normalizes explicit date text", () => {
    expect(normalize("September 4, 2026").dueDate).toBe("2026-09-04");
  });

  it("normalizes today", () => {
    expect(normalize("today").dueDate).toBe("2026-08-24");
  });

  it("normalizes tomorrow", () => {
    expect(normalize("tomorrow").dueDate).toBe("2026-08-25");
  });

  it("normalizes Friday", () => {
    expect(normalize("Friday").dueDate).toBe("2026-08-28");
  });

  it("normalizes next Friday", () => {
    expect(normalize("next Friday").dueDate).toBe("2026-09-04");
  });

  it("marks ambiguous numeric dates", () => {
    const normalized = normalize("09/04");

    expect(normalized.dueDate).toBeNull();
    expect(normalized.dateAmbiguity).toBe("multiple_possible_dates");
  });

  it("does not add a false date ambiguity to a valid fallback due date", () => {
    const fallback = buildFallbackExtraction(
      "Finish physics assignment before Friday. Takes about 4 hours.",
      "UTC"
    );
    const deadline = fallback.deadlines[0]!;
    const normalized = normalizeExtractedDeadlineDate(
      deadline,
      new Date("2026-08-24T12:00:00.000Z"),
      "UTC"
    );

    expect(normalized.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(normalized.dateAmbiguity).toBe("none");
    expect(normalized.ambiguities).toEqual([]);
    expect(
      getCaptureDraftSaveBlockReason({
        dueDate: normalized.dueDate,
        dateAmbiguity: normalized.dateAmbiguity,
        ambiguities: normalized.ambiguities,
        confidence: 95,
        needsReview: false,
        reviewResolved: false,
      })
    ).toBeNull();
  });
});

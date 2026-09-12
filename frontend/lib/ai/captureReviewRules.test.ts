import { describe, expect, it } from "vitest";

import { getCaptureDraftSaveBlockReason } from "./captureReviewRules";
import type { CaptureReviewState } from "./captureReviewRules";

const reviewedDraft: CaptureReviewState = {
  dueDate: "2026-09-04",
  dateAmbiguity: "none",
  ambiguities: [],
  confidence: 95,
  needsReview: false,
  reviewResolved: false,
};

describe("getCaptureDraftSaveBlockReason", () => {
  it("blocks missing dates", () => {
    expect(
      getCaptureDraftSaveBlockReason({ ...reviewedDraft, dueDate: null })
    ).toContain("due date");
  });

  it("blocks ambiguous dates", () => {
    expect(
      getCaptureDraftSaveBlockReason({
        ...reviewedDraft,
        dateAmbiguity: "multiple_possible_dates",
      })
    ).toContain("ambiguity");
  });

  it("blocks unresolved low-confidence drafts", () => {
    expect(
      getCaptureDraftSaveBlockReason({
        ...reviewedDraft,
        confidence: 62,
        needsReview: true,
      })
    ).toContain("low-confidence");
  });

  it("allows a reviewed low-confidence draft", () => {
    expect(
      getCaptureDraftSaveBlockReason({
        ...reviewedDraft,
        confidence: 62,
        needsReview: true,
        reviewResolved: true,
      })
    ).toBeNull();
  });

  it("allows an explicitly reviewed blocking ambiguity after the date is confirmed", () => {
    expect(
      getCaptureDraftSaveBlockReason({
        ...reviewedDraft,
        ambiguities: [{ field: "courseName", issue: "Course is unclear" }],
        needsReview: true,
        reviewResolved: true,
      })
    ).toBeNull();
  });

  it("allows a normal high-confidence draft", () => {
    expect(getCaptureDraftSaveBlockReason(reviewedDraft)).toBeNull();
  });
});

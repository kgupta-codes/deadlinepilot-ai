import type { DateAmbiguity } from "./extractionSchema";

export type CaptureReviewState = {
  dueDate: string | null;
  dateAmbiguity: DateAmbiguity;
  ambiguities: readonly unknown[];
  confidence: number;
  needsReview: boolean;
  reviewResolved: boolean;
};

export const getCaptureDraftSaveBlockReason = ({
  dueDate,
  dateAmbiguity,
  ambiguities,
  confidence,
  needsReview,
  reviewResolved,
}: CaptureReviewState) => {
  if (!dueDate) {
    return "Add a due date before saving.";
  }

  if (dateAmbiguity !== "none") {
    return "Resolve the due-date ambiguity before saving.";
  }

  if (ambiguities.length > 0 && !reviewResolved) {
    return "Resolve the extraction ambiguity before saving.";
  }

  if (confidence < 70 && !reviewResolved) {
    return "Review and confirm this low-confidence draft before saving.";
  }

  if (needsReview && confidence < 70 && !reviewResolved) {
    return "Resolve the critical extraction review before saving.";
  }

  return null;
};

export const isReviewRecommended = (confidence: number) =>
  confidence >= 70 && confidence < 90;

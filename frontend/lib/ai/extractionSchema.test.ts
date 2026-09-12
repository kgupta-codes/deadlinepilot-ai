import { describe, expect, it } from "vitest";

import {
  ACADEMIC_EXTRACTION_SCHEMA_VERSION,
  academicDeadlineExtractionSchema,
} from "./extractionSchema";

const validDeadline = {
  title: "Submit Physics Lab",
  academicType: "lab",
  courseCode: "PHY101",
  courseName: "Physics",
  dueDate: "2026-09-04",
  dueTime: "17:00",
  timezone: "UTC",
  dueDateText: "September 4, 2026 at 5pm",
  dateAmbiguity: "none",
  estimatedEffortHours: 3,
  effortRangeLow: 2,
  effortRangeHigh: 4,
  effortBasis: "Lab length and explicit estimate.",
  effortConfidence: 82,
  academicImportance: "high",
  weightPercent: 15,
  submissionMode: "lms",
  description: "Submit the physics lab report.",
  subtasks: ["Finish calculations", "Upload report"],
  evidence: [{ field: "dueDate", quote: "due September 4", confidence: 95 }],
  ambiguities: [],
  extractionConfidence: 94,
};

const validExtraction = {
  schemaVersion: ACADEMIC_EXTRACTION_SCHEMA_VERSION,
  inputLanguage: "en",
  deadlines: [validDeadline],
  globalAmbiguities: [],
  shouldAskUser: false,
};

describe("academicDeadlineExtractionSchema", () => {
  it("accepts a valid structured Gemini response", () => {
    expect(academicDeadlineExtractionSchema.safeParse(validExtraction).success).toBe(
      true
    );
  });

  it("rejects an invalid response shape", () => {
    expect(
      academicDeadlineExtractionSchema.safeParse({
        ...validExtraction,
        deadlines: [{ title: "Incomplete" }],
      }).success
    ).toBe(false);
  });

  it("rejects invalid confidence", () => {
    expect(
      academicDeadlineExtractionSchema.safeParse({
        ...validExtraction,
        deadlines: [{ ...validDeadline, extractionConfidence: 101 }],
      }).success
    ).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(
      academicDeadlineExtractionSchema.safeParse({
        ...validExtraction,
        deadlines: [{ ...validDeadline, dueDate: "2026-02-30" }],
      }).success
    ).toBe(false);
  });

  it("accepts multiple deadlines", () => {
    expect(
      academicDeadlineExtractionSchema.safeParse({
        ...validExtraction,
        deadlines: [
          validDeadline,
          { ...validDeadline, title: "Read Chapter 4", academicType: "reading" },
        ],
      }).success
    ).toBe(true);
  });
});

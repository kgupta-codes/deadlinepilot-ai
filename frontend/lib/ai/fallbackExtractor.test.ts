import { describe, expect, it } from "vitest";

import { buildFallbackExtraction } from "./fallbackExtractor";
import { academicDeadlineExtractionSchema } from "./extractionSchema";

describe("buildFallbackExtraction", () => {
  it("returns the academic extraction contract for common deadline text", () => {
    const extraction = buildFallbackExtraction(
      "Finish physics assignment before Friday. Takes about 4 hours.",
      "UTC"
    );

    expect(academicDeadlineExtractionSchema.safeParse(extraction).success).toBe(
      true
    );
    expect(extraction.deadlines[0]?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("marks missing dates for review", () => {
    const extraction = buildFallbackExtraction("Finish the essay", "UTC");

    expect(extraction.deadlines[0]?.dueDate).toBeNull();
    expect(extraction.deadlines[0]?.dateAmbiguity).toBe("unclear");
    expect(extraction.shouldAskUser).toBe(true);
  });

  it("extracts multiple likely deadlines when supported by the text", () => {
    const extraction = buildFallbackExtraction(
      "Finish physics assignment by Friday and submit robotics presentation by next Wednesday",
      "UTC"
    );

    expect(extraction.deadlines.length).toBeGreaterThanOrEqual(2);
    expect(academicDeadlineExtractionSchema.safeParse(extraction).success).toBe(
      true
    );
  });
});

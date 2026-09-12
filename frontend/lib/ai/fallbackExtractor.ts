import { extractTask } from "@/src/services/ai/mock";

import {
  ACADEMIC_EXTRACTION_SCHEMA_VERSION,
  type AcademicDeadlineExtraction,
  type AcademicImportance,
  type AcademicType,
  type DateAmbiguity,
  type ExtractedAcademicDeadline,
  type SubmissionMode,
} from "./extractionSchema";

const inferAcademicType = (category: string, title: string): AcademicType => {
  const value = `${category} ${title}`.toLowerCase();

  if (/\bexam|midterm|final\b/.test(value)) return "exam";
  if (/\bquiz\b/.test(value)) return "quiz";
  if (/\blab\b/.test(value)) return "lab";
  if (/\bpresentation\b/.test(value)) return "presentation";
  if (/\bproject\b/.test(value)) return "project";
  if (/\bread|reading\b/.test(value)) return "reading";
  if (/\bemail|admin|meeting\b/.test(value)) return "admin";
  if (/\bassignment|homework|essay|report\b/.test(value)) return "assignment";
  return "other";
};

const inferImportance = (priority: string): AcademicImportance => {
  if (priority === "High") return "high";
  if (priority === "Low") return "low";
  return "medium";
};

const inferSubmissionMode = (input: string): SubmissionMode => {
  if (/\bemail\b/i.test(input)) return "email";
  if (/\bcanvas|moodle|classroom|lms|portal|upload|online\b/i.test(input)) {
    return "lms";
  }
  if (/\bin class|in person|offline\b/i.test(input)) return "in_person";
  return "unknown";
};

const clampConfidence = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

const splitLikelyDeadlines = (input: string) => {
  const normalized = input.replace(/\s+/g, " ").trim();
  const segments = normalized
    .split(/\s*(?:;|,|\band\b)\s*/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length <= 1) return [normalized];

  return segments.filter((segment) =>
    /\b(due|by|before|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|\d{1,2}[/-]\d{1,2})\b/i.test(
      segment
    )
  );
};

export const buildFallbackExtraction = (
  input: string,
  timezone: string | null
): AcademicDeadlineExtraction => {
  const segments = splitLikelyDeadlines(input);
  const deadlineInputs = segments.length > 0 ? segments : [input];
  const deadlines: ExtractedAcademicDeadline[] = deadlineInputs.map((segment) => {
    const task = extractTask(segment);
    const hasDate = task.dueDate.trim().length > 0;
    const dateAmbiguity: DateAmbiguity = hasDate ? "none" : "unclear";
    const confidence = clampConfidence(task.confidence);
    const effortConfidence = task.estimatedHours == null ? 35 : 75;

    return {
      title: task.title,
      academicType: inferAcademicType(task.category, task.title),
      courseCode: null,
      courseName: task.category || null,
      dueDate: hasDate ? task.dueDate : null,
      dueTime: null,
      timezone,
      dueDateText: hasDate ? task.dueDate : null,
      dateAmbiguity,
      estimatedEffortHours: task.estimatedHours,
      effortRangeLow: task.estimatedHours,
      effortRangeHigh: task.estimatedHours,
      effortBasis: task.estimatedHours == null ? "No explicit effort estimate found." : "Explicit effort found in text.",
      effortConfidence,
      academicImportance: inferImportance(task.priority),
      weightPercent: null,
      submissionMode: inferSubmissionMode(segment),
      description: task.description,
      subtasks: task.subtasks,
      evidence: [
        {
          field: "title",
          quote: segment.slice(0, 500),
          confidence,
        },
      ],
      ambiguities: hasDate
        ? []
        : [
            {
              field: "dueDate",
              issue: "Fallback extractor could not find a safe due date.",
              options: [],
            },
          ],
      extractionConfidence: confidence,
    };
  });

  return {
    schemaVersion: ACADEMIC_EXTRACTION_SCHEMA_VERSION,
    inputLanguage: "en",
    deadlines,
    globalAmbiguities: [],
    shouldAskUser: deadlines.some(
      (deadline) => deadline.extractionConfidence < 70 || deadline.dueDate === null
    ),
  };
};

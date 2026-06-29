import { Priority } from "@/lib/agent";

export type CaptureMode =
  | "natural_language"
  | "pdf"
  | "screenshot"
  | "gmail"
  | "voice";

export type ExtractedTask = {
  title: string;
  description: string;
  estimatedHours: number | null;
  dueDate: string;
  priority: Priority;
  category: string;
  subtasks: string[];
  confidence: number;
  source: "mock" | "gemini";
};

export const CAPTURE_EXTRACTION_VERSION = "capture-offline-v1";

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

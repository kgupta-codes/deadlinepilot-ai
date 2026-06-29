"use client";

import { useState } from "react";

import { Priority } from "@/lib/agent";
import {
  CAPTURE_EXTRACTION_VERSION,
  extractTask,
  type CaptureMode,
  type ExtractedTask,
} from "@/src/services/ai";
import type { DeadlineWriteInput } from "@/src/services/deadlines";
import type { ToastInput } from "@/hooks/useToasts";

export type CaptureTaskDraft = {
  title: string;
  dueDate: string;
  estimatedHours: number | null;
  priority: Priority;
  category: string;
  description: string;
  subtasks: string[];
  confidence: number;
  source: "mock" | "gemini";
};

type CaptureHookOptions = {
  saveDeadlineRecord: (input: DeadlineWriteInput) => Promise<void>;
  notify?: (toast: ToastInput) => void;
};

const mapExtractionToDraft = (
  extraction: ExtractedTask
): CaptureTaskDraft => ({
  title: extraction.title,
  dueDate: extraction.dueDate,
  estimatedHours: extraction.estimatedHours,
  priority: extraction.priority,
  category: extraction.category,
  description: extraction.description,
  subtasks: extraction.subtasks,
  confidence: extraction.confidence,
  source: extraction.source,
});

const buildCaptureNotes = (description: string, subtasks: string[]) => {
  const lines = [description.trim()].filter(Boolean);

  if (subtasks.length > 0) {
    lines.push(`Subtasks:\n${subtasks.map((item) => `- ${item}`).join("\n")}`);
  }

  return lines.join("\n\n").trim();
};

export const useCapture = ({ notify, saveDeadlineRecord }: CaptureHookOptions) => {
  const [mode, setMode] = useState<CaptureMode>("natural_language");
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<CaptureTaskDraft | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const resetMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const extract = async () => {
    if (!input.trim()) {
      setErrorMessage("Describe the work you want to capture first.");
      return;
    }

    if (mode !== "natural_language") {
      setStatusMessage("That capture mode is coming soon.");
      return;
    }

    setExtracting(true);
    resetMessages();

    try {
      const extraction = extractTask(input.trim());
      setDraft(mapExtractionToDraft(extraction));
      setStatusMessage("Review the extracted task before saving.");
      notify?.({
        title: "Task extracted",
        description: "Review the editable preview before saving to Firestore.",
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Capture extraction failed.";
      setErrorMessage(message);
      notify?.({
        title: "Extraction failed",
        description: message,
        tone: "error",
      });
    } finally {
      setExtracting(false);
    }
  };

  const updateDraft = (patch: Partial<CaptureTaskDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const cancelDraft = () => {
    setDraft(null);
    setStatusMessage("");
    setErrorMessage("");
  };

  const confirmSave = async () => {
    if (!draft) {
      setErrorMessage("Extract a task before saving.");
      return;
    }

    setSaving(true);
    resetMessages();

    try {
      const notes = buildCaptureNotes(draft.description, draft.subtasks);

      await saveDeadlineRecord({
        title: draft.title,
        dueDate: draft.dueDate,
        priority: draft.priority,
        status: "Not Started",
        estimatedHours: draft.estimatedHours,
        category: draft.category,
        description: draft.description,
        subtasks: draft.subtasks,
        notes,
        origin: "natural_language",
        aiMetadata: {
          source: draft.source,
          model: draft.source === "mock" ? "offline-rules-v1" : "gemini-2.5-flash",
          confidence: draft.confidence,
          rawText: input.trim(),
          promptVersion: CAPTURE_EXTRACTION_VERSION,
          extractedAt: new Date().toISOString(),
        },
      });

      setInput("");
      setDraft(null);
      setStatusMessage("Task captured and saved to Firestore.");
      notify?.({
        title: "Task saved",
        description: "The edited extraction was written to Firestore.",
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save the capture.";
      setErrorMessage(message);
      notify?.({
        title: "Save failed",
        description: message,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetCapture = () => {
    setInput("");
    setDraft(null);
    setMode("natural_language");
    resetMessages();
  };

  return {
    cancelDraft,
    confirmSave,
    draft,
    errorMessage,
    extract,
    extracting,
    input,
    mode,
    resetCapture,
    saving,
    setInput,
    setMode,
    statusMessage,
    updateDraft,
  };
};

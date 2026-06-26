"use client";

import { useState } from "react";

import { Priority } from "@/lib/agent";
import {
  CAPTURE_PROMPT_VERSION,
  type CaptureExtractionRequest,
  type CaptureExtractionResult,
  type CaptureMode,
} from "@/lib/ai/capture";
import type { DeadlineWriteInput } from "@/src/services/deadlines";

export type CaptureTaskDraft = {
  title: string;
  dueDate: string;
  estimatedHours: number | null;
  priority: Priority;
  category: string;
  notes: string;
  confidence: number;
};

type CaptureHookOptions = {
  saveDeadlineRecord: (input: DeadlineWriteInput) => Promise<void>;
};

const mapExtractionToDraft = (
  extraction: CaptureExtractionResult
): CaptureTaskDraft => ({
  title: extraction.title,
  dueDate: extraction.dueDate,
  estimatedHours: extraction.estimatedHours,
  priority: extraction.priority,
  category: extraction.category,
  notes: extraction.notes,
  confidence: extraction.confidence,
});

const buildRequestPayload = (
  input: string
): CaptureExtractionRequest => ({
  input,
  currentDate: new Date().toISOString(),
  timeZone:
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
});

export const useCapture = ({ saveDeadlineRecord }: CaptureHookOptions) => {
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
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildRequestPayload(input.trim())),
      });

      const data = (await response.json()) as
        | {
            success?: boolean;
            message?: string;
            extraction?: CaptureExtractionResult;
            promptVersion?: string;
          }
        | undefined;

      if (!response.ok || !data?.success || !data.extraction) {
        setErrorMessage(
          data?.message ||
            "Gemini could not extract a task. Try rephrasing the deadline."
        );
        return;
      }

      setDraft(mapExtractionToDraft(data.extraction));
      setStatusMessage("Review the extracted task before saving.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Capture extraction failed.";
      setErrorMessage(message);
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
      await saveDeadlineRecord({
        title: draft.title,
        dueDate: draft.dueDate,
        priority: draft.priority,
        status: "Not Started",
        estimatedHours: draft.estimatedHours,
        category: draft.category,
        notes: draft.notes,
        origin: "natural_language",
        aiMetadata: {
          source: "gemini",
          model: "gemini-2.5-flash",
          confidence: draft.confidence,
          rawText: input.trim(),
          promptVersion: CAPTURE_PROMPT_VERSION,
          extractedAt: new Date().toISOString(),
        },
      });

      setInput("");
      setDraft(null);
      setStatusMessage("Task captured and saved to Firestore.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save the capture.";
      setErrorMessage(message);
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

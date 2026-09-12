"use client";

import { useState } from "react";

import { Priority } from "@/lib/agent";
import {
  type CaptureMode,
} from "@/src/services/ai";
import { getFirebaseAuth } from "@/src/lib/firebase";
import { getCaptureDraftSaveBlockReason } from "@/lib/ai/captureReviewRules";
import type {
  DeadlineWriteInput,
  DeadlineAiMetadata,
} from "@/src/services/deadlines";
import type { ToastInput } from "@/hooks/useToasts";
import type {
  AcademicImportance,
  AcademicType,
  DateAmbiguity,
  ExtractionAmbiguity,
  ExtractionEvidence,
  SubmissionMode,
} from "@/lib/ai/extractionSchema";

export type CaptureTaskDraft = {
  id: string;
  title: string;
  academicType: AcademicType;
  courseCode: string | null;
  courseName: string | null;
  dueDate: string | null;
  dueTime: string | null;
  timezone: string | null;
  dueDateText: string | null;
  dateAmbiguity: DateAmbiguity;
  estimatedHours: number | null;
  effortRangeLow: number | null;
  effortRangeHigh: number | null;
  effortBasis: string;
  effortConfidence: number;
  academicImportance: AcademicImportance;
  weightPercent: number | null;
  submissionMode: SubmissionMode;
  priority: Priority;
  category: string;
  description: string;
  subtasks: string[];
  confidence: number;
  source: "mock" | "gemini";
  evidence: ExtractionEvidence[];
  ambiguities: ExtractionAmbiguity[];
  needsReview: boolean;
  reviewReasons: string[];
  reviewResolved: boolean;
  selected: boolean;
};

type CaptureHookOptions = {
  saveDeadlineRecord: (input: DeadlineWriteInput) => Promise<{
    success: boolean;
    message?: string;
  }>;
  notify?: (toast: ToastInput) => void;
};

type CaptureApiDraft = Omit<
  CaptureTaskDraft,
  "source" | "selected" | "reviewResolved"
>;

type CaptureApiResponse = {
  success?: boolean;
  source?: "mock" | "gemini";
  model?: string | null;
  promptVersion?: string;
  schemaVersion?: string;
  fallbackReason?: string | null;
  validationWarnings?: string[];
  drafts?: CaptureApiDraft[];
  shouldAskUser?: boolean;
  message?: string;
};

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
  const [drafts, setDrafts] = useState<CaptureTaskDraft[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captureMeta, setCaptureMeta] = useState<{
    model: string | null;
    promptVersion: string | null;
    schemaVersion: string | null;
    fallbackReason: string | null;
    validationWarnings: string[];
  }>({
    model: null,
    promptVersion: null,
    schemaVersion: null,
    fallbackReason: null,
    validationWarnings: [],
  });

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
      const user = getFirebaseAuth().currentUser;

      if (!user) {
        throw new Error("Sign in before extracting deadlines.");
      }

      const response = await fetch("/api/capture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: input.trim(),
          mode,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          now: new Date().toISOString(),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | CaptureApiResponse
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Capture extraction failed.");
      }

      const source = data.source ?? "mock";
      const nextDrafts =
        data.drafts?.map((draft) => ({
          ...draft,
          source,
          reviewResolved: false,
          selected: true,
        })) ?? [];

      if (nextDrafts.length === 0) {
        setDrafts([]);
        setCaptureMeta({
          model: data.model ?? null,
          promptVersion: data.promptVersion ?? null,
          schemaVersion: data.schemaVersion ?? null,
          fallbackReason: data.fallbackReason ?? null,
          validationWarnings: data.validationWarnings ?? [],
        });
        setStatusMessage("No academic deadlines were found. Add more detail and try again.");
        return;
      }

      setDrafts(nextDrafts);
      setCaptureMeta({
        model: data.model ?? null,
        promptVersion: data.promptVersion ?? null,
        schemaVersion: data.schemaVersion ?? null,
        fallbackReason: data.fallbackReason ?? null,
        validationWarnings: data.validationWarnings ?? [],
      });
      setStatusMessage(
        `Review ${nextDrafts.length} extracted deadline${nextDrafts.length === 1 ? "" : "s"} before saving.`
      );
      notify?.({
        title: "Deadline extraction ready",
        description: `${nextDrafts.length} draft${nextDrafts.length === 1 ? "" : "s"} ready for review.`,
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

  const updateDraft = (id: string, patch: Partial<CaptureTaskDraft>) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              ...patch,
              reviewResolved:
                "reviewResolved" in patch ? Boolean(patch.reviewResolved) : false,
            }
          : draft
      )
    );
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    setStatusMessage("");
    setErrorMessage("");
  };

  const toggleDraftSelection = (id: string) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, selected: !draft.selected } : draft
      )
    );
  };

  const toDeadlineInput = (
    draft: CaptureTaskDraft,
    metadata: DeadlineAiMetadata
  ): DeadlineWriteInput => {
    const notes = buildCaptureNotes(draft.description, draft.subtasks);

    return {
      title: draft.title,
      dueDate: draft.dueDate ?? "",
      dueTime: draft.dueTime,
      timezone: draft.timezone,
      priority: draft.priority,
      status: "Not Started",
      estimatedHours: draft.estimatedHours,
      academicType: draft.academicType,
      courseCode: draft.courseCode,
      courseName: draft.courseName,
      weightPercent: draft.weightPercent,
      submissionMode: draft.submissionMode,
      category: draft.category,
      description: draft.description,
      subtasks: draft.subtasks,
      notes,
      origin: "natural_language",
      aiMetadata: metadata,
    };
  };

  const confirmSave = async (id?: string) => {
    const selectedDrafts = id
      ? drafts.filter((draft) => draft.id === id)
      : drafts.filter((draft) => draft.selected);

    if (selectedDrafts.length === 0) {
      setErrorMessage("Extract a task before saving.");
      return;
    }

    const blockedDraft = selectedDrafts
      .map((draft) => ({
        draft,
        reason: getCaptureDraftSaveBlockReason(draft),
      }))
      .find((item) => item.reason);

    if (blockedDraft?.reason) {
      setErrorMessage(`${blockedDraft.draft.title}: ${blockedDraft.reason}`);
      return;
    }

    setSaving(true);
    resetMessages();

    try {
      for (const draft of selectedDrafts) {
        const result = await saveDeadlineRecord(
          toDeadlineInput(draft, {
            source: draft.source,
            model: captureMeta.model,
            confidence: draft.confidence,
            rawText: input.trim(),
            promptVersion: captureMeta.promptVersion,
            extractedAt: new Date().toISOString(),
            schemaVersion: captureMeta.schemaVersion,
            fallbackReason: captureMeta.fallbackReason,
            validationWarnings: captureMeta.validationWarnings,
            dateAmbiguity: draft.dateAmbiguity,
            reviewResolved: draft.reviewResolved,
          })
        );

        if (!result.success) {
          throw new Error(result.message || "Could not save the capture.");
        }
      }

      setInput("");
      setDrafts((current) =>
        id ? current.filter((draft) => draft.id !== id) : current.filter((draft) => !draft.selected)
      );
      setStatusMessage(
        `${selectedDrafts.length} deadline${selectedDrafts.length === 1 ? "" : "s"} saved to Firestore.`
      );
      notify?.({
        title: "Deadline saved",
        description: `${selectedDrafts.length} confirmed draft${selectedDrafts.length === 1 ? "" : "s"} written to Firestore.`,
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
    setDrafts([]);
    setMode("natural_language");
    resetMessages();
  };

  return {
    confirmSave,
    captureMeta,
    drafts,
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
    removeDraft,
    toggleDraftSelection,
    updateDraft,
    getSaveBlockReason: getCaptureDraftSaveBlockReason,
  };
};

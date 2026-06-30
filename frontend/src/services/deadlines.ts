import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  normalizePriority,
  normalizeStatus,
  Priority,
  sortByDueDate,
  Status,
} from "@/lib/agent";
import { getFirebaseDb } from "@/src/lib/firebase";

export type DeadlineOrigin =
  | "manual"
  | "natural_language"
  | "pdf"
  | "screenshot"
  | "gmail"
  | "calendar"
  | "voice"
  | "drive";

export type DeadlineAiMetadata = {
  source: "gemini" | "mock" | "manual";
  model: string | null;
  confidence: number | null;
  rawText: string | null;
  promptVersion: string | null;
  extractedAt: string | null;
};

export type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  userId: string;
  estimatedHours: number | null;
  category: string;
  description: string;
  subtasks: string[];
  notes: string;
  origin: DeadlineOrigin;
  aiMetadata: DeadlineAiMetadata | null;
};

type DeadlineDocument = {
  title?: unknown;
  dueDate?: unknown;
  priority?: unknown;
  status?: unknown;
  userId?: unknown;
  estimatedHours?: unknown;
  category?: unknown;
  description?: unknown;
  subtasks?: unknown;
  notes?: unknown;
  origin?: unknown;
  aiMetadata?: unknown;
};

export type DeadlineWriteInput = {
  title: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  estimatedHours?: number | null;
  category?: string;
  description?: string;
  subtasks?: string[];
  notes?: string;
  origin?: DeadlineOrigin;
  aiMetadata?: DeadlineAiMetadata | null;
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value : "";

const normalizeEstimatedHours = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  return null;
};

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizeConfidence = (value: unknown) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  ) {
    return Math.round(value);
  }

  return null;
};

const normalizeOrigin = (value: unknown): DeadlineOrigin => {
  if (
    value === "manual" ||
    value === "natural_language" ||
    value === "pdf" ||
    value === "screenshot" ||
    value === "gmail" ||
    value === "calendar" ||
    value === "voice" ||
    value === "drive"
  ) {
    return value;
  }

  return "manual";
};

const normalizeAiMetadata = (value: unknown): DeadlineAiMetadata | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DeadlineAiMetadata>;

  if (
    candidate.source !== "gemini" &&
    candidate.source !== "mock" &&
    candidate.source !== "manual"
  ) {
    return null;
  }

  return {
    source: candidate.source,
    model: normalizeString(candidate.model),
    confidence: normalizeConfidence(candidate.confidence),
    rawText: normalizeString(candidate.rawText),
    promptVersion: normalizeString(candidate.promptVersion),
    extractedAt: normalizeString(candidate.extractedAt),
  };
};

const toDeadlineRecord = (
  input: DeadlineWriteInput,
  userId: string
) => ({
  title: input.title,
  dueDate: input.dueDate,
  userId,
  priority: input.priority,
  status: input.status,
  estimatedHours: input.estimatedHours ?? null,
  category: input.category ?? "",
  description: input.description ?? "",
  subtasks: input.subtasks ?? [],
  notes: input.notes ?? "",
  origin: input.origin ?? "manual",
  aiMetadata: input.aiMetadata ?? null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const toDeadlineUpdateRecord = (input: DeadlineWriteInput) => ({
  title: input.title,
  dueDate: input.dueDate,
  priority: input.priority,
  status: input.status,
  estimatedHours: input.estimatedHours ?? null,
  category: input.category ?? "",
  description: input.description ?? "",
  subtasks: input.subtasks ?? [],
  notes: input.notes ?? "",
  origin: input.origin ?? "manual",
  aiMetadata: input.aiMetadata ?? null,
  updatedAt: serverTimestamp(),
});

export const addDeadline = async (
  input: DeadlineWriteInput,
  userId: string
) => {
  const db = getFirebaseDb();

  return await addDoc(collection(db, "deadlines"), {
    ...toDeadlineRecord(input, userId),
  });
};

export const getDeadlines = async (userId: string): Promise<Deadline[]> => {
  const db = getFirebaseDb();
  const q = query(collection(db, "deadlines"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const deadlines: Deadline[] = snapshot.docs.map((item) => {
    const data = item.data() as DeadlineDocument;

    return {
      id: item.id,
      title: typeof data.title === "string" ? data.title : "",
      dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
      priority: normalizePriority(data.priority),
      status: normalizeStatus(data.status),
      userId: typeof data.userId === "string" ? data.userId : userId,
      estimatedHours: normalizeEstimatedHours(data.estimatedHours),
      category: normalizeString(data.category),
      description: normalizeString(data.description),
      subtasks: normalizeStringArray(data.subtasks),
      notes: normalizeString(data.notes),
      origin: normalizeOrigin(data.origin),
      aiMetadata: normalizeAiMetadata(data.aiMetadata),
    };
  });

  return sortByDueDate(deadlines);
};

const assertDeadlineOwner = async (id: string, userId: string) => {
  const db = getFirebaseDb();
  const reference = doc(db, "deadlines", id);
  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    throw new Error("Deadline not found.");
  }

  const data = snapshot.data() as DeadlineDocument;

  if (data.userId !== userId) {
    throw new Error("Deadline does not belong to the current user.");
  }

  return reference;
};

export const deleteDeadline = async (id: string, userId: string) => {
  const reference = await assertDeadlineOwner(id, userId);
  await deleteDoc(reference);
};

export const updateDeadline = async (
  id: string,
  userId: string,
  input: DeadlineWriteInput
) => {
  const reference = await assertDeadlineOwner(id, userId);

  await updateDoc(reference, {
    ...toDeadlineUpdateRecord(input),
  });
};

import "server-only";

import {
  FieldValue,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { sortByDueDate } from "@/lib/agent";
import type { Deadline } from "@/src/services/deadlines";

import { ApiError } from "./auth";
import { getAdminDb } from "./firebaseAdmin";
import type { ValidatedDeadlineWrite } from "./deadlineValidation";

const DEADLINES_COLLECTION = "deadlines";

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value : "";

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const toDeadline = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
  userId: string
): Deadline => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: normalizeString(data.title),
    dueDate: normalizeString(data.dueDate),
    priority:
      data.priority === "High" || data.priority === "Low"
        ? data.priority
        : "Medium",
    status:
      data.status === "In Progress" || data.status === "Completed"
        ? data.status
        : "Not Started",
    userId,
    dueTime: normalizeString(data.dueTime) || null,
    timezone: normalizeString(data.timezone) || null,
    estimatedHours:
      typeof data.estimatedHours === "number" && Number.isFinite(data.estimatedHours)
        ? data.estimatedHours
        : null,
    academicType:
      data.academicType === "assignment" ||
      data.academicType === "exam" ||
      data.academicType === "quiz" ||
      data.academicType === "project" ||
      data.academicType === "presentation" ||
      data.academicType === "lab" ||
      data.academicType === "reading" ||
      data.academicType === "admin"
        ? data.academicType
        : "other",
    courseCode: normalizeString(data.courseCode) || null,
    courseName: normalizeString(data.courseName) || null,
    weightPercent:
      typeof data.weightPercent === "number" && Number.isFinite(data.weightPercent)
        ? data.weightPercent
        : null,
    submissionMode:
      data.submissionMode === "online" ||
      data.submissionMode === "in_person" ||
      data.submissionMode === "email" ||
      data.submissionMode === "lms"
        ? data.submissionMode
        : "unknown",
    category: normalizeString(data.category),
    description: normalizeString(data.description),
    subtasks: normalizeStringArray(data.subtasks),
    notes: normalizeString(data.notes),
    origin:
      data.origin === "natural_language" ||
      data.origin === "pdf" ||
      data.origin === "screenshot" ||
      data.origin === "gmail" ||
      data.origin === "calendar" ||
      data.origin === "voice" ||
      data.origin === "drive"
        ? data.origin
        : "manual",
    aiMetadata:
      data.aiMetadata && typeof data.aiMetadata === "object"
        ? {
            source:
              data.aiMetadata.source === "gemini" ||
              data.aiMetadata.source === "mock"
                ? data.aiMetadata.source
                : "manual",
            model: normalizeString(data.aiMetadata.model),
            confidence:
              typeof data.aiMetadata.confidence === "number" &&
              Number.isFinite(data.aiMetadata.confidence)
                ? data.aiMetadata.confidence
                : null,
            rawText: normalizeString(data.aiMetadata.rawText),
            promptVersion: normalizeString(data.aiMetadata.promptVersion),
            extractedAt: normalizeString(data.aiMetadata.extractedAt),
            schemaVersion: normalizeString(data.aiMetadata.schemaVersion),
            fallbackReason: normalizeString(data.aiMetadata.fallbackReason),
            validationWarnings: normalizeStringArray(
              data.aiMetadata.validationWarnings
            ),
            dateAmbiguity:
              data.aiMetadata.dateAmbiguity === "missing_year" ||
              data.aiMetadata.dateAmbiguity === "relative_date" ||
              data.aiMetadata.dateAmbiguity === "multiple_possible_dates" ||
              data.aiMetadata.dateAmbiguity === "unclear"
                ? data.aiMetadata.dateAmbiguity
                : "none",
            reviewResolved: data.aiMetadata.reviewResolved === true,
          }
        : null,
  };
};

const toCreateRecord = (input: ValidatedDeadlineWrite, userId: string) => ({
  title: input.title,
  dueDate: input.dueDate,
  userId,
  dueTime: input.dueTime ?? null,
  timezone: input.timezone ?? null,
  priority: input.priority,
  status: input.status,
  estimatedHours: input.estimatedHours ?? null,
  academicType: input.academicType ?? "other",
  courseCode: input.courseCode ?? null,
  courseName: input.courseName ?? null,
  weightPercent: input.weightPercent ?? null,
  submissionMode: input.submissionMode ?? "unknown",
  category: input.category ?? "",
  description: input.description ?? "",
  subtasks: input.subtasks ?? [],
  notes: input.notes ?? "",
  origin: input.origin ?? "manual",
  aiMetadata: input.aiMetadata ?? null,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

const toUpdateRecord = (input: ValidatedDeadlineWrite) => ({
  title: input.title,
  dueDate: input.dueDate,
  dueTime: input.dueTime ?? null,
  timezone: input.timezone ?? null,
  priority: input.priority,
  status: input.status,
  estimatedHours: input.estimatedHours ?? null,
  academicType: input.academicType ?? "other",
  courseCode: input.courseCode ?? null,
  courseName: input.courseName ?? null,
  weightPercent: input.weightPercent ?? null,
  submissionMode: input.submissionMode ?? "unknown",
  category: input.category ?? "",
  description: input.description ?? "",
  subtasks: input.subtasks ?? [],
  notes: input.notes ?? "",
  origin: input.origin ?? "manual",
  aiMetadata: input.aiMetadata ?? null,
  updatedAt: FieldValue.serverTimestamp(),
});

const getOwnedDeadlineSnapshot = async (id: string, userId: string) => {
  const snapshot = await getAdminDb()
    .collection(DEADLINES_COLLECTION)
    .doc(id)
    .get();

  if (!snapshot.exists) {
    throw new ApiError(404, "Deadline not found.");
  }

  const data = snapshot.data();

  if (data?.userId !== userId) {
    throw new ApiError(403, "Deadline does not belong to the current user.");
  }

  return snapshot as QueryDocumentSnapshot<DocumentData>;
};

export const listDeadlinesForUser = async (userId: string) => {
  const snapshot = await getAdminDb()
    .collection(DEADLINES_COLLECTION)
    .where("userId", "==", userId)
    .get();
  const deadlines = snapshot.docs.map((doc) => toDeadline(doc, userId));

  return sortByDueDate(deadlines);
};

export const getDeadlineForUser = async (id: string, userId: string) => {
  const snapshot = await getOwnedDeadlineSnapshot(id, userId);

  return toDeadline(snapshot, userId);
};

export const createDeadlineForUser = async (
  input: ValidatedDeadlineWrite,
  userId: string
) => {
  const reference = await getAdminDb()
    .collection(DEADLINES_COLLECTION)
    .add(toCreateRecord(input, userId));

  return getDeadlineForUser(reference.id, userId);
};

export const updateDeadlineForUser = async (
  id: string,
  input: ValidatedDeadlineWrite,
  userId: string
) => {
  await getOwnedDeadlineSnapshot(id, userId);
  await getAdminDb()
    .collection(DEADLINES_COLLECTION)
    .doc(id)
    .update(toUpdateRecord(input));

  return getDeadlineForUser(id, userId);
};

export const deleteDeadlineForUser = async (id: string, userId: string) => {
  await getOwnedDeadlineSnapshot(id, userId);
  await getAdminDb().collection(DEADLINES_COLLECTION).doc(id).delete();
};

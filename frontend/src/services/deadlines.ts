import {
  type AcademicType,
  type DateAmbiguity,
  type SubmissionMode,
} from "@/lib/ai/extractionSchema";
import {
  normalizePriority,
  normalizeStatus,
  Priority,
  sortByDueDate,
  Status,
} from "@/lib/agent";
import { getFirebaseAuth } from "@/src/lib/firebase";

const TOKEN_REFRESH_WINDOW_MS = 2 * 60 * 1000;

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
  schemaVersion?: string | null;
  fallbackReason?: string | null;
  validationWarnings?: string[];
  dateAmbiguity?: DateAmbiguity;
  reviewResolved?: boolean;
};

export type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  userId: string;
  dueTime: string | null;
  timezone: string | null;
  estimatedHours: number | null;
  academicType: AcademicType;
  courseCode: string | null;
  courseName: string | null;
  weightPercent: number | null;
  submissionMode: SubmissionMode;
  category: string;
  description: string;
  subtasks: string[];
  notes: string;
  origin: DeadlineOrigin;
  aiMetadata: DeadlineAiMetadata | null;
};

type DeadlineDocument = {
  id?: unknown;
  title?: unknown;
  dueDate?: unknown;
  priority?: unknown;
  status?: unknown;
  userId?: unknown;
  dueTime?: unknown;
  timezone?: unknown;
  estimatedHours?: unknown;
  academicType?: unknown;
  courseCode?: unknown;
  courseName?: unknown;
  weightPercent?: unknown;
  submissionMode?: unknown;
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
  dueTime?: string | null;
  timezone?: string | null;
  estimatedHours?: number | null;
  academicType?: AcademicType;
  courseCode?: string | null;
  courseName?: string | null;
  weightPercent?: number | null;
  submissionMode?: SubmissionMode;
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

const normalizePercent = (value: unknown) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  ) {
    return value;
  }

  return null;
};

const normalizeAcademicType = (value: unknown): AcademicType => {
  if (
    value === "assignment" ||
    value === "exam" ||
    value === "quiz" ||
    value === "project" ||
    value === "presentation" ||
    value === "lab" ||
    value === "reading" ||
    value === "admin"
  ) {
    return value;
  }

  return "other";
};

const normalizeSubmissionMode = (value: unknown): SubmissionMode => {
  if (
    value === "online" ||
    value === "in_person" ||
    value === "email" ||
    value === "lms"
  ) {
    return value;
  }

  return "unknown";
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
    schemaVersion: normalizeString(candidate.schemaVersion),
    fallbackReason: normalizeString(candidate.fallbackReason),
    validationWarnings: normalizeStringArray(candidate.validationWarnings),
    dateAmbiguity:
      candidate.dateAmbiguity === "missing_year" ||
      candidate.dateAmbiguity === "relative_date" ||
      candidate.dateAmbiguity === "multiple_possible_dates" ||
      candidate.dateAmbiguity === "unclear"
        ? candidate.dateAmbiguity
        : "none",
    reviewResolved: candidate.reviewResolved === true,
  };
};

const shouldRefreshToken = async (forceRefresh: boolean) => {
  if (forceRefresh) {
    return true;
  }

  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("Authentication is required.");
  }

  const tokenResult = await user.getIdTokenResult();
  const expiresAt = new Date(tokenResult.expirationTime).getTime();

  return expiresAt - Date.now() <= TOKEN_REFRESH_WINDOW_MS;
};

const getAuthHeaders = async (forceRefresh = false) => {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("Authentication is required.");
  }

  return {
    Authorization: `Bearer ${await user.getIdToken(
      await shouldRefreshToken(forceRefresh)
    )}`,
    "Content-Type": "application/json",
  };
};

export const authenticatedDeadlineFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
) => {
  const headers = new Headers(init.headers);
  const authHeaders = await getAuthHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshedHeaders = new Headers(init.headers);
  const refreshedAuthHeaders = await getAuthHeaders(true);

  Object.entries(refreshedAuthHeaders).forEach(([key, value]) => {
    refreshedHeaders.set(key, value);
  });

  return fetch(input, {
    ...init,
    headers: refreshedHeaders,
  });
};

const parseApiError = async (response: Response) => {
  const data = (await response.json().catch(() => null)) as
    | { message?: unknown }
    | null;

  return typeof data?.message === "string"
    ? data.message
    : "Deadline request failed.";
};

const toDeadline = (id: string, data: DeadlineDocument, fallbackUserId = ""): Deadline => ({
  id,
  title: typeof data.title === "string" ? data.title : "",
  dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
  priority: normalizePriority(data.priority),
  status: normalizeStatus(data.status),
  userId: typeof data.userId === "string" ? data.userId : fallbackUserId,
  dueTime: normalizeString(data.dueTime) || null,
  timezone: normalizeString(data.timezone) || null,
  estimatedHours: normalizeEstimatedHours(data.estimatedHours),
  academicType: normalizeAcademicType(data.academicType),
  courseCode: normalizeString(data.courseCode) || null,
  courseName: normalizeString(data.courseName) || null,
  weightPercent: normalizePercent(data.weightPercent),
  submissionMode: normalizeSubmissionMode(data.submissionMode),
  category: normalizeString(data.category),
  description: normalizeString(data.description),
  subtasks: normalizeStringArray(data.subtasks),
  notes: normalizeString(data.notes),
  origin: normalizeOrigin(data.origin),
  aiMetadata: normalizeAiMetadata(data.aiMetadata),
});

export const addDeadline = async (input: DeadlineWriteInput) => {
  const response = await authenticatedDeadlineFetch("/api/deadlines", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { deadline?: DeadlineDocument };

  if (!data.deadline || typeof data.deadline.id !== "string") {
    throw new Error("Deadline API returned an invalid response.");
  }

  return toDeadline(data.deadline.id, data.deadline);
};

export const getDeadlines = async (): Promise<Deadline[]> => {
  const response = await authenticatedDeadlineFetch("/api/deadlines", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { deadlines?: DeadlineDocument[] };

  if (!Array.isArray(data.deadlines)) {
    throw new Error("Deadline API returned an invalid response.");
  }

  const deadlines = data.deadlines.map((deadline) =>
    toDeadline(
      typeof deadline.id === "string" ? deadline.id : "",
      deadline,
      getFirebaseAuth().currentUser?.uid
    )
  );

  return sortByDueDate(deadlines);
};

export const updateDeadline = async (
  id: string,
  input: DeadlineWriteInput
) => {
  const response = await authenticatedDeadlineFetch(`/api/deadlines/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { deadline?: DeadlineDocument };

  if (!data.deadline || typeof data.deadline.id !== "string") {
    throw new Error("Deadline API returned an invalid response.");
  }

  return toDeadline(data.deadline.id, data.deadline);
};

export const deleteDeadline = async (id: string) => {
  const response = await authenticatedDeadlineFetch(`/api/deadlines/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
};

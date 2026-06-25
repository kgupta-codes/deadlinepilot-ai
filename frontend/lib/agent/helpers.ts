import { AgentTask, Priority, RiskLevel, Status } from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;

export const priorityScore: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export const riskWeight: Record<RiskLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const normalizePriority = (priority: unknown): Priority => {
  if (priority === "High" || priority === "Low") {
    return priority;
  }

  return "Medium";
};

export const normalizeStatus = (status: unknown): Status => {
  if (status === "In Progress" || status === "Completed") {
    return status;
  }

  return "Not Started";
};

export const getTodayStart = (now = new Date()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today;
};

export const parseDueDate = (dueDate: string) => {
  const [year, month, day] = dueDate.split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dueDate);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const getDaysRemaining = (dueDate: string, now = new Date()) => {
  const due = parseDueDate(dueDate);
  const today = getTodayStart(now);

  return Math.ceil((due.getTime() - today.getTime()) / DAY_MS);
};

export const formatDueDate = (dueDate: string, locale = "en-IN") => {
  return parseDueDate(dueDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDaysRemaining = (daysRemaining: number) => {
  if (daysRemaining < 0) {
    return `Overdue by ${Math.abs(daysRemaining)} day${
      Math.abs(daysRemaining) === 1 ? "" : "s"
    }`;
  }

  if (daysRemaining === 0) {
    return "Due today";
  }

  return `Due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
};

export const formatDaysLeft = (daysRemaining: number) => {
  if (daysRemaining < 0) {
    return `Overdue by ${Math.abs(daysRemaining)} day${
      Math.abs(daysRemaining) === 1 ? "" : "s"
    }`;
  }

  if (daysRemaining === 0) {
    return "Due today";
  }

  return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`;
};

export const isPending = (task: AgentTask) =>
  normalizeStatus(task.status) !== "Completed";

export const isOverdue = (task: AgentTask, now = new Date()) =>
  isPending(task) && getDaysRemaining(task.dueDate, now) < 0;

export const sortByDueDate = <T extends { dueDate: string }>(
  items: T[],
  now = new Date()
) =>
  [...items].sort(
    (a, b) =>
      getDaysRemaining(a.dueDate, now) - getDaysRemaining(b.dueDate, now)
  );

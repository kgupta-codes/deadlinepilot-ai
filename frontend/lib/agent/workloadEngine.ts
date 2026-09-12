import type { CalendarEvent } from "@/lib/integrations/googleCalendar";

import {
  getDaysRemaining,
  isPending,
  normalizePriority,
  normalizeStatus,
} from "./helpers";
import { estimateWorkload } from "./scheduleEngine";
import type {
  CollisionLevel,
  DailyCapacity,
  DeadlineUrgency,
  PlanningTask,
  WorkloadAnalysis,
  WorkloadCollision,
} from "./types";

export type StudyWindowConfig = {
  dayStartHour: number;
  dayEndHour: number;
};

const DEFAULT_STUDY_WINDOW: StudyWindowConfig = {
  dayStartHour: 8,
  dayEndHour: 21,
};

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

const roundHours = (hours: number) => Math.round(hours * 10) / 10;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDueTimestamp = (task: PlanningTask) => {
  const dueTime = task.dueTime || "23:59";

  if (task.timezone === "UTC" || task.timezone === "Z") {
    return new Date(`${task.dueDate}T${dueTime}:00.000Z`);
  }

  if (task.timezone && /^[+-]\d{2}:\d{2}$/.test(task.timezone)) {
    return new Date(`${task.dueDate}T${dueTime}:00.000${task.timezone}`);
  }

  return new Date(`${task.dueDate}T${dueTime}:00`);
};

const getDayWindow = (
  date: Date,
  now: Date,
  deadline: Date,
  config: StudyWindowConfig
) => {
  const start = new Date(date);
  start.setHours(config.dayStartHour, 0, 0, 0);

  const end = new Date(date);
  end.setHours(config.dayEndHour, 0, 0, 0);

  if (toDateKey(start) === toDateKey(now) && start < now) {
    start.setTime(now.getTime());
  }

  if (toDateKey(end) === toDateKey(deadline) && end > deadline) {
    end.setTime(deadline.getTime());
  }

  if (end < start) {
    end.setTime(start.getTime());
  }

  return { start, end };
};

const overlapMs = (
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) => Math.max(0, Math.min(aEnd.getTime(), bEnd.getTime()) - Math.max(aStart.getTime(), bStart.getTime()));

const mergeIntervals = (intervals: Array<{ start: number; end: number }>) => {
  const sorted = intervals
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];

  for (const interval of sorted) {
    const previous = merged[merged.length - 1];

    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval });
    } else {
      previous.end = Math.max(previous.end, interval.end);
    }
  }

  return merged;
};

const getBusyHoursForWindow = (
  events: CalendarEvent[],
  windowStart: Date,
  windowEnd: Date
) => {
  const intervals = events.flatMap((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const overlap = overlapMs(windowStart, windowEnd, eventStart, eventEnd);

    if (overlap <= 0) {
      return [];
    }

    return [
      {
        start: Math.max(windowStart.getTime(), eventStart.getTime()),
        end: Math.min(windowEnd.getTime(), eventEnd.getTime()),
      },
    ];
  });

  const busyMs = mergeIntervals(intervals).reduce(
    (total, interval) => total + interval.end - interval.start,
    0
  );

  return busyMs / HOUR_MS;
};

export const normalizePlanningTask = (task: PlanningTask): PlanningTask => ({
  id: task.id,
  title: task.title,
  dueDate: task.dueDate,
  dueTime: task.dueTime ?? null,
  timezone: task.timezone ?? null,
  estimatedHours:
    typeof task.estimatedHours === "number" && Number.isFinite(task.estimatedHours)
      ? task.estimatedHours
      : null,
  academicType: task.academicType ?? null,
  courseCode: task.courseCode ?? null,
  courseName: task.courseName ?? null,
  weightPercent:
    typeof task.weightPercent === "number" && Number.isFinite(task.weightPercent)
      ? task.weightPercent
      : null,
  priority: normalizePriority(task.priority),
  status: normalizeStatus(task.status),
  subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
});

export const buildDailyCapacity = ({
  now,
  deadline,
  calendarEvents,
  studyWindow = DEFAULT_STUDY_WINDOW,
}: {
  now: Date;
  deadline: Date;
  calendarEvents: CalendarEvent[];
  studyWindow?: StudyWindowConfig;
}): DailyCapacity[] => {
  if (Number.isNaN(deadline.getTime()) || deadline < now) {
    return [];
  }

  const capacities: DailyCapacity[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  const finalDay = new Date(deadline);
  finalDay.setHours(0, 0, 0, 0);

  while (cursor <= finalDay) {
    const { start, end } = getDayWindow(cursor, now, deadline, studyWindow);
    const studyWindowHours = Math.max(0, (end.getTime() - start.getTime()) / HOUR_MS);
    const busyHours = Math.min(
      studyWindowHours,
      getBusyHoursForWindow(calendarEvents, start, end)
    );

    capacities.push({
      date: toDateKey(cursor),
      availableHours: roundHours(Math.max(0, studyWindowHours - busyHours)),
      busyHours: roundHours(busyHours),
      studyWindowHours: roundHours(studyWindowHours),
    });

    cursor.setTime(cursor.getTime() + DAY_MS);
  }

  return capacities;
};

export const getRemainingEffortHours = (task: PlanningTask) => {
  if (normalizeStatus(task.status) === "Completed") {
    return 0;
  }

  const estimated = task.estimatedHours;

  if (typeof estimated === "number" && Number.isFinite(estimated) && estimated > 0) {
    return estimated;
  }

  return estimateWorkload(task);
};

export const isEffortKnown = (task: PlanningTask) =>
  typeof task.estimatedHours === "number" &&
  Number.isFinite(task.estimatedHours) &&
  task.estimatedHours > 0;

export const getDeadlineUrgency = (
  task: PlanningTask,
  now = new Date()
): DeadlineUrgency => {
  const deadline = parseDueTimestamp(task);
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / HOUR_MS;

  if (hoursUntilDeadline < 0) return "overdue";
  if (hoursUntilDeadline <= 6) return "due-now";
  if (hoursUntilDeadline <= 24) return "urgent";
  if (hoursUntilDeadline <= 72) return "soon";
  if (hoursUntilDeadline <= 7 * 24) return "upcoming";
  return "later";
};

export const getAcademicImportanceScore = (task: PlanningTask) => {
  if (typeof task.weightPercent === "number" && Number.isFinite(task.weightPercent)) {
    if (task.weightPercent >= 30) return 18;
    if (task.weightPercent >= 15) return 12;
    if (task.weightPercent >= 5) return 6;
    return 2;
  }

  if (task.academicType === "exam" || task.academicType === "project") return 8;
  if (task.academicType === "presentation" || task.academicType === "lab") return 5;
  if (task.academicType === "assignment" || task.academicType === "quiz") return 4;

  return 0;
};

const getCollisionLevel = (ratio: number): CollisionLevel => {
  if (ratio <= 0) return "none";
  if (ratio >= 1) return "critical";
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.4) return "medium";
  return "low";
};

const getCollisionScore = (level: CollisionLevel) => {
  if (level === "critical") return 18;
  if (level === "high") return 12;
  if (level === "medium") return 7;
  if (level === "low") return 3;
  return 0;
};

export const calculateWorkloadCollision = ({
  task,
  tasks,
  sharedCapacityHours,
  now,
}: {
  task: PlanningTask;
  tasks: PlanningTask[];
  sharedCapacityHours: number;
  now: Date;
}): WorkloadCollision => {
  const taskDeadline = parseDueTimestamp(task);
  const nearDeadlineLimit = new Date(taskDeadline.getTime() + DAY_MS);
  const competingTasks = tasks.filter((candidate) => {
    if (candidate.id === task.id || !isPending(candidate)) {
      return false;
    }

    const candidateDeadline = parseDueTimestamp(candidate);
    return candidateDeadline <= nearDeadlineLimit && candidateDeadline >= now;
  });
  const competingEffortHours = competingTasks.reduce(
    (total, candidate) => total + getRemainingEffortHours(candidate),
    0
  );
  const collisionRatio =
    sharedCapacityHours > 0 ? competingEffortHours / sharedCapacityHours : competingEffortHours > 0 ? 1 : 0;
  const collisionLevel = getCollisionLevel(collisionRatio);

  return {
    competingEffortHours: roundHours(competingEffortHours),
    sharedCapacityHours: roundHours(sharedCapacityHours),
    collisionRatio: Math.round(clamp(collisionRatio, 0, 9.99) * 100) / 100,
    collisionLevel,
    competingTaskIds: competingTasks.map((candidate) => candidate.id),
  };
};

export const getRecommendedNextAction = (analysis: Omit<WorkloadAnalysis, "recommendedNextAction">) => {
  if (analysis.remainingEffortHours === 0) {
    return "Task is on track.";
  }

  if (!analysis.effortKnown) {
    return "Resolve estimated effort.";
  }

  if (analysis.deadlineUrgency === "overdue" || analysis.deadlineUrgency === "due-now") {
    return "Start this task now.";
  }

  if (analysis.capacityDeficitHours > 0) {
    return analysis.remainingEffortHours >= 3
      ? "Split this task across multiple sessions."
      : "Task is at risk.";
  }

  if (analysis.remainingEffortHours > 1.5) {
    return "Schedule a 90-minute work block today.";
  }

  return "Task is on track.";
};

export const analyzeTaskWorkload = ({
  task,
  tasks,
  calendarEvents,
  now = new Date(),
  studyWindow = DEFAULT_STUDY_WINDOW,
}: {
  task: PlanningTask;
  tasks: PlanningTask[];
  calendarEvents: CalendarEvent[];
  now?: Date;
  studyWindow?: StudyWindowConfig;
}): WorkloadAnalysis => {
  const normalizedTask = normalizePlanningTask(task);
  const deadline = parseDueTimestamp(normalizedTask);
  const dailyCapacity = buildDailyCapacity({
    now,
    deadline,
    calendarEvents,
    studyWindow,
  });
  const requiredEffortHours = isEffortKnown(normalizedTask)
    ? normalizedTask.estimatedHours ?? 0
    : estimateWorkload(normalizedTask);
  const remainingEffortHours = getRemainingEffortHours(normalizedTask);
  const availableCapacityHours = dailyCapacity.reduce(
    (total, day) => total + day.availableHours,
    0
  );
  const capacityDeficitHours = Math.max(0, remainingEffortHours - availableCapacityHours);
  const completionFeasibility =
    remainingEffortHours === 0
      ? 1
      : availableCapacityHours > 0
        ? clamp(availableCapacityHours / remainingEffortHours, 0, 1)
        : 0;
  const deadlineUrgency = getDeadlineUrgency(normalizedTask, now);
  const academicImportanceScore = getAcademicImportanceScore(normalizedTask);
  const collision = calculateWorkloadCollision({
    task: normalizedTask,
    tasks,
    sharedCapacityHours: availableCapacityHours,
    now,
  });
  const uncertaintyFlags = isEffortKnown(normalizedTask)
    ? []
    : ["Estimated effort is unknown; fallback workload was used."];
  const daysRemaining = getDaysRemaining(normalizedTask.dueDate, now);
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / HOUR_MS;
  const analysisWithoutAction = {
    taskId: normalizedTask.id,
    requiredEffortHours: roundHours(requiredEffortHours),
    remainingEffortHours: roundHours(remainingEffortHours),
    availableCapacityHours: roundHours(availableCapacityHours),
    capacityDeficitHours: roundHours(capacityDeficitHours),
    deadlineUrgency,
    academicImportanceScore,
    workloadCollisionScore: getCollisionScore(collision.collisionLevel),
    completionFeasibility: Math.round(completionFeasibility * 100) / 100,
    effortKnown: isEffortKnown(normalizedTask),
    uncertaintyFlags,
    dailyCapacity,
    collision,
    overallRiskInputs: {
      daysRemaining,
      hoursUntilDeadline: Math.round(hoursUntilDeadline * 10) / 10,
      capacityDeficitHours: roundHours(capacityDeficitHours),
      completionFeasibility: Math.round(completionFeasibility * 100) / 100,
      collisionLevel: collision.collisionLevel,
      effortKnown: isEffortKnown(normalizedTask),
      academicImportanceScore,
    },
  };

  return {
    ...analysisWithoutAction,
    recommendedNextAction: getRecommendedNextAction(analysisWithoutAction),
  };
};

export const analyzeWorkloads = ({
  tasks,
  calendarEvents,
  now = new Date(),
  studyWindow,
}: {
  tasks: PlanningTask[];
  calendarEvents: CalendarEvent[];
  now?: Date;
  studyWindow?: StudyWindowConfig;
}) => {
  const normalizedTasks = tasks.map(normalizePlanningTask);

  return normalizedTasks
    .filter(isPending)
    .map((task) =>
      analyzeTaskWorkload({
        task,
        tasks: normalizedTasks,
        calendarEvents,
        now,
        studyWindow,
      })
    );
};

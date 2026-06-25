import {
  getDaysRemaining,
  isPending,
  normalizePriority,
} from "./helpers";
import { estimateWorkload } from "./scheduleEngine";
import { calculateRisk } from "./riskEngine";
import {
  AgentTask,
  PlannerMission,
  PlannerPostponement,
  PlannerPriorityScore,
  PlannerRecoveryPlan,
} from "./types";
import { PlannerConflict, PlannerStudySlot } from "./types";

type PlanningContext = {
  conflicts: PlannerConflict[];
  studySlots: PlannerStudySlot[];
  now: Date;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const scoreByDaysRemaining = (daysRemaining: number) => {
  if (daysRemaining < 0) return 40;
  if (daysRemaining === 0) return 32;
  if (daysRemaining === 1) return 26;
  if (daysRemaining === 2) return 20;
  if (daysRemaining <= 4) return 12;
  if (daysRemaining <= 7) return 6;
  return 0;
};

const countTaskConflicts = (task: AgentTask, conflicts: PlannerConflict[]) =>
  conflicts.filter((conflict) => conflict.taskIds.includes(task.id)).length;

export const scorePlannerTask = (
  task: AgentTask,
  context: PlanningContext
): PlannerPriorityScore => {
  const daysRemaining = getDaysRemaining(task.dueDate, context.now);
  const workloadHours = estimateWorkload(task);
  const risk = calculateRisk(task, context.now);
  const normalizedPriority = normalizePriority(task.priority);
  const statusPenalty =
    task.status === "In Progress" ? 4 : task.status === "Completed" ? 100 : 0;
  const calendarConflictCount = countTaskConflicts(task, context.conflicts);
  const longestStudySlot = context.studySlots.reduce(
    (max, slot) => Math.max(max, slot.durationMinutes),
    0
  );
  const workloadMinutes = workloadHours * 60;
  const calendarPenalty =
    calendarConflictCount * 10 +
    (workloadMinutes > longestStudySlot ? 8 : 0) +
    (daysRemaining <= 1 && workloadMinutes > longestStudySlot * 0.75 ? 12 : 0);
  const urgencyScore = scoreByDaysRemaining(daysRemaining);
  const priorityBoost =
    normalizedPriority === "High" ? 15 : normalizedPriority === "Medium" ? 8 : 0;
  const workloadPenalty = Math.min(18, Math.round(workloadHours * 4));
  const riskBoost =
    risk.level === "Critical"
      ? 12
      : risk.level === "High"
        ? 8
        : risk.level === "Medium"
          ? 4
          : 0;

  const rawScore =
    100 +
    urgencyScore +
    priorityBoost +
    riskBoost -
    statusPenalty -
    workloadPenalty -
    calendarPenalty;

  return {
    task,
    score: clamp(Math.round(rawScore), 0, 100),
    reasons: [
      `Deadline proximity contributes ${urgencyScore} points.`,
      `Priority contributes ${priorityBoost} points for ${normalizedPriority.toLowerCase()} priority work.`,
      `Estimated workload is ${workloadHours}h.`,
      calendarConflictCount > 0
        ? `${calendarConflictCount} calendar conflict${calendarConflictCount === 1 ? "" : "s"} reduce available focus time.`
        : "No direct calendar conflict penalties were applied.",
      task.status === "In Progress"
        ? "In-progress work gets a small execution penalty."
        : "Execution state does not block planning.",
      `Risk level is ${risk.level}.`,
    ],
    workloadHours,
    daysRemaining,
    riskLevel: risk.level,
    conflictPenalty: calendarPenalty,
  };
};

export const buildPriorityRanking = (
  tasks: AgentTask[],
  context: PlanningContext
): PlannerPriorityScore[] => {
  return tasks
    .filter(isPending)
    .map((task) => scorePlannerTask(task, context))
    .sort((a, b) => b.score - a.score || a.daysRemaining - b.daysRemaining);
};

export const selectTodayMission = (
  ranking: PlannerPriorityScore[]
): PlannerMission => {
  const top = ranking[0] || null;

  if (!top) {
    return {
      task: null,
      reason: "No pending deadlines remain for today.",
      riskLevel: "None",
      estimatedTimeRequired: 0,
      daysRemaining: null,
      completionConfidence: 100,
      priorityScore: 0,
    };
  }

  const confidence = clamp(
    100 - Math.max(0, 100 - top.score) - (top.conflictPenalty > 0 ? 6 : 0),
    5,
    100
  );

  return {
    task: top.task,
    reason: [
      `${top.task.title} has the highest planner score at ${top.score}/100.`,
      ...top.reasons.slice(0, 3),
    ].join(" "),
    riskLevel: top.riskLevel,
    estimatedTimeRequired: top.workloadHours,
    daysRemaining: top.daysRemaining,
    completionConfidence: confidence,
    priorityScore: top.score,
  };
};

export const buildRecoveryPlan = (
  ranking: PlannerPriorityScore[],
  studySlots: PlannerStudySlot[]
): PlannerRecoveryPlan => {
  const totalWorkHours = ranking.reduce(
    (total, item) => total + item.workloadHours,
    0
  );
  const availableWorkHours = studySlots.reduce(
    (total, slot) => total + slot.durationMinutes,
    0
  ) / 60;
  const impossible = totalWorkHours > availableWorkHours;
  const achievableWorkHours = Math.min(totalWorkHours, availableWorkHours);
  const postponements: PlannerPostponement[] = ranking
    .filter((item) => item.score < 60)
    .slice(1)
    .map((item) => ({
      task: item.task,
      reason:
        item.score < 40
          ? "Low planner score and calendar pressure make this a deferral candidate."
          : "This task is less urgent than the top-ranked work and can move after the mission block.",
      suggestedDelay:
        item.daysRemaining <= 1
          ? "Tomorrow after the main mission block"
          : "Later in the week",
      score: item.score,
    }));

  return {
    impossible,
    totalWorkHours: Math.round(totalWorkHours * 10) / 10,
    availableWorkHours: Math.round(availableWorkHours * 10) / 10,
    achievableWorkHours: Math.round(achievableWorkHours * 10) / 10,
    postponements,
    explanation: impossible
      ? `The workload exceeds the current study capacity by ${(totalWorkHours - availableWorkHours).toFixed(1)}h.`
      : "The current day can absorb the planned work without exceeding available study capacity.",
  };
};

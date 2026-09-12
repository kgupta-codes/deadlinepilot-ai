import {
  formatDaysRemaining,
  formatDueDate,
  normalizeStatus,
} from "./helpers";
import type { PlannerPriorityScore, RiskLevel } from "./types";

export type CapacityPresentation = {
  remaining: string;
  available: string;
  deficit: string;
  summary: string;
  showDeficit: boolean;
};

export type WorkloadTaskPresentation = {
  taskId: string;
  title: string;
  riskLevel: RiskLevel | "Completed";
  riskLabel: string;
  plannerScore: number;
  dueLabel: string;
  capacity: CapacityPresentation;
  feasibilityLabel: string;
  reasons: string[];
  recommendedNextAction: string;
  remainingEffortHours: number;
  availableCapacityHours: number;
  capacityDeficitHours: number;
  completionFeasibility: number;
  effortKnown: boolean;
  academicImportanceScore: number;
  competingEffortHours: number;
  collisionRatio: number;
  collisionLevel: string;
  deadlineUrgency: string;
};

const formatHours = (hours: number) =>
  `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`;

export const getFeasibilityLabel = (item: PlannerPriorityScore) => {
  const status = normalizeStatus(item.task.status);

  if (status === "Completed") {
    return "Completed";
  }

  if (!item.workload.effortKnown) {
    return "Estimate needed";
  }

  if (item.workload.capacityDeficitHours > 0) {
    return item.workload.completionFeasibility <= 0.35
      ? "Not enough capacity"
      : "At risk";
  }

  if (item.workload.completionFeasibility >= 1) {
    return "Comfortably feasible";
  }

  if (item.workload.completionFeasibility >= 0.75) {
    return "Tight";
  }

  return "At risk";
};

export const getCapacityPresentation = (
  item: PlannerPriorityScore
): CapacityPresentation => {
  const status = normalizeStatus(item.task.status);

  if (status === "Completed") {
    return {
      remaining: "0h remaining",
      available: `${formatHours(item.workload.availableCapacityHours)} available`,
      deficit: "No active deficit",
      summary: "Completed",
      showDeficit: false,
    };
  }

  if (!item.workload.effortKnown) {
    return {
      remaining: "Effort estimate needed",
      available: "Capacity cannot be reliably calculated",
      deficit: "Add an effort estimate",
      summary: "Estimate needed",
      showDeficit: false,
    };
  }

  const deficit = item.workload.capacityDeficitHours;

  return {
    remaining: `${formatHours(item.workload.remainingEffortHours)} remaining`,
    available: `${formatHours(item.workload.availableCapacityHours)} available`,
    deficit: deficit > 0 ? `${formatHours(deficit)} deficit` : "On track",
    summary: deficit > 0 ? `${formatHours(deficit)} deficit` : "On track",
    showDeficit: deficit > 0,
  };
};

export const getWorkloadTaskPresentation = (
  item: PlannerPriorityScore
): WorkloadTaskPresentation => {
  const status = normalizeStatus(item.task.status);
  const riskLevel = status === "Completed" ? "Completed" : item.riskLevel;
  const daysLabel = formatDaysRemaining(item.daysRemaining);

  return {
    taskId: item.task.id,
    title: item.task.title,
    riskLevel,
    riskLabel: riskLevel === "Completed" ? "COMPLETED" : riskLevel.toUpperCase(),
    plannerScore: item.score,
    dueLabel: `${daysLabel} · ${formatDueDate(item.task.dueDate)}`,
    capacity: getCapacityPresentation(item),
    feasibilityLabel: getFeasibilityLabel(item),
    reasons: item.reasons,
    recommendedNextAction: item.workload.recommendedNextAction,
    remainingEffortHours: item.workload.remainingEffortHours,
    availableCapacityHours: item.workload.availableCapacityHours,
    capacityDeficitHours: item.workload.capacityDeficitHours,
    completionFeasibility: item.workload.completionFeasibility,
    effortKnown: item.workload.effortKnown,
    academicImportanceScore: item.workload.academicImportanceScore,
    competingEffortHours: item.workload.collision.competingEffortHours,
    collisionRatio: item.workload.collision.collisionRatio,
    collisionLevel: item.workload.collision.collisionLevel,
    deadlineUrgency: item.workload.deadlineUrgency,
  };
};

export const getRankedWorkloadPresentations = (
  ranking: PlannerPriorityScore[]
) => ranking.map(getWorkloadTaskPresentation);

export const getDeadlineRiskPresentation = (
  ranking: PlannerPriorityScore[],
  taskId: string,
  status: string
) => {
  if (normalizeStatus(status) === "Completed") {
    return {
      riskLevel: "Completed" as const,
      riskLabel: "COMPLETED",
      capacitySummary: "0h remaining",
    };
  }

  const rankedTask = ranking.find((item) => item.task.id === taskId);

  if (!rankedTask) {
    return null;
  }

  const presentation = getWorkloadTaskPresentation(rankedTask);

  return {
    riskLevel: presentation.riskLevel,
    riskLabel: presentation.riskLabel,
    capacitySummary: presentation.capacity.summary,
  };
};

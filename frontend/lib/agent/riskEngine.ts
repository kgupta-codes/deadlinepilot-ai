import { getDaysRemaining, isPending, normalizePriority } from "./helpers";
import { AgentTask, RiskLevel, WorkloadAnalysis } from "./types";

export const calculateRisk = (
  task: AgentTask,
  now = new Date(),
  workload?: WorkloadAnalysis
): { level: RiskLevel; reason: string } => {
  if (!isPending(task)) {
    return {
      level: "Low",
      reason: "Completed tasks no longer create deadline risk.",
    };
  }

  const daysRemaining = getDaysRemaining(task.dueDate, now);
  const priority = normalizePriority(task.priority);

  if (daysRemaining < 0) {
    return {
      level: "Critical",
      reason: "This task is overdue and blocks schedule recovery.",
    };
  }

  if (workload) {
    const inputs = workload.overallRiskInputs;

    if (
      workload.capacityDeficitHours >= 2 &&
      (inputs.daysRemaining <= 1 || workload.completionFeasibility < 0.35)
    ) {
      return {
        level: "Critical",
        reason:
          "Required effort exceeds available capacity with too little time remaining.",
      };
    }

    if (
      workload.capacityDeficitHours > 0 ||
      workload.completionFeasibility < 0.75
    ) {
      return {
        level: "High",
        reason:
          "Available study capacity is below the remaining work required.",
      };
    }

    if (
      (workload.collision.collisionLevel === "high" ||
        workload.collision.collisionLevel === "critical") &&
      daysRemaining <= 3
    ) {
      return {
        level: "High",
        reason:
          "Several nearby deadlines compete for the same limited study capacity.",
      };
    }

    if (
      !workload.effortKnown ||
      workload.collision.collisionLevel === "medium" ||
      workload.deadlineUrgency === "soon"
    ) {
      return {
        level: "Medium",
        reason:
          "The task needs planned progress because effort, timing, or nearby workload is uncertain.",
      };
    }
  }

  if (daysRemaining <= 1 && priority === "High") {
    return {
      level: "Critical",
      reason: "High priority work is due within one day.",
    };
  }

  if (daysRemaining <= 2 || (daysRemaining <= 4 && priority === "High")) {
    return {
      level: "High",
      reason: "The deadline is close enough that delay may cause a miss.",
    };
  }

  if (daysRemaining <= 7 || priority === "High") {
    return {
      level: "Medium",
      reason: "This task needs scheduled progress before it becomes urgent.",
    };
  }

  return {
    level: "Low",
    reason: "There is enough time if the schedule stays consistent.",
  };
};

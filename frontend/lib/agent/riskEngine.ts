import { getDaysRemaining, isPending, normalizePriority } from "./helpers";
import { AgentTask, RiskLevel } from "./types";

export const calculateRisk = (
  task: AgentTask,
  now = new Date()
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

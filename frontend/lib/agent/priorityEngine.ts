import {
  getDaysRemaining,
  isPending,
  normalizePriority,
  priorityScore,
} from "./helpers";
import { calculateRisk } from "./riskEngine";
import { estimateCompletionProbability, estimateWorkload } from "./scheduleEngine";
import { AgentTask, FocusTaskInsight } from "./types";

export const prioritizeTasks = <T extends AgentTask>(
  tasks: T[],
  now = new Date()
) => {
  return [...tasks].sort((a, b) => {
    const daysA = getDaysRemaining(a.dueDate, now);
    const daysB = getDaysRemaining(b.dueDate, now);
    const overdueA = daysA < 0 ? 1 : 0;
    const overdueB = daysB < 0 ? 1 : 0;

    if (overdueA !== overdueB) {
      return overdueB - overdueA;
    }

    const priorityDelta =
      priorityScore[normalizePriority(b.priority)] -
      priorityScore[normalizePriority(a.priority)];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return daysA - daysB;
  });
};

export const sortByAgentPriority = prioritizeTasks;

export const findFocusTask = (
  tasks: AgentTask[],
  now = new Date()
): FocusTaskInsight | null => {
  const task = prioritizeTasks(tasks.filter(isPending), now)[0];

  if (!task) {
    return null;
  }

  const daysRemaining = getDaysRemaining(task.dueDate, now);
  const risk = calculateRisk(task, now);
  const priority = normalizePriority(task.priority);
  const workload = estimateWorkload(task);
  const confidence = estimateCompletionProbability(tasks, now);

  const reason =
    daysRemaining < 0
      ? `${priority} priority task is overdue.`
      : daysRemaining === 0
        ? `${priority} priority task is due today.`
        : `${priority} priority task is due in ${daysRemaining} day${
            daysRemaining === 1 ? "" : "s"
          }.`;

  return {
    task,
    daysRemaining,
    riskLevel: risk.level,
    riskReason: risk.reason,
    reason,
    estimatedEffortHours: workload,
    suggestedWorkDuration:
      workload >= 3 ? "2 focused blocks today" : "1 focused block today",
    delayImpact:
      risk.level === "Critical" || risk.level === "High"
        ? "May reduce completion probability for the remaining schedule."
        : "May move this task into a higher-risk window.",
    recommendedNextAction:
      risk.level === "Critical"
        ? "Start immediately and finish the smallest shippable part first."
        : "Schedule the next focus block before starting lower-priority work.",
    completionConfidence: confidence,
  };
};

import { isOverdue, isPending, normalizePriority } from "./helpers";
import { findFocusTask } from "./priorityEngine";
import { generateRecoveryPlan } from "./recoveryEngine";
import { estimateCompletionProbability } from "./scheduleEngine";
import { AgentTask } from "./types";

export const generateCoachAdvice = (tasks: AgentTask[], now = new Date()) => {
  const plan = generateRecoveryPlan(tasks, now);
  const focus = findFocusTask(tasks, now);
  const advice: string[] = [];

  if (plan.risk.Critical.length > 0) {
    advice.push(
      `You have ${plan.risk.Critical.length} critical deadline${
        plan.risk.Critical.length === 1 ? "" : "s"
      }.`
    );
  }

  if (focus) {
    const projected = Math.min(100, plan.completionProbability + 8);
    advice.push(
      `If you complete ${focus.task.title} today, schedule confidence can rise toward ${projected}%.`
    );
  }

  if (plan.postponementSuggestion) {
    advice.push(
      `Postponing ${plan.postponementSuggestion.task.title} reduces schedule pressure without affecting urgent work.`
    );
  }

  if (plan.conflicts.length > 0) {
    advice.push(
      `${plan.conflicts.length} due-date conflict${
        plan.conflicts.length === 1 ? "" : "s"
      } need sequencing before demo day.`
    );
  }

  if (advice.length === 0) {
    advice.push(
      "Your schedule is stable. Protect one focus block and avoid adding new work today."
    );
  }

  return advice;
};

export const generateLocalInsight = (tasks: AgentTask[], now = new Date()) => {
  const pendingTasks = tasks.filter(isPending);
  const overdue = pendingTasks.filter((task) => isOverdue(task, now)).length;
  const highPriority = pendingTasks.filter(
    (task) => normalizePriority(task.priority) === "High"
  ).length;
  const focus = findFocusTask(tasks, now);
  const probability = estimateCompletionProbability(tasks, now);
  const advice = generateCoachAdvice(tasks, now);

  return [
    `${highPriority} high-priority tasks remaining`,
    `${overdue} overdue tasks need attention`,
    `Next critical task: ${focus?.task.title || "No pending tasks"}`,
    `Completion probability: ${probability}%`,
    `Recommended action: ${advice[0]}`,
  ].join("\n\n");
};

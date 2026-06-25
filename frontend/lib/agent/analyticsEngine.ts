import {
  getDaysRemaining,
  isOverdue,
  isPending,
  normalizePriority,
} from "./helpers";
import { AgentDashboardMetrics, AgentTask } from "./types";

export const calculateCompletionRate = (tasks: AgentTask[]) => {
  if (tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter((task) => task.status === "Completed").length;
  return Math.round((completed / tasks.length) * 100);
};

export const calculateProductivityScore = (tasks: AgentTask[], now = new Date()) => {
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const overdue = tasks.filter((task) => isOverdue(task, now)).length;

  return Math.max(0, Math.min(100, 100 - overdue * 10 + completed * 5));
};

export const calculateUpcomingPressure = (tasks: AgentTask[], now = new Date()) => {
  return tasks
    .filter(isPending)
    .filter((task) => {
      const daysRemaining = getDaysRemaining(task.dueDate, now);
      return daysRemaining >= 0 && daysRemaining <= 7;
    }).length;
};

export const calculateDashboardMetrics = (
  tasks: AgentTask[],
  now = new Date()
): AgentDashboardMetrics => {
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const pending = tasks.length - completed;
  const overdue = tasks.filter((task) => isOverdue(task, now)).length;
  const highPriority = tasks.filter(
    (task) =>
      normalizePriority(task.priority) === "High" && task.status !== "Completed"
  ).length;

  return {
    completed,
    pending,
    overdue,
    highPriority,
    completionRate: calculateCompletionRate(tasks),
    productivityScore: calculateProductivityScore(tasks, now),
    upcomingPressure: calculateUpcomingPressure(tasks, now),
  };
};

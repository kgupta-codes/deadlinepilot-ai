import {
  getDaysRemaining,
  isOverdue,
  isPending,
  normalizePriority,
  normalizeStatus,
} from "./helpers";
import { prioritizeTasks } from "./priorityEngine";
import { AgentTask, DailyMission, WeeklyMission } from "./types";

export const estimateWorkload = (task: AgentTask) => {
  if (task.estimatedHours && task.estimatedHours > 0) {
    return task.estimatedHours;
  }

  const priority = normalizePriority(task.priority);
  const status = normalizeStatus(task.status);
  const baseHours =
    priority === "High" ? 4 : priority === "Medium" ? 2.5 : 1.5;

  return status === "In Progress" ? Math.max(1, baseHours - 1) : baseHours;
};

export const estimateCompletionProbability = (
  tasks: AgentTask[],
  now = new Date()
) => {
  const pendingTasks = tasks.filter(isPending);

  if (pendingTasks.length === 0) {
    return 100;
  }

  const overduePenalty = pendingTasks.filter((task) =>
    isOverdue(task, now)
  ).length;
  const urgentPenalty = pendingTasks.filter((task) => {
    const daysRemaining = getDaysRemaining(task.dueDate, now);
    return daysRemaining >= 0 && daysRemaining <= 2;
  }).length;
  const workload = pendingTasks.reduce(
    (total, task) => total + estimateWorkload(task),
    0
  );

  const probability =
    95 - overduePenalty * 18 - urgentPenalty * 8 - Math.max(0, workload - 12) * 2;

  return Math.max(5, Math.min(100, Math.round(probability)));
};

export const generateDailyMission = (
  tasks: AgentTask[],
  now = new Date()
): DailyMission => {
  const orderedTasks = prioritizeTasks(tasks.filter(isPending), now);
  const missionTasks = orderedTasks.slice(0, 3);
  const focusTask = missionTasks[0] || null;
  const confidence = estimateCompletionProbability(tasks, now);
  const focusBlocks = missionTasks.map((task, index) => {
    const hours = estimateWorkload(task);
    const minutes = hours >= 3 ? 90 : 60;
    return `Block ${index + 1}: ${minutes} minutes on ${task.title}`;
  });

  return {
    focusTask,
    tasks: missionTasks,
    focusBlocks,
    nextAction: focusTask
      ? `Start ${focusTask.title} and complete one concrete deliverable before switching tasks.`
      : "No pending work remains. Review upcoming deadlines and keep the schedule clear.",
    confidence,
  };
};

export const generateWeeklyMission = (
  tasks: AgentTask[],
  now = new Date()
): WeeklyMission => {
  const pendingTasks = prioritizeTasks(tasks.filter(isPending), now);
  const thisWeek = pendingTasks.filter(
    (task) => getDaysRemaining(task.dueDate, now) <= 7
  );
  const later = pendingTasks.filter(
    (task) => getDaysRemaining(task.dueDate, now) > 7
  );

  return {
    thisWeek,
    later,
    summary:
      thisWeek.length > 0
        ? `${thisWeek.length} tasks need attention this week.`
        : "No deadline pressure in the next seven days.",
  };
};

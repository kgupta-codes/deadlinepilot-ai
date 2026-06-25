import {
  getDaysRemaining,
  isPending,
  normalizePriority,
  riskWeight,
} from "./helpers";
import { prioritizeTasks } from "./priorityEngine";
import { calculateRisk } from "./riskEngine";
import {
  estimateCompletionProbability,
  estimateWorkload,
  generateDailyMission,
} from "./scheduleEngine";
import {
  AgentTask,
  DeadlineConflict,
  PostponementSuggestion,
  RecoveryPlan,
  RiskLevel,
} from "./types";

export const detectOverloadedSchedule = (
  tasks: AgentTask[],
  now = new Date(),
  availableHoursToday = 6
) => {
  const urgentWorkload = tasks
    .filter(isPending)
    .filter((task) => getDaysRemaining(task.dueDate, now) <= 2)
    .reduce((total, task) => total + estimateWorkload(task), 0);

  return urgentWorkload > availableHoursToday;
};

export const detectDeadlineConflicts = (
  tasks: AgentTask[],
  now = new Date()
): DeadlineConflict[] => {
  const grouped = tasks.filter(isPending).reduce<Record<string, AgentTask[]>>(
    (groups, task) => {
      groups[task.dueDate] = [...(groups[task.dueDate] || []), task];
      return groups;
    },
    {}
  );

  return Object.entries(grouped)
    .filter(([, dueTasks]) => dueTasks.length > 1)
    .map(([dueDate, dueTasks]) => {
      const highestRisk = dueTasks
        .map((task) => calculateRisk(task, now).level)
        .sort((a, b) => riskWeight[b] - riskWeight[a])[0];

      return {
        dueDate,
        tasks: prioritizeTasks(dueTasks, now),
        severity: highestRisk,
        reason: `${dueTasks.length} pending tasks share this due date.`,
      };
    });
};

export const suggestTaskPostponement = (
  tasks: AgentTask[],
  now = new Date()
): PostponementSuggestion | null => {
  const candidates = tasks
    .filter(isPending)
    .filter((task) => {
      const risk = calculateRisk(task, now).level;
      return normalizePriority(task.priority) === "Low" && risk === "Low";
    })
    .sort(
      (a, b) =>
        getDaysRemaining(b.dueDate, now) - getDaysRemaining(a.dueDate, now)
    );

  const task = candidates[0];

  if (!task) {
    return null;
  }

  return {
    task,
    reason:
      "Lowest-risk low-priority work can move later without harming critical deadlines.",
    pressureReduction: Math.round(estimateWorkload(task)),
  };
};

export const generateRecoveryPlan = (
  tasks: AgentTask[],
  now = new Date()
): RecoveryPlan => {
  const pendingTasks = prioritizeTasks(tasks.filter(isPending), now);
  const todayMission = pendingTasks.slice(0, 3);
  const tomorrow = pendingTasks.slice(3, 7);
  const dailyMission = generateDailyMission(tasks, now);

  const risk: Record<RiskLevel, AgentTask[]> = {
    Critical: [],
    High: [],
    Medium: [],
    Low: [],
  };

  pendingTasks.forEach((task) => {
    risk[calculateRisk(task, now).level].push(task);
  });

  const completionProbability = estimateCompletionProbability(tasks, now);
  const estimatedWorkload = todayMission.reduce(
    (total, task) => total + estimateWorkload(task),
    0
  );
  const overloaded = detectOverloadedSchedule(tasks, now);
  const conflicts = detectDeadlineConflicts(tasks, now);
  const postponementSuggestion = suggestTaskPostponement(tasks, now);
  const advice: string[] = [];

  if (risk.Critical.length > 0) {
    advice.push("Start with critical or overdue work before adding new tasks.");
  }

  if (risk.High.length > 0) {
    advice.push("Reserve uninterrupted focus time for high-risk deadlines.");
  }

  if (todayMission.length > 0) {
    advice.push(
      `Complete ${todayMission[0].title} first, then reassess the plan.`
    );
  }

  if (completionProbability < 60) {
    advice.push("Reduce scope or split the largest task into smaller checkpoints.");
  } else {
    advice.push("Keep the plan tight and avoid switching away from today's mission.");
  }

  if (overloaded && postponementSuggestion) {
    advice.push(
      `Postpone ${postponementSuggestion.task.title} to recover about ${postponementSuggestion.pressureReduction} hour${postponementSuggestion.pressureReduction === 1 ? "" : "s"}.`
    );
  }

  return {
    todayMission,
    tomorrow,
    suggestedWorkOrder: pendingTasks,
    estimatedWorkload,
    risk,
    completionProbability,
    advice,
    focusBlocks: dailyMission.focusBlocks,
    overloaded,
    conflicts,
    postponementSuggestion,
  };
};

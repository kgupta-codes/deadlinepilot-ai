import { CalendarEvent } from "@/lib/integrations/googleCalendar";

import { buildCalendarConflicts, buildCalendarStudySlots, buildCalendarTimeline, estimateCalendarAvailableHours } from "./calendarPlanner";
import { buildPriorityRanking, buildRecoveryPlan, selectTodayMission } from "./executionEngine";
import {
  AgenticDayPlan,
  PlanningTask,
  PlannerRecommendedSession,
  PlannerPriorityScore,
} from "./types";
import { analyzeWorkloads } from "./workloadEngine";

const roundHours = (hours: number) => Math.round(hours * 10) / 10;

/**
 * Allocates finite daily capacity across ranked tasks. This deliberately stays
 * separate from presentation and Gemini: identical inputs always yield the
 * same executable work sessions.
 */
export const buildRecommendedSessions = (
  ranking: PlannerPriorityScore[]
): { sessions: PlannerRecommendedSession[]; feasible: boolean } => {
  const capacityByDate = new Map<string, number>();
  const sessions: PlannerRecommendedSession[] = [];
  let feasible = true;

  ranking.forEach((item) => {
    item.workload.dailyCapacity.forEach((day) => {
      const current = capacityByDate.get(day.date) ?? 0;
      capacityByDate.set(day.date, Math.max(current, day.availableHours));
    });
  });

  [...ranking]
    .sort((a, b) => a.daysRemaining - b.daysRemaining || b.score - a.score)
    .forEach((item) => {
      if (!item.workload.effortKnown || item.workload.remainingEffortHours <= 0) {
        return;
      }

      let remaining = item.workload.remainingEffortHours;
      const days = item.workload.dailyCapacity
        .map((day) => day.date)
        .sort();

      for (const date of days) {
        const capacity = capacityByDate.get(date) ?? 0;
        if (remaining <= 0 || capacity <= 0) continue;

        // Short sessions keep the plan practical and distribute work naturally.
        const hours = roundHours(Math.min(1.5, remaining, capacity));
        if (hours <= 0) continue;

        sessions.push({
          id: `session-${item.task.id}-${date}-${sessions.length + 1}`,
          taskId: item.task.id,
          title: item.task.title,
          date,
          hours,
          kind: "work",
        });
        capacityByDate.set(date, roundHours(capacity - hours));
        remaining = roundHours(remaining - hours);
      }

      if (remaining > 0) feasible = false;
    });

  return { sessions, feasible };
};

export const generateAgenticDayPlan = (
  deadlines: PlanningTask[],
  calendarEvents: CalendarEvent[],
  now = new Date()
): AgenticDayPlan => {
  const studySlots = buildCalendarStudySlots(calendarEvents, now);
  const conflicts = buildCalendarConflicts(deadlines, calendarEvents, studySlots, now);
  const workloadAnalyses = analyzeWorkloads({
    tasks: deadlines,
    calendarEvents,
    now,
  });
  const workloads = new Map(
    workloadAnalyses.map((workload) => [workload.taskId, workload])
  );
  const context = {
    conflicts,
    studySlots,
    workloads,
    now,
  };
  const priorityRanking = buildPriorityRanking(deadlines, context);
  const todaysMission = selectTodayMission(priorityRanking);
  const recoveryPlan = buildRecoveryPlan(priorityRanking, studySlots);
  const recommendedPlan = buildRecommendedSessions(priorityRanking);
  const dailyTimeline = buildCalendarTimeline(
    calendarEvents,
    studySlots,
    todaysMission.task?.title || null,
    todaysMission.reason
  );

  return {
    todaysMission,
    conflicts,
    recoveryPlan,
    studySlots,
    dailyTimeline,
    priorityRanking,
    recommendedSessions: recommendedPlan.sessions,
    planFeasible: recommendedPlan.feasible,
    decisionLog: [
      `Calendar study capacity: ${estimateCalendarAvailableHours(studySlots).toFixed(1)}h.`,
      `Planner ranked ${priorityRanking.length} pending tasks.`,
      todaysMission.task
        ? `Today's mission is ${todaysMission.task.title}.`
        : "No mission selected because no pending tasks remain.",
      conflicts.length > 0
        ? `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} require attention.`
        : "No calendar conflicts were detected.",
      recommendedPlan.feasible
        ? `${recommendedPlan.sessions.length} deterministic work sessions are ready for review.`
        : "The planner could not fit every known-effort task into available capacity.",
    ],
  };
};

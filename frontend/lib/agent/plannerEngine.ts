import { CalendarEvent } from "@/lib/integrations/googleCalendar";

import { buildCalendarConflicts, buildCalendarStudySlots, buildCalendarTimeline, estimateCalendarAvailableHours } from "./calendarPlanner";
import { buildPriorityRanking, buildRecoveryPlan, selectTodayMission } from "./executionEngine";
import { AgentTask, AgenticDayPlan } from "./types";

export const generateAgenticDayPlan = (
  deadlines: AgentTask[],
  calendarEvents: CalendarEvent[],
  now = new Date()
): AgenticDayPlan => {
  const studySlots = buildCalendarStudySlots(calendarEvents, now);
  const conflicts = buildCalendarConflicts(deadlines, calendarEvents, studySlots, now);
  const context = {
    conflicts,
    studySlots,
    now,
  };
  const priorityRanking = buildPriorityRanking(deadlines, context);
  const todaysMission = selectTodayMission(priorityRanking);
  const recoveryPlan = buildRecoveryPlan(priorityRanking, studySlots);
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
    decisionLog: [
      `Calendar study capacity: ${estimateCalendarAvailableHours(studySlots).toFixed(1)}h.`,
      `Planner ranked ${priorityRanking.length} pending tasks.`,
      todaysMission.task
        ? `Today's mission is ${todaysMission.task.title}.`
        : "No mission selected because no pending tasks remain.",
      conflicts.length > 0
        ? `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} require attention.`
        : "No calendar conflicts were detected.",
    ],
  };
};

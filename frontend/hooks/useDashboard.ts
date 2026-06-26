"use client";

import { useMemo } from "react";

import {
  AgentTask,
  AgenticDayPlan,
  calculateDashboardMetrics,
  generateAgenticDayPlan,
  generateCoachAdvice,
} from "@/lib/agent";
import { CalendarEvent } from "@/lib/integrations/googleCalendar";

export type DashboardSnapshot = {
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
  completionRate: number;
  productivityScore: number;
  upcomingPressure: number;
  planner: AgenticDayPlan;
  coachAdvice: string[];
};

export const useDashboard = (
  deadlines: AgentTask[],
  calendarEvents: CalendarEvent[]
) => {
  return useMemo(() => {
    const metrics = calculateDashboardMetrics(deadlines);
    const planner = generateAgenticDayPlan(deadlines, calendarEvents);

    return {
      ...metrics,
      planner,
      coachAdvice: generateCoachAdvice(deadlines),
    } satisfies DashboardSnapshot;
  }, [calendarEvents, deadlines]);
};

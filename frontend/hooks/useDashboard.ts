"use client";

import { useMemo } from "react";

import {
  AgentTask,
  calculateDashboardMetrics,
  generateAgenticDayPlan,
  generateCoachAdvice,
} from "@/lib/agent";
import { CalendarEvent } from "@/lib/integrations/googleCalendar";

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
    };
  }, [calendarEvents, deadlines]);
};

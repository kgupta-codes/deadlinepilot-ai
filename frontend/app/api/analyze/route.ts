import { NextResponse } from "next/server";

import {
  generateAgenticDayPlan,
  type AgentTask,
  type AgenticDayPlan,
} from "@/lib/agent";
import { type CalendarEvent } from "@/lib/integrations/googleCalendar";

type DeadlineInput = {
  id?: unknown;
  title?: unknown;
  dueDate?: unknown;
  priority?: unknown;
  status?: unknown;
  estimatedHours?: unknown;
};

type CalendarEventInput = {
  id?: unknown;
  title?: unknown;
  start?: unknown;
  end?: unknown;
  calendarId?: unknown;
  location?: unknown;
  description?: unknown;
};

type AnalyzeCoachResponse = {
  coachMessage: string;
  motivation: string;
  todayMission: string;
  riskSummary: string;
  nextAction: string;
};

type AnalyzeResponse = AnalyzeCoachResponse & {
  success: boolean;
  source: "local";
  decisionLog: string[];
  agenticPlan: AgenticDayPlan;
};

const normalizeDeadlines = (value: unknown): AgentTask[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 50)
    .map((item, index): DeadlineInput => (item && typeof item === "object" ? item : { id: index }))
    .map((item, index): AgentTask => ({
      id:
        typeof item.id === "string" && item.id.trim().length > 0
          ? item.id.trim()
          : `deadline-${index}`,
      title: typeof item.title === "string" && item.title.trim().length > 0 ? item.title.trim() : "Untitled task",
      dueDate: typeof item.dueDate === "string" ? item.dueDate.trim() : "",
      priority: typeof item.priority === "string" ? item.priority : "Medium",
      status: typeof item.status === "string" ? item.status : "Not Started",
      estimatedHours:
        typeof item.estimatedHours === "number" && Number.isFinite(item.estimatedHours)
          ? item.estimatedHours
          : null,
    }));
};

const normalizeCalendarEvents = (value: unknown): CalendarEvent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 50)
    .flatMap((item, index): CalendarEvent[] => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as CalendarEventInput;
      const start = typeof candidate.start === "string" ? candidate.start.trim() : "";
      const end = typeof candidate.end === "string" ? candidate.end.trim() : "";

      if (!start || !end) {
        return [];
      }

      return [
        {
          id:
            typeof candidate.id === "string" && candidate.id.trim().length > 0
              ? candidate.id.trim()
              : `calendar-event-${index}`,
          title:
            typeof candidate.title === "string" && candidate.title.trim().length > 0
              ? candidate.title.trim()
              : "Calendar event",
          start,
          end,
          calendarId:
            typeof candidate.calendarId === "string" && candidate.calendarId.trim().length > 0
              ? candidate.calendarId.trim()
              : undefined,
          location:
            typeof candidate.location === "string" && candidate.location.trim().length > 0
              ? candidate.location.trim()
              : undefined,
          description:
            typeof candidate.description === "string" && candidate.description.trim().length > 0
              ? candidate.description.trim()
              : undefined,
        },
      ];
    });
};

const summarizeRisks = (plan: AgenticDayPlan) => {
  const criticalConflicts = plan.conflicts.filter((conflict) => conflict.severity === "Critical").length;
  const highConflicts = plan.conflicts.filter((conflict) => conflict.severity === "High").length;
  const missionTitle = plan.todaysMission.task?.title ?? "No mission selected";

  if (plan.conflicts.length === 0 && !plan.recoveryPlan.impossible) {
    return `The schedule is stable. ${missionTitle} is the main focus, and the current recovery plan stays within available capacity.`;
  }

  const conflictSummary = [
    plan.conflicts.length > 0
      ? `${plan.conflicts.length} conflict${plan.conflicts.length === 1 ? "" : "s"} were detected`
      : "No direct conflicts were detected",
    criticalConflicts > 0 ? `${criticalConflicts} critical` : null,
    highConflicts > 0 ? `${highConflicts} high-severity` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");

  const capacitySummary = plan.recoveryPlan.impossible
    ? `The workload exceeds current study capacity by ${(plan.recoveryPlan.totalWorkHours - plan.recoveryPlan.availableWorkHours).toFixed(1)}h.`
    : `Available work time is ${plan.recoveryPlan.availableWorkHours.toFixed(1)}h against ${plan.recoveryPlan.totalWorkHours.toFixed(1)}h of work.`;

  return `${conflictSummary}. ${capacitySummary}`;
};

const buildLocalAnalyzeResponse = (plan: AgenticDayPlan): AnalyzeCoachResponse => {
  const missionTitle = plan.todaysMission.task?.title ?? "No mission selected";
  const missionReason = plan.todaysMission.reason;
  const topConflict = plan.conflicts[0];
  const topStudySlot = plan.studySlots[0];

  return {
    coachMessage: plan.todaysMission.task
      ? `Keep the plan simple: focus on ${missionTitle} first and protect your study blocks.`
      : "No mission was selected, so the best move is to review the remaining schedule and clear the path for the next deadline.",
    motivation: plan.todaysMission.task
      ? `You have a clear first move. Completing ${missionTitle} will reduce pressure across the rest of the day.`
      : "The planner did not find urgent work, which means you can reset the day and stay ahead of the next deadline.",
    todayMission: plan.todaysMission.task
      ? `${missionTitle}: ${missionReason}`
      : "No mission selected. Review upcoming deadlines and keep the day open for recovery.",
    riskSummary: topConflict?.reason ?? summarizeRisks(plan),
    nextAction: plan.todaysMission.task
      ? plan.todaysMission.reason
      : topStudySlot
        ? `Use the next study slot from ${topStudySlot.start} to ${topStudySlot.end}.`
        : plan.recoveryPlan.explanation,
  };
};

const buildAnalyzeResponse = (
  plan: AgenticDayPlan,
  coachResponse: AnalyzeCoachResponse
): AnalyzeResponse => ({
  success: true,
  source: "local",
  ...coachResponse,
  decisionLog: plan.decisionLog,
  agenticPlan: plan,
});

export async function POST(req: Request) {
  let deadlines: AgentTask[] = [];
  let calendarEvents: CalendarEvent[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    deadlines = normalizeDeadlines((body as { deadlines?: unknown }).deadlines);
    calendarEvents = normalizeCalendarEvents((body as { calendarEvents?: unknown }).calendarEvents);
    const agenticPlan = generateAgenticDayPlan(deadlines, calendarEvents, new Date());

    return NextResponse.json(
      buildAnalyzeResponse(agenticPlan, buildLocalAnalyzeResponse(agenticPlan))
    );
  } catch (error) {
    console.error("Analyze Error:", error);

    const fallbackPlan = generateAgenticDayPlan(deadlines, calendarEvents, new Date());

    return NextResponse.json(
      buildAnalyzeResponse(fallbackPlan, buildLocalAnalyzeResponse(fallbackPlan))
    );
  }
}

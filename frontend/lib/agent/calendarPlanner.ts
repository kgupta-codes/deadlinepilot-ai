import {
  detectCalendarConflicts,
  suggestStudySlots,
  type CalendarEvent,
} from "@/lib/integrations/googleCalendar";

import {
  getDaysRemaining,
  isPending,
} from "./helpers";
import { estimateWorkload } from "./scheduleEngine";
import {
  AgentTask,
  PlannerConflict,
  PlannerStudySlot,
  PlannerTimelineEntry,
} from "./types";

const formatStudyTitle = (title: string) => `Recommended Study Session: ${title}`;

const minutesBetween = (start: Date, end: Date) =>
  Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

const sortByStart = <T extends { start: string }>(items: T[]) =>
  [...items].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

const getCalendarBusyMinutes = (events: CalendarEvent[]) =>
  sortByStart(events).reduce((total, event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return total + minutesBetween(start, end);
  }, 0);

export const buildCalendarStudySlots = (
  events: CalendarEvent[],
  now = new Date()
): PlannerStudySlot[] => {
  return suggestStudySlots(events, {
    now,
    maxSlots: 5,
    minimumDurationMinutes: 30,
  }).map((slot) => ({
    id: slot.id,
    start: slot.start,
    end: slot.end,
    durationMinutes: slot.durationMinutes,
    title: "Recommended Study Session",
    reason: slot.reason,
    linkedTaskId: null,
  }));
};

export const buildCalendarConflicts = (
  tasks: AgentTask[],
  events: CalendarEvent[],
  studySlots: PlannerStudySlot[],
  now = new Date()
): PlannerConflict[] => {
  const eventConflicts = detectCalendarConflicts(events).map<PlannerConflict>(
    (conflict) => ({
      id: conflict.id,
      type: "calendar-overlap",
      severity: "High",
      title: conflict.title,
      reason: conflict.reason,
      taskIds: [],
      eventIds: conflict.conflictingEventIds,
      requiredMinutes: 0,
      availableMinutes: 0,
    })
  );

  const availableMinutes = studySlots.reduce(
    (total, slot) => total + slot.durationMinutes,
    0
  );
  const busiestDayMinutes = getCalendarBusyMinutes(events);

  const deadlineConflicts = tasks
    .filter(isPending)
    .map<PlannerConflict | null>((task) => {
      const daysRemaining = getDaysRemaining(task.dueDate, now);
      const workloadMinutes = Math.round(estimateWorkload(task) * 60);
      const shortfall = workloadMinutes - availableMinutes;

      if (daysRemaining > 2 && shortfall <= 0) {
        return null;
      }

      if (daysRemaining > 2 && shortfall > 0 && busiestDayMinutes < 60) {
        return null;
      }

      if (daysRemaining > 2 && shortfall <= availableMinutes * -0.2) {
        return null;
      }

      const severity =
        daysRemaining < 0 || shortfall > availableMinutes
          ? "Critical"
          : daysRemaining <= 1 || shortfall > availableMinutes * 0.5
            ? "High"
            : "Medium";

      return {
        id: `deadline-calendar-${task.id}`,
        type: "deadline-calendar-overlap" as const,
        severity,
        title: task.title,
        reason:
          daysRemaining < 0
            ? `${task.title} is overdue while calendar commitments already consume the available work windows.`
            : `${task.title} needs ${workloadMinutes} minutes, but only ${availableMinutes} study minutes are available around existing calendar events.`,
        taskIds: [task.id],
        eventIds: events.map((event) => event.id),
        requiredMinutes: workloadMinutes,
        availableMinutes,
      };
    })
    .filter((item): item is PlannerConflict => item !== null);

  return [...eventConflicts, ...deadlineConflicts];
};

export const buildCalendarTimeline = (
  events: CalendarEvent[],
  studySlots: PlannerStudySlot[],
  missionTitle: string | null,
  missionReason: string
): PlannerTimelineEntry[] => {
  const calendarEntries: PlannerTimelineEntry[] = sortByStart(events).map(
    (event) => ({
      id: `timeline-event-${event.id}`,
      start: event.start,
      end: event.end,
      title: event.title,
      kind: "calendar",
      reason: event.description || event.location || "Scheduled calendar event.",
      taskId: null,
      eventId: event.id,
    })
  );

  const studyEntries: PlannerTimelineEntry[] = sortByStart(studySlots).map(
    (slot, index) => ({
      id: `timeline-study-${slot.id}`,
      start: slot.start,
      end: slot.end,
      title:
        index === 0 && missionTitle
          ? formatStudyTitle(missionTitle)
          : slot.title,
      kind: index === 0 && missionTitle ? "mission" : "study",
      reason:
        index === 0 && missionTitle
          ? missionReason
          : slot.reason || "Open time reserved for independent study.",
      taskId: null,
      eventId: null,
    })
  );

  const entries = [...calendarEntries, ...studyEntries].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return entries;
};

export const estimateCalendarAvailableHours = (studySlots: PlannerStudySlot[]) =>
  studySlots.reduce((total, slot) => total + slot.durationMinutes, 0) / 60;

import {
  AlertTriangle,
  CalendarRange,
  ListTodo,
  Rocket,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  AgenticDayPlan,
  PlannerConflict,
  PlannerPriorityScore,
  PlannerStudySlot,
  PlannerTimelineEntry,
} from "@/lib/agent";

type Props = {
  plan: AgenticDayPlan;
};

const formatWindow = (start: string, end: string) => {
  const formatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(
    new Date(end)
  )}`;
};

const SectionCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-purple-300" />
      <h4 className="font-semibold text-purple-200">{title}</h4>
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const EmptyState = ({ message }: { message: string }) => (
  <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-gray-400">
    {message}
  </p>
);

const PriorityList = ({ ranking }: { ranking: PlannerPriorityScore[] }) => {
  if (ranking.length === 0) {
    return <EmptyState message="No pending tasks to rank." />;
  }

  return (
    <div className="space-y-3">
      {ranking.slice(0, 6).map((item, index) => (
        <div
          key={item.task.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {index + 1}. {item.task.title}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {item.daysRemaining < 0
                  ? `${Math.abs(item.daysRemaining)} day${
                      item.daysRemaining === -1 ? "" : "s"
                    } overdue`
                  : `${item.daysRemaining} day${
                      item.daysRemaining === 1 ? "" : "s"
                    } remaining`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-300">
                {item.score}
              </p>
              <p className="text-xs text-gray-500">priority score</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-300">{item.reasons[0]}</p>
        </div>
      ))}
    </div>
  );
};

const ConflictsList = ({ conflicts }: { conflicts: PlannerConflict[] }) => {
  if (conflicts.length === 0) {
    return <EmptyState message="No calendar or deadline conflicts detected." />;
  }

  return (
    <div className="space-y-3">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{conflict.title}</p>
            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-300">
              {conflict.severity}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-300">{conflict.reason}</p>
        </div>
      ))}
    </div>
  );
};

const TimelineList = ({ entries }: { entries: PlannerTimelineEntry[] }) => {
  if (entries.length === 0) {
    return <EmptyState message="No timeline entries are available yet." />;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{entry.title}</p>
              <p className="mt-1 text-sm text-gray-400">
                {formatWindow(entry.start, entry.end)}
              </p>
            </div>
            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-300">
              {entry.kind}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-300">{entry.reason}</p>
        </div>
      ))}
    </div>
  );
};

const StudySlotsList = ({ studySlots }: { studySlots: PlannerStudySlot[] }) => {
  if (studySlots.length === 0) {
    return <EmptyState message="No study slots could be suggested." />;
  }

  return (
    <div className="space-y-3">
      {studySlots.map((slot) => (
        <div
          key={slot.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <p className="font-semibold">{slot.title}</p>
          <p className="mt-1 text-sm text-gray-400">
            {formatWindow(slot.start, slot.end)} · {slot.durationMinutes} minutes
          </p>
          <p className="mt-2 text-sm text-gray-300">{slot.reason}</p>
        </div>
      ))}
    </div>
  );
};

export default function PlannerBoard({ plan }: Props) {
  return (
    <section
      id="planner"
      className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-purple-400">
            Agentic AI Planner
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Combines Firestore deadlines with Google Calendar availability to
            plan the day, explain the mission, and expose the tradeoffs.
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-purple-200">
            Today&apos;s Mission
          </p>
          <p className="mt-1 font-semibold text-purple-100">
            {plan.todaysMission.task?.title || "No pending work"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Why it was selected
          </p>
          <p className="mt-2 text-sm text-gray-300">{plan.todaysMission.reason}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Completion confidence
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-300">
            {plan.todaysMission.completionConfidence}%
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <SectionCard icon={Rocket} title="Today's Mission">
          {plan.todaysMission.task ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="font-semibold">{plan.todaysMission.task.title}</p>
              <p className="mt-2 text-sm text-gray-300">
                Risk: {plan.todaysMission.riskLevel} · Estimated time:{" "}
                {plan.todaysMission.estimatedTimeRequired}h · Days remaining:{" "}
                {plan.todaysMission.daysRemaining ?? "n/a"}
              </p>
            </div>
          ) : (
            <EmptyState message="No mission could be selected from the current backlog." />
          )}
        </SectionCard>

        <SectionCard icon={CalendarRange} title="Today's Timeline">
          <TimelineList entries={plan.dailyTimeline.slice(0, 8)} />
        </SectionCard>

        <SectionCard icon={AlertTriangle} title="Calendar Conflicts">
          <ConflictsList conflicts={plan.conflicts} />
        </SectionCard>

        <SectionCard icon={Sparkles} title="Recommended Study Slots">
          <StudySlotsList studySlots={plan.studySlots} />
        </SectionCard>

        <SectionCard icon={ShieldCheck} title="Recovery Plan">
          <div className="space-y-3">
            <p className="text-sm text-gray-300">{plan.recoveryPlan.explanation}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-gray-400">Achievable</p>
                <p className="mt-1 text-xl font-bold text-purple-300">
                  {plan.recoveryPlan.achievableWorkHours}h
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-gray-400">Available</p>
                <p className="mt-1 text-xl font-bold text-purple-300">
                  {plan.recoveryPlan.availableWorkHours}h
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-gray-400">Total</p>
                <p className="mt-1 text-xl font-bold text-purple-300">
                  {plan.recoveryPlan.totalWorkHours}h
                </p>
              </div>
            </div>
            {plan.recoveryPlan.postponements.length > 0 ? (
              <div className="space-y-3">
                {plan.recoveryPlan.postponements.map((item) => (
                  <div
                    key={item.task.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <p className="font-semibold">{item.task.title}</p>
                    <p className="mt-1 text-sm text-gray-300">{item.reason}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Suggest delay: {item.suggestedDelay}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No postponements are necessary in the current plan." />
            )}
          </div>
        </SectionCard>

        <SectionCard icon={ListTodo} title="Priority Ranking">
          <PriorityList ranking={plan.priorityRanking} />
        </SectionCard>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h4 className="flex items-center gap-2 font-semibold text-purple-200">
          <ListTodo size={18} />
          Decision Log
        </h4>
        <div className="mt-3 space-y-2 text-sm text-gray-300">
          {plan.decisionLog.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

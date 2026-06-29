"use client";

import type { User } from "firebase/auth";
import {
  CalendarClock,
  ChevronRight,
  ListChecks,
  ShieldAlert,
  TimerReset,
  Sparkles,
} from "lucide-react";

import { useAI } from "@/hooks/useAI";
import type { AgenticDayPlan } from "@/lib/agent";
import { type AgentTask } from "@/lib/agent";
import { type CalendarEvent } from "@/lib/integrations/googleCalendar";

type Props = {
  user: User;
  greeting: string;
  planner: AgenticDayPlan;
  recommendation: string;
  deadlines: AgentTask[];
  calendarEvents: CalendarEvent[];
  loading: boolean;
};

const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
      {label}
    </p>
    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
  </div>
);

const SectionTitle = ({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
      {kicker}
    </p>
    <h3 className="text-sm font-semibold text-white">{title}</h3>
  </div>
);

export default function AICommandCenter({
  user,
  greeting,
  planner,
  recommendation,
  deadlines,
  calendarEvents,
  loading,
}: Props) {
  const { aiInsight, aiLoading, aiSource, analyze } = useAI(
    deadlines,
    calendarEvents
  );
  const missionTitle = planner.todaysMission.task?.title ?? "No mission selected";
  const missionReason = planner.todaysMission.reason;
  const confidence = `${planner.todaysMission.completionConfidence}%`;
  const availableHours = `${planner.recoveryPlan.availableWorkHours.toFixed(1)}h`;
  const nextFocusBlock = planner.studySlots[0];
  const topPriorities = planner.priorityRanking.slice(0, 3);
  const calendarOverview = `${planner.studySlots.length} study slot${
    planner.studySlots.length === 1 ? "" : "s"
  } · ${planner.conflicts.length} conflict${
    planner.conflicts.length === 1 ? "" : "s"
  }`;

  return (
    <section className="rounded-[28px] border border-violet-500/15 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_42%),linear-gradient(180deg,_rgba(9,9,11,0.98),_rgba(17,17,24,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI Command Center
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {greeting}
          </h2>

          <p className="max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Planner intelligence is grounded in deadlines, calendar load, and current
            work state. The explanation layer stays separate so the planner keeps
            working even when external AI is offline.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Account
          </p>
          <p className="mt-1 font-medium text-white">
            {user.displayName || user.email || "Signed in user"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Today's Mission" value={missionTitle} />
        <Stat label="Completion Confidence" value={confidence} />
        <Stat label="Available Study Hours" value={availableHours} />
        <Stat label="Calendar Overview" value={calendarOverview} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="flex items-start justify-between gap-4">
            <SectionTitle kicker="Mission" title="Why the planner chose this" />
            <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
              Completion confidence {confidence}
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-zinc-300">
            {missionReason}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Next focus block
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {nextFocusBlock
                  ? nextFocusBlock.title
                  : "No focus block needed right now"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {nextFocusBlock
                  ? `${nextFocusBlock.durationMinutes} minutes · ${nextFocusBlock.reason}`
                  : "The planner could not reserve a study block."}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                AI recommendation
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {recommendation}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                The explanation layer can change later without touching the planner
                decision.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <SectionTitle kicker="Actions" title="AI decisions ready for explanation" />
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
              Planner-first architecture
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-violet-300" aria-hidden="true" />
              <span>{calendarOverview}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <span>
                {planner.recoveryPlan.explanation}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
              <span>
                Risk summary:{" "}
                {planner.conflicts.length > 0
                  ? `${planner.conflicts.length} conflict${
                      planner.conflicts.length === 1 ? "" : "s"
                    } to resolve`
                  : planner.recoveryPlan.impossible
                    ? "capacity is tight"
                    : "schedule is currently stable"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span>
                {topPriorities.length > 0
                  ? `${topPriorities.length} priority task${
                      topPriorities.length === 1 ? "" : "s"
                    } surfaced`
                  : "No active priorities at the moment"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {topPriorities.length > 0 ? (
              topPriorities.map((item, index) => (
                <div
                  key={item.task.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Priority {index + 1}
                    </p>
                    <p className="truncate text-sm font-medium text-white">
                      {item.task.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {item.reasons[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-violet-200">
                      {item.score}
                    </p>
                    <p className="text-xs text-zinc-500">planner score</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                No active work items to rank.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              aria-disabled="true"
              title="Enabled in a future provider-backed milestone"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Accept Plan
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={analyze}
              disabled={aiLoading}
              title="Explain the current planner decision"
              aria-busy={aiLoading}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-violet-500/30 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? "Explaining..." : "Explain Decision"}
            </button>
            <button
              type="button"
              onClick={analyze}
              disabled={loading || aiLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-violet-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Regenerate
              <TimerReset className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Offline Coach
              </p>
              <p className="text-xs text-zinc-500">
                {aiSource === "idle" ? "Waiting for analysis" : `Source: ${aiSource}`}
              </p>
            </div>

            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
              {aiInsight ? (
                <pre className="whitespace-pre-wrap font-sans">{aiInsight}</pre>
              ) : (
                <p>
                  Press Explain Decision to generate a coach response from the
                  planner snapshot.
                </p>
              )}
            </div>
          </div>

          <p className="text-xs leading-5 text-zinc-500">
            Actions are intentionally non-destructive. The explanation layer reads
            the planner snapshot without changing the plan itself.
          </p>
        </div>
      </div>
    </section>
  );
}

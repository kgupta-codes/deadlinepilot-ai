"use client";

import type { User } from "firebase/auth";
import {
  AlertTriangle,
  CalendarClock,
  ListChecks,
  ShieldAlert,
  TimerReset,
  Sparkles,
} from "lucide-react";

import { useAI } from "@/hooks/useAI";
import type { AgenticDayPlan } from "@/lib/agent";
import { type AgentTask } from "@/lib/agent";
import { getRankedWorkloadPresentations } from "@/lib/agent/workloadPresentation";
import { type CalendarEvent } from "@/lib/integrations/googleCalendar";

type Props = {
  user: User;
  greeting: string;
  planner: AgenticDayPlan;
  recommendation: string;
  deadlines: AgentTask[];
  calendarEvents: CalendarEvent[];
  loading: boolean;
  onAcceptPlan: () => void;
  acceptingPlan: boolean;
  planStatus: string;
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

const riskClass = (riskLevel: string) => {
  if (riskLevel === "Critical") return "border-red-500/40 bg-red-500/10 text-red-100";
  if (riskLevel === "High") return "border-orange-500/40 bg-orange-500/10 text-orange-100";
  if (riskLevel === "Medium") return "border-yellow-500/40 bg-yellow-500/10 text-yellow-100";
  if (riskLevel === "Completed") return "border-green-500/40 bg-green-500/10 text-green-100";
  return "border-blue-500/40 bg-blue-500/10 text-blue-100";
};

export default function AICommandCenter({
  user,
  greeting,
  planner,
  recommendation,
  deadlines,
  calendarEvents,
  loading,
  onAcceptPlan,
  acceptingPlan,
  planStatus,
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
  const rankedWorkloads = getRankedWorkloadPresentations(planner.priorityRanking);
  const topWorkload = rankedWorkloads[0] ?? null;
  const topPriorities = rankedWorkloads.slice(0, 4);
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
            <SectionTitle kicker="Next best action" title={missionTitle} />
            {topWorkload ? (
              <div
                aria-label={`Top task risk ${topWorkload.riskLabel}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClass(
                  topWorkload.riskLevel
                )}`}
              >
                {topWorkload.riskLabel} RISK
              </div>
            ) : (
              <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
                No active risk
              </div>
            )}
          </div>

          {topWorkload ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">{topWorkload.dueLabel}</p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Work left
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {topWorkload.capacity.remaining}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Capacity
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {topWorkload.capacity.available}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Feasibility
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {topWorkload.feasibilityLabel}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      topWorkload.capacity.showDeficit
                        ? "text-orange-200"
                        : "text-zinc-400"
                    }`}
                  >
                    {topWorkload.capacity.deficit}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Why this is #1
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                  {topWorkload.reasons.slice(0, 5).map((reason) => (
                    <li key={reason} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-300" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-violet-200">
                  Next action
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {topWorkload.recommendedNextAction}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {missionReason}
            </p>
          )}

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
                Completion confidence
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {confidence}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {recommendation}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Recommended plan
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {planner.recommendedSessions.length} deterministic work session{planner.recommendedSessions.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${planner.planFeasible ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-red-500/30 bg-red-500/10 text-red-100"}`}>
                {planner.planFeasible ? "READY TO ACCEPT" : "CAPACITY CONFLICT"}
              </span>
            </div>
            {planner.recommendedSessions.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                {planner.recommendedSessions.slice(0, 4).map((session) => (
                  <li key={session.id}>{session.date} · {session.hours}h · {session.title}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={onAcceptPlan}
              disabled={acceptingPlan || !planner.planFeasible || planner.recommendedSessions.length === 0}
              className="mt-4 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {acceptingPlan ? "Saving plan..." : "Accept Plan"}
            </button>
            {planStatus ? <p role="status" className="mt-2 text-xs text-zinc-400">{planStatus}</p> : null}
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
                  key={item.taskId}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Priority {index + 1}
                      </p>
                      <p className="truncate text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {item.dueLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-violet-200">
                        {item.plannerScore}
                      </p>
                      <p className="text-xs text-zinc-500">planner score</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      aria-label={`Planner risk ${item.riskLabel}`}
                      className={`rounded-full border px-3 py-1 font-semibold ${riskClass(
                        item.riskLevel
                      )}`}
                    >
                      Risk: {item.riskLabel}
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-zinc-300">
                      {item.capacity.remaining}
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-zinc-300">
                      {item.capacity.summary}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2 text-xs leading-5 text-zinc-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
                    <span>{item.reasons[0]}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                No active work items to rank.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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

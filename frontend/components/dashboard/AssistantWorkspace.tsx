"use client";

import type { DashboardSnapshot } from "@/hooks/useDashboard";

type Props = {
  dashboard: Pick<DashboardSnapshot, "planner">;
};

export default function AssistantWorkspace({ dashboard }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <h3 className="text-2xl font-bold text-white">AI Assistant</h3>
        <p className="mt-1 text-sm text-gray-400">
          This workspace is being prepared to answer questions using the same planner
          state that powers the dashboard.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Planner Context
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Today&apos;s mission is{" "}
            {dashboard.planner.todaysMission.task?.title ?? "not selected yet"}.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Phase 2
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            A provider-backed assistant can be wired in later without changing the
            dashboard contract.
          </p>
        </div>
      </div>
    </div>
  );
}

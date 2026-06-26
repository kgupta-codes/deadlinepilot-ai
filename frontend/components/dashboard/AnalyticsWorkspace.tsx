"use client";

import type { DashboardSnapshot } from "@/hooks/useDashboard";

type Props = {
  dashboard: Pick<
    DashboardSnapshot,
    "completionRate" | "completed" | "pending" | "overdue" | "highPriority" | "productivityScore"
  >;
};

const MetricCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);

export default function AnalyticsWorkspace({ dashboard }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Analytics</h3>
        <p className="mt-1 text-sm text-gray-400">
          Keep analytics focused on planning outcomes instead of duplicate dashboard
          cards.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Completion Rate" value={`${dashboard.completionRate}%`} />
        <MetricCard label="Completed" value={dashboard.completed} />
        <MetricCard label="Pending" value={dashboard.pending} />
        <MetricCard label="Overdue" value={dashboard.overdue} />
        <MetricCard label="High Priority" value={dashboard.highPriority} />
        <MetricCard
          label="Productivity Score"
          value={dashboard.productivityScore}
        />
      </div>
    </div>
  );
}

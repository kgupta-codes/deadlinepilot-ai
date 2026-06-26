export default function QuickStats() {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
      <h3 className="mb-5 text-xl font-bold">
        Quick Insights
      </h3>

      <div className="space-y-4">
        <div className="rounded-xl bg-zinc-800 p-4">
          🔥 Highest Priority
        </div>

        <div className="rounded-xl bg-zinc-800 p-4">
          ⏳ Time Available Today
        </div>

        <div className="rounded-xl bg-zinc-800 p-4">
          📈 Productivity Trend
        </div>

        <div className="rounded-xl bg-zinc-800 p-4">
          🎯 Completion Goal
        </div>
      </div>
    </div>
  );
}

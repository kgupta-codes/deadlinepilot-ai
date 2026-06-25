"use client";

type Props = {
  completionRate: number;
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
};

export default function Analytics({
  completionRate,
  completed,
  pending,
  overdue,
  highPriority,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-6">
        Productivity Analytics
      </h3>

      <div className="space-y-4">
        <div>
          <p>Completion Rate</p>

          <div className="w-full bg-zinc-800 h-3 rounded-full mt-2">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>

          <p className="mt-1 text-green-400">
            {completionRate}%
          </p>
        </div>

        <div>✅ Completed Tasks: {completed}</div>
        <div>📌 Pending Tasks: {pending}</div>
        <div>⚠️ Overdue Tasks: {overdue}</div>
        <div>🔥 High Priority Tasks: {highPriority}</div>
      </div>
    </div>
  );
}

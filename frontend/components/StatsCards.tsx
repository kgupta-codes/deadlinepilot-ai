"use client";

type Props = {
  total: number;
  overdue: number;
  completed: number;
  highPriority: number;
};

export default function StatsCards({
  total,
  overdue,
  completed,
  highPriority,
}: Props) {
  const score = Math.max(
    0,
    100 - overdue * 10 + completed * 5
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
        <h2 className="text-3xl font-bold">
          {total}
        </h2>
        <p className="text-gray-400">
          Total
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
        <h2 className="text-3xl font-bold text-red-500">
          {highPriority}
        </h2>
        <p className="text-gray-400">
          High Priority
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
        <h2 className="text-3xl font-bold text-green-500">
          {completed}
        </h2>
        <p className="text-gray-400">
          Completed
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
        <h2 className="text-3xl font-bold text-red-400">
          {overdue}
        </h2>
        <p className="text-gray-400">
          Overdue
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900">
        <h2 className="text-3xl font-bold text-purple-400">
          {score}%
        </h2>
        <p className="text-gray-400">
          Productivity
        </p>

        <div className="w-full bg-zinc-800 h-2 rounded mt-2">
          <div
            className="bg-purple-500 h-2 rounded"
            style={{
              width: `${score}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

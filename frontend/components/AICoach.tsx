"use client";

type Props = {
  insight: string;
};

export default function AICoach({
  insight,
}: Props) {
  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <h2 className="text-xl font-semibold mb-4 text-purple-400">
        AI Productivity Coach
      </h2>

      <div className="text-gray-300 whitespace-pre-wrap">
        {insight || "Generate AI insights to receive recommendations."}
      </div>
    </div>
  );
}

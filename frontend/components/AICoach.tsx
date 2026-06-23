"use client";

export default function AICoach() {
  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <h2 className="text-xl font-semibold mb-4 text-purple-400">
        AI Productivity Coach
      </h2>

      <ul className="space-y-3 text-gray-300">
        <li>🎯 Finish your highest priority task first.</li>
        <li>⚠️ Complete at least one overdue task today.</li>
        <li>📈 Focus on improving your productivity score.</li>
        <li>🔥 Keep your study streak active.</li>
      </ul>
    </div>
  );
}

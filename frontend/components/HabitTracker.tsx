"use client";

export default function HabitTracker() {
  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <h2 className="text-xl font-semibold mb-4 text-green-400">
        Habit Tracker
      </h2>

      <div className="space-y-2">
        <div>📚 Daily Study</div>
        <div>🏋️ Workout</div>
        <div>📖 Reading</div>
        <div>💻 DSA Practice</div>
      </div>
    </div>
  );
}

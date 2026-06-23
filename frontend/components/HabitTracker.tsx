"use client";

export default function HabitTracker() {
  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <h2 className="text-xl font-semibold mb-4">
        Habit Tracker
      </h2>

      <div className="space-y-4">
        <div>
          📚 Daily Study — 80%
        </div>

        <div>
          🏋️ Workout — 60%
        </div>

        <div>
          💻 DSA Practice — 70%
        </div>
      </div>
    </div>
  );
}

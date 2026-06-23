"use client";

export default function TodayPlan() {
  return (
    <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">
        Today's Plan
      </h2>

      <div className="space-y-3">
        <div>09:00 - 10:30 → SDF Assignment</div>
        <div>11:00 - 12:00 → IPL Project</div>
        <div>16:00 - 17:00 → Robotics Report</div>
      </div>
    </div>
  );
}

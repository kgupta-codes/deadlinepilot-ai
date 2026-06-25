"use client";

import { Clock } from "lucide-react";

type Props = {
  tasks: string[];
  nextAction?: string;
  confidence?: number;
};

export default function TodayPlan({
  tasks,
  nextAction,
  confidence,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">
          Today&apos;s Plan
        </h3>

        <Clock size={20} />
      </div>

      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div key={index}>
              {index + 1}. {task}
            </div>
          ))
        ) : (
          <p>No tasks available.</p>
        )}

        <div className="pt-4 text-purple-400 font-semibold">
          Focus Tasks: {tasks.length}
        </div>

        {nextAction && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-100">
            <p className="font-semibold">Next action</p>
            <p className="mt-1">{nextAction}</p>

            {typeof confidence === "number" && (
              <p className="mt-2 text-xs text-purple-200">
                Completion confidence: {confidence}%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

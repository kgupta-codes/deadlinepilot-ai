"use client";

import { Sparkles } from "lucide-react";

type Props = {
  insight: string;
  localAdvice: string[];
  source?: "gemini" | "local" | "idle";
};

export default function AICoach({
  insight,
  localAdvice,
  source = "idle",
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
          <Sparkles size={20} aria-hidden="true" />
          AI Productivity Coach
        </h3>

        <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-300">
          {source === "gemini"
            ? "Gemini"
            : source === "local"
            ? "Local Agent"
            : "Ready"}
        </span>
      </div>

      <div className="space-y-3 text-sm text-gray-300">
        {insight ? (
          <pre className="whitespace-pre-wrap font-sans">{insight}</pre>
        ) : (
          localAdvice.map((item) => <p key={item}>{item}</p>)
        )}
      </div>
    </div>
  );
}

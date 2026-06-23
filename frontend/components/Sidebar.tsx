"use client";

import {
  LayoutDashboard,
  Calendar,
  Brain,
  Target,
  BarChart3,
} from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 p-6">
      <h1 className="text-2xl font-bold text-purple-500">
        DeadlinePilot AI
      </h1>

      <div className="mt-10 space-y-6">
        <button className="flex items-center gap-3 text-white">
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        <button className="flex items-center gap-3 text-white">
          <Calendar size={20} />
          Deadlines
        </button>

        <button className="flex items-center gap-3 text-white">
          <Brain size={20} />
          AI Coach
        </button>

        <button className="flex items-center gap-3 text-white">
          <Target size={20} />
          Habits
        </button>

        <button className="flex items-center gap-3 text-white">
          <BarChart3 size={20} />
          Analytics
        </button>
      </div>
    </div>
  );
}

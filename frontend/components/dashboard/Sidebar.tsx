"use client";

import {
  BarChart3,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  Rocket,
  Settings,
  Sparkles,
} from "lucide-react";

export type NavSection = {
  id: string;
  label: string;
};

type Props = {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  sections: NavSection[];
};

const iconMap = {
  dashboard: LayoutDashboard,
  capture: PlusCircle,
  deadlines: ClipboardList,
  calendar: Calendar,
  assistant: Sparkles,
  analytics: BarChart3,
  settings: Settings,
};

export default function Sidebar({
  activeSection,
  onNavigate,
  sections,
}: Props) {
  return (
    <>
      <aside className="hidden md:block sticky top-0 h-screen w-[250px] shrink-0 border-r border-zinc-800 bg-[#09090B] p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 p-2">
            <Rocket className="h-5 w-5 text-white" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">DeadlinePilot AI</h1>
            <p className="text-xs text-zinc-500">AI Productivity Operating System</p>
          </div>
        </div>

        <nav className="mt-10 space-y-3" aria-label="Primary navigation">
          {sections.map((section) => {
            const Icon = iconMap[section.id as keyof typeof iconMap] || LayoutDashboard;
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                aria-current={active ? "location" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  active
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-gray-300 hover:border-violet-600/30 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <nav
        className="sticky top-0 z-20 border-b border-zinc-800 bg-[#0B0B12] px-4 py-3 md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex gap-6 overflow-x-auto">
          {sections.map((section) => {
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                aria-current={active ? "location" : undefined}
                className={`shrink-0 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  active ? "bg-purple-600 text-white" : "bg-zinc-900 text-gray-300"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

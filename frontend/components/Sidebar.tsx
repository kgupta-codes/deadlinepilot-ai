"use client";

import {
  BarChart3,
  Brain,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Workflow,
  Zap,
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
  planner: Workflow,
  "today-plan": ClipboardList,
  analytics: BarChart3,
  deadlines: Calendar,
  "ai-coach": Brain,
  settings: Settings,
  integrations: Zap,
  calendar: Calendar,
};

export default function Sidebar({
  activeSection,
  onNavigate,
  sections,
}: Props) {
  return (
    <>
      <aside className="hidden md:block sticky top-0 h-screen w-72 shrink-0 bg-[#09090B] border-r border-zinc-800 p-6">
        <h1 className="text-2xl font-bold text-purple-500">
          DeadlinePilot AI
        </h1>

        <nav className="mt-10 space-y-2" aria-label="Primary navigation">
          {sections.map((section) => {
            const Icon =
              iconMap[section.id as keyof typeof iconMap] || LayoutDashboard;
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                aria-current={active ? "location" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  active
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-zinc-900 hover:text-white"
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
        className="md:hidden sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3"
        aria-label="Mobile navigation"
      >
        <div className="flex gap-2 overflow-x-auto">
          {sections.map((section) => {
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                aria-current={active ? "location" : undefined}
                className={`shrink-0 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  active
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-900 text-gray-300"
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

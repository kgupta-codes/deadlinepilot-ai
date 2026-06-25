"use client";

import { useEffect, useState } from "react";

import { NavSection } from "@/components/Sidebar";

export const navSections: NavSection[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "planner", label: "Planner" },
  { id: "today-plan", label: "Today's Plan" },
  { id: "analytics", label: "Analytics" },
  { id: "deadlines", label: "Deadlines" },
  { id: "ai-coach", label: "AI Coach" },
  { id: "settings", label: "Settings" },
  { id: "integrations", label: "Integrations" },
  { id: "calendar", label: "Calendar" },
];

export const useSidebar = (enabled: boolean) => {
  const [activeSection, setActiveSection] = useState(navSections[0].id);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    navSections.forEach((section) => {
      const element = document.getElementById(section.id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [enabled]);

  const navigate = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSection(sectionId);
  };

  return {
    activeSection,
    navigate,
    sections: navSections,
  };
};

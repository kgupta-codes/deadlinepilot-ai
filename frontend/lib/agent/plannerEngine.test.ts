import { describe, expect, it } from "vitest";

import { generateAgenticDayPlan } from "./plannerEngine";

describe("deterministic recommended sessions", () => {
  it("splits work into capacity-aware sessions before the deadline", () => {
    const plan = generateAgenticDayPlan(
      [
        {
          id: "mechanics",
          title: "Engineering Mechanics Assignment",
          dueDate: "2026-09-04",
          priority: "High",
          status: "Not Started",
          estimatedHours: 5,
        },
      ],
      [],
      new Date("2026-09-01T08:00:00.000Z")
    );

    expect(plan.planFeasible).toBe(true);
    expect(plan.recommendedSessions).toHaveLength(4);
    expect(plan.recommendedSessions.reduce((total, session) => total + session.hours, 0)).toBe(5);
    expect(plan.recommendedSessions.every((session) => session.hours <= 1.5)).toBe(true);
  });

  it("reports an impossible plan instead of overscheduling capacity", () => {
    const plan = generateAgenticDayPlan(
      [
        {
          id: "urgent",
          title: "Urgent assignment",
          dueDate: "2026-09-01",
          dueTime: "10:00",
          priority: "High",
          status: "Not Started",
          estimatedHours: 5,
        },
      ],
      [],
      new Date("2026-09-01T09:30:00.000Z")
    );

    expect(plan.planFeasible).toBe(false);
    expect(plan.recommendedSessions.reduce((total, session) => total + session.hours, 0)).toBeLessThan(5);
  });
});

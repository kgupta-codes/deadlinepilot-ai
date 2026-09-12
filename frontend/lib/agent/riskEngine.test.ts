import { describe, expect, it } from "vitest";

import { calculateRisk } from "./riskEngine";

const task = (overrides: Record<string, unknown> = {}) => ({
  id: "task-1",
  title: "Assignment",
  dueDate: "2026-09-10",
  priority: "Medium",
  status: "Not Started",
  estimatedHours: 3,
  ...overrides,
});

describe("calculateRisk", () => {
  it("marks a comfortable, known-effort deadline as low risk", () => {
    expect(calculateRisk(task(), new Date("2026-09-01T09:00:00Z")).level).toBe("Low");
  });

  it("marks a tight high-priority deadline as critical", () => {
    expect(
      calculateRisk(
        task({ dueDate: "2026-09-02", priority: "High" }),
        new Date("2026-09-01T12:00:00Z")
      ).level
    ).toBe("Critical");
  });

  it("marks overdue work as critical", () => {
    expect(
      calculateRisk(task({ dueDate: "2026-08-31" }), new Date("2026-09-01T09:00:00Z")).level
    ).toBe("Critical");
  });

  it("raises risk when deterministic workload shows a capacity deficit", () => {
    const result = calculateRisk(task(), new Date("2026-09-01T09:00:00Z"), {
      taskId: "task-1",
      requiredEffortHours: 5,
      remainingEffortHours: 5,
      availableCapacityHours: 2,
      capacityDeficitHours: 3,
      deadlineUrgency: "soon",
      academicImportanceScore: 0,
      workloadCollisionScore: 0,
      completionFeasibility: 0.3,
      effortKnown: true,
      uncertaintyFlags: [],
      dailyCapacity: [],
      collision: { competingEffortHours: 0, sharedCapacityHours: 2, collisionRatio: 0, collisionLevel: "none", competingTaskIds: [] },
      overallRiskInputs: { daysRemaining: 1, hoursUntilDeadline: 12, capacityDeficitHours: 3, completionFeasibility: 0.3, collisionLevel: "none", effortKnown: true, academicImportanceScore: 0 },
      recommendedNextAction: "Start now.",
    });

    expect(result.level).toBe("Critical");
  });
});

import { describe, expect, it } from "vitest";

import type { PlannerPriorityScore, WorkloadAnalysis } from "./types";
import {
  getDeadlineRiskPresentation,
  getRankedWorkloadPresentations,
  getWorkloadTaskPresentation,
} from "./workloadPresentation";

const baseWorkload: WorkloadAnalysis = {
  taskId: "task-1",
  requiredEffortHours: 4,
  remainingEffortHours: 4,
  availableCapacityHours: 2.5,
  capacityDeficitHours: 1.5,
  deadlineUrgency: "urgent",
  academicImportanceScore: 12,
  workloadCollisionScore: 7,
  completionFeasibility: 0.63,
  effortKnown: true,
  uncertaintyFlags: [],
  dailyCapacity: [],
  collision: {
    competingEffortHours: 3,
    sharedCapacityHours: 2.5,
    collisionRatio: 1.2,
    collisionLevel: "critical",
    competingTaskIds: ["task-2"],
  },
  overallRiskInputs: {
    daysRemaining: 1,
    hoursUntilDeadline: 24,
    capacityDeficitHours: 1.5,
    completionFeasibility: 0.63,
    collisionLevel: "critical",
    effortKnown: true,
    academicImportanceScore: 12,
  },
  recommendedNextAction: "Split this task across multiple sessions.",
};

const makeScore = (
  id: string,
  overrides: Partial<PlannerPriorityScore> = {},
  workloadOverrides: Partial<WorkloadAnalysis> = {}
): PlannerPriorityScore => {
  const workload = {
    ...baseWorkload,
    ...workloadOverrides,
    taskId: id,
    collision: {
      ...baseWorkload.collision,
      ...workloadOverrides.collision,
    },
    overallRiskInputs: {
      ...baseWorkload.overallRiskInputs,
      ...workloadOverrides.overallRiskInputs,
    },
  } satisfies WorkloadAnalysis;

  return {
    task: {
      id,
      title: `Task ${id}`,
      dueDate: "2026-09-02",
      priority: "High",
      status: "Not Started",
      estimatedHours: workload.effortKnown ? workload.remainingEffortHours : null,
    },
    score: 92,
    reasons: [
      "Deadline proximity contributes 26 points.",
      "1.5h capacity deficit before the deadline.",
    ],
    workloadHours: workload.remainingEffortHours,
    workload,
    daysRemaining: 1,
    riskLevel: "High",
    conflictPenalty: 0,
    ...overrides,
  };
};

describe("workload presentation mapping", () => {
  it("displays high-risk task risk and deficit from planner data", () => {
    const presentation = getWorkloadTaskPresentation(makeScore("task-1"));

    expect(presentation.riskLabel).toBe("HIGH");
    expect(presentation.capacity.remaining).toBe("4h remaining");
    expect(presentation.capacity.available).toBe("2.5h available");
    expect(presentation.capacity.deficit).toBe("1.5h deficit");
    expect(presentation.capacity.showDeficit).toBe(true);
  });

  it("displays on-track capacity without a deficit", () => {
    const presentation = getWorkloadTaskPresentation(
      makeScore(
        "task-1",
        { riskLevel: "Low" },
        {
          availableCapacityHours: 7,
          capacityDeficitHours: 0,
          completionFeasibility: 1,
        }
      )
    );

    expect(presentation.capacity.remaining).toBe("4h remaining");
    expect(presentation.capacity.available).toBe("7h available");
    expect(presentation.capacity.summary).toBe("On track");
    expect(presentation.feasibilityLabel).toBe("Comfortably feasible");
  });

  it("does not display fake capacity when effort is unknown", () => {
    const presentation = getWorkloadTaskPresentation(
      makeScore(
        "task-1",
        {},
        {
          effortKnown: false,
          remainingEffortHours: 4,
          availableCapacityHours: 7,
          capacityDeficitHours: 0,
          recommendedNextAction: "Resolve estimated effort.",
        }
      )
    );

    expect(presentation.capacity.remaining).toBe("Effort estimate needed");
    expect(presentation.capacity.available).toBe(
      "Capacity cannot be reliably calculated"
    );
    expect(presentation.capacity.deficit).toBe("Add an effort estimate");
    expect(presentation.recommendedNextAction).toBe("Resolve estimated effort.");
  });

  it("shows completed tasks without active risk messaging", () => {
    const risk = getDeadlineRiskPresentation(
      [makeScore("task-1", { riskLevel: "Critical" })],
      "task-1",
      "Completed"
    );

    expect(risk).toEqual({
      riskLevel: "Completed",
      riskLabel: "COMPLETED",
      capacitySummary: "0h remaining",
    });
  });

  it("keeps top-ranked reasons from planner data", () => {
    const presentation = getWorkloadTaskPresentation(
      makeScore("task-1", {
        reasons: [
          "Due within 24 hours.",
          "Capacity deficit is 1.5h.",
          "Academic importance contributes 12 points.",
        ],
      })
    );

    expect(presentation.reasons).toEqual([
      "Due within 24 hours.",
      "Capacity deficit is 1.5h.",
      "Academic importance contributes 12 points.",
    ]);
  });

  it("uses recommended action from planner workload data", () => {
    const presentation = getWorkloadTaskPresentation(
      makeScore("task-1", {}, { recommendedNextAction: "Start this task now." })
    );

    expect(presentation.recommendedNextAction).toBe("Start this task now.");
  });

  it("preserves multiple ranked tasks in planner ranking order", () => {
    const presentations = getRankedWorkloadPresentations([
      makeScore("task-1", { score: 95 }),
      makeScore("task-2", { score: 88 }),
      makeScore("task-3", { score: 70 }),
    ]);

    expect(presentations.map((item) => item.taskId)).toEqual([
      "task-1",
      "task-2",
      "task-3",
    ]);
  });
});

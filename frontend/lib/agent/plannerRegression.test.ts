import { describe, expect, it } from "vitest";

import { generateAgenticDayPlan, prioritizeTasks } from ".";

describe("planner regression with expanded deadline fields", () => {
  it("keeps planner functions working with extended deadline objects", () => {
    const tasks = [
      {
        id: "deadline-1",
        title: "Submit Physics Lab",
        dueDate: "2026-09-04",
        priority: "High",
        status: "Not Started",
        estimatedHours: 3,
        dueTime: "17:00",
        timezone: "UTC",
        academicType: "lab",
        courseCode: "PHY101",
        courseName: "Physics",
        weightPercent: 15,
        submissionMode: "lms",
      },
    ];

    expect(prioritizeTasks(tasks, new Date("2026-09-01T00:00:00.000Z"))[0]?.id).toBe(
      "deadline-1"
    );
    const plan = generateAgenticDayPlan(
      tasks,
      [],
      new Date("2026-09-01T00:00:00.000Z")
    );
    const topRankedTask = plan.priorityRanking[0];

    expect(plan.decisionLog.length).toBeGreaterThan(0);
    expect(topRankedTask?.workload.taskId).toBe("deadline-1");
    expect(topRankedTask?.workload.remainingEffortHours).toBe(3);
    expect(topRankedTask?.workload.effortKnown).toBe(true);
    expect(topRankedTask?.workload.academicImportanceScore).toBe(12);
    expect(topRankedTask?.workload.availableCapacityHours).toBeGreaterThan(0);
    expect(topRankedTask?.reasons).not.toContain(
      "No workload analysis was available."
    );
  });
});

import "server-only";

import { z } from "zod";

import { ApiError } from "./auth";
import { getAdminDb } from "./firebaseAdmin";

const sessionSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
    taskId: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hours: z.number().finite().positive().max(12),
    kind: z.literal("work"),
  })
  .strict();

export const acceptedPlanSchema = z
  .object({
    planKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sessions: z.array(sessionSchema).min(1).max(100),
  })
  .strict();

export type AcceptedPlanInput = z.infer<typeof acceptedPlanSchema>;

export const acceptPlanForUser = async (
  input: AcceptedPlanInput,
  userId: string
) => {
  const db = getAdminDb();
  const reference = db.collection("acceptedPlans").doc(`${userId}_${input.planKey}`);
  const taskIds = [...new Set(input.sessions.map((session) => session.taskId))];

  await db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all(
      taskIds.map((taskId) => transaction.get(db.collection("deadlines").doc(taskId)))
    );

    if (snapshots.some((snapshot) => !snapshot.exists || snapshot.data()?.userId !== userId)) {
      throw new ApiError(403, "A plan session references a deadline you do not own.");
    }

    transaction.set(
      reference,
      {
        userId,
        planKey: input.planKey,
        sessions: input.sessions,
        acceptedAt: new Date().toISOString(),
        version: 1,
      },
      { merge: false }
    );
  });

  return { id: reference.id, planKey: input.planKey, sessions: input.sessions };
};

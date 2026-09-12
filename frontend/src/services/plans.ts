import type { PlannerRecommendedSession } from "@/lib/agent";

import { authenticatedDeadlineFetch } from "./deadlines";

export const acceptPlan = async ({
  planKey,
  sessions,
}: {
  planKey: string;
  sessions: PlannerRecommendedSession[];
}) => {
  const response = await authenticatedDeadlineFetch("/api/plans", {
    method: "POST",
    body: JSON.stringify({
      planKey,
      sessions: sessions.map(({ id, taskId, title, date, hours, kind }) => ({
        id,
        taskId,
        title,
        date,
        hours,
        kind,
      })),
    }),
  });
  const data = (await response.json().catch(() => null)) as {
    message?: string;
    success?: boolean;
  } | null;

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Could not save the recommended plan.");
  }
};

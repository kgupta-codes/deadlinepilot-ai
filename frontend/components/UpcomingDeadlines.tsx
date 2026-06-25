import {
  formatDaysLeft,
  getDaysRemaining,
  sortByAgentPriority,
} from "@/lib/agent";

type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;

  estimatedHours?: number;
};

type Props = {
  deadlines: Deadline[];
};

export default function UpcomingDeadlines({
  deadlines,
}: Props) {
  const upcoming = sortByAgentPriority(
    deadlines.filter(
      (deadline) =>
        deadline.status !== "Completed" &&
        getDaysRemaining(deadline.dueDate) >= 0
    )
  )
    .slice(0, 5);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4">
        Upcoming Deadlines
      </h3>

      <div className="space-y-4">
        {upcoming.length > 0 ? (
          upcoming.map((d) => {
            const daysRemaining = getDaysRemaining(d.dueDate);

            return (
              <div
                key={d.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <div>
                  <p className="font-medium">
                    {d.title}
                  </p>

                  <p className="text-sm text-gray-400">
                    {d.dueDate}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatDaysLeft(daysRemaining)}
                  </p>
                </div>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    d.priority === "High"
                      ? "bg-red-500/20 text-red-400"
                      : d.priority === "Medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {d.priority}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-400">
            No upcoming deadlines.
          </p>
        )}
      </div>
    </div>
  );
}

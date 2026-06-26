"use client";

import { Dispatch, SetStateAction } from "react";

import EmptyState from "@/components/dashboard/EmptyState";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import type { DeadlineFiltersState } from "@/hooks/useDeadlines";
import {
  formatDaysRemaining,
  formatDueDate,
  getDaysRemaining,
} from "@/lib/agent";
import { Deadline } from "@/src/services/deadlines";

type Props = {
  deadlines: Deadline[];
  filters: DeadlineFiltersState;
  filteredDeadlines: Deadline[];
  onDelete: (id: string) => void;
  onStartEditing: (deadline: Deadline) => void;
  setFilters: Dispatch<SetStateAction<DeadlineFiltersState>>;
};

const priorityClass = (priority: string) => {
  if (priority === "High") return "bg-red-600 text-white";
  if (priority === "Medium") return "bg-yellow-500 text-black";
  return "bg-green-600 text-white";
};

const urgencyClass = (daysLeft: number, status: string) => {
  if (status === "Completed") return "text-green-400";
  if (daysLeft < 0) return "text-red-400";
  if (daysLeft === 0) return "text-orange-300";
  return "text-blue-300";
};

export default function DeadlineWorkspace({
  deadlines,
  filters,
  filteredDeadlines,
  onDelete,
  onStartEditing,
  setFilters,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-purple-400">
            Deadline Workspace
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Search, filter, edit, and delete deadlines. The deterministic planner
            reads from the same Firestore records.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-xl font-semibold text-white">My Deadlines</h4>
          <p className="text-sm text-gray-400">
            {filteredDeadlines.length} visible / {deadlines.length} total
          </p>
        </div>

        <DeadlineFilters filters={filters} setFilters={setFilters} />

        <div className="mt-5 space-y-4">
          {deadlines.length === 0 ? (
            <EmptyState message="No deadlines yet. Capture one to start the planning flow." />
          ) : filteredDeadlines.length === 0 ? (
            <EmptyState message="No deadlines match the current filters." />
          ) : (
            filteredDeadlines.map((deadline) => {
              const daysLeft = getDaysRemaining(deadline.dueDate);

              return (
                <div
                  key={deadline.id}
                  className="rounded-xl border border-gray-700 bg-zinc-900 p-4 transition-all hover:border-purple-500"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h5 className="text-lg font-bold text-white">{deadline.title}</h5>
                      <p className="text-sm text-gray-400">
                        {formatDueDate(deadline.dueDate)}
                      </p>
                    </div>

                    <p
                      className={`inline-flex rounded px-3 py-1 text-sm font-semibold ${priorityClass(
                        deadline.priority
                      )}`}
                    >
                      {deadline.priority}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-600 px-3 py-1 text-sm text-white">
                      {deadline.status}
                    </span>

                    <span
                      className={`text-sm font-semibold ${urgencyClass(
                        daysLeft,
                        deadline.status
                      )}`}
                    >
                      {deadline.status === "Completed"
                        ? "Completed"
                        : formatDaysRemaining(daysLeft)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {deadline.category ? (
                      <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-zinc-300">
                        {deadline.category}
                      </span>
                    ) : null}
                    {deadline.estimatedHours != null ? (
                      <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-zinc-300">
                        {deadline.estimatedHours}h
                      </span>
                    ) : null}
                    <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-zinc-400">
                      {deadline.origin}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onStartEditing(deadline)}
                      className="rounded bg-blue-600 px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(deadline.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

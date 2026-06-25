"use client";

import { Dispatch, SetStateAction } from "react";

import EmptyState from "@/components/dashboard/EmptyState";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import {
  DeadlineFiltersState,
  DeadlineFormState,
} from "@/hooks/useDeadlines";
import {
  formatDaysRemaining,
  formatDueDate,
  getDaysRemaining,
  Priority,
  Status,
} from "@/lib/agent";
import { Deadline } from "@/src/services/deadlines";

type Props = {
  aiLoading: boolean;
  deadlines: Deadline[];
  filters: DeadlineFiltersState;
  filteredDeadlines: Deadline[];
  form: DeadlineFormState;
  onAnalyze: () => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onStartEditing: (deadline: Deadline) => void;
  resetForm: () => void;
  setFilters: Dispatch<SetStateAction<DeadlineFiltersState>>;
  setForm: Dispatch<SetStateAction<DeadlineFormState>>;
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
  aiLoading,
  deadlines,
  filters,
  filteredDeadlines,
  form,
  onAnalyze,
  onDelete,
  onSave,
  onStartEditing,
  resetForm,
  setFilters,
  setForm,
}: Props) {
  return (
    <section
      id="deadlines"
      className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-purple-400">
            Deadline Workspace
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Create, edit, and filter deadlines. Gemini stays optional; the local
            planner keeps the dashboard useful when quota is exhausted.
          </p>
        </div>

        <button
          onClick={onAnalyze}
          disabled={aiLoading}
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {aiLoading ? "Analyzing..." : "Analyze My Deadlines"}
        </button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h4 className="mb-4 text-xl font-semibold">
            {form.editingId ? "Edit Deadline" : "Add Deadline"}
          </h4>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Assignment Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-700 bg-zinc-900 p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <input
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-700 bg-zinc-900 p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as Priority,
                }))
              }
              className="w-full rounded border border-gray-700 bg-zinc-900 p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as Status,
                }))
              }
              className="w-full rounded border border-gray-700 bg-zinc-900 p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSave}
                className="rounded bg-green-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {form.editingId ? "Update Deadline" : "Save Deadline"}
              </button>

              {form.editingId && (
                <button
                  onClick={resetForm}
                  className="rounded bg-gray-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xl font-semibold">My Deadlines</h4>
            <p className="text-sm text-gray-400">
              {filteredDeadlines.length} visible / {deadlines.length} total
            </p>
          </div>

          <DeadlineFilters filters={filters} setFilters={setFilters} />

          <div className="mt-5 space-y-4">
            {deadlines.length === 0 ? (
              <EmptyState message="No deadlines yet. Add one to start the planning flow." />
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
                        <h5 className="text-lg font-bold">{deadline.title}</h5>
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

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => onStartEditing(deadline)}
                        className="rounded bg-blue-600 px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        Edit
                      </button>

                      <button
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
    </section>
  );
}

"use client";

import { Dispatch, SetStateAction } from "react";

import EmptyState from "@/components/dashboard/EmptyState";
import DeadlineFilters from "@/components/dashboard/DeadlineFilters";
import type {
  DeadlineFiltersState,
  DeadlineFormState,
} from "@/hooks/useDeadlines";
import {
  AgenticDayPlan,
  Priority,
  formatDaysRemaining,
  formatDueDate,
  getDaysRemaining,
  Status,
} from "@/lib/agent";
import { getDeadlineRiskPresentation } from "@/lib/agent/workloadPresentation";
import type { Deadline } from "@/src/services/deadlines";

type Props = {
  deadlines: Deadline[];
  filters: DeadlineFiltersState;
  filteredDeadlines: Deadline[];
  form: DeadlineFormState;
  onCancelEditing: () => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onStartEditing: (deadline: Deadline) => void;
  planner: AgenticDayPlan;
  setFilters: Dispatch<SetStateAction<DeadlineFiltersState>>;
  setForm: Dispatch<SetStateAction<DeadlineFormState>>;
};

const priorities: Priority[] = ["High", "Medium", "Low"];
const statuses: Status[] = ["Not Started", "In Progress", "Completed"];

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

const riskClass = (riskLevel: string) => {
  if (riskLevel === "Critical") return "border-red-500/40 bg-red-500/10 text-red-100";
  if (riskLevel === "High") return "border-orange-500/40 bg-orange-500/10 text-orange-100";
  if (riskLevel === "Medium") return "border-yellow-500/40 bg-yellow-500/10 text-yellow-100";
  if (riskLevel === "Completed") return "border-green-500/40 bg-green-500/10 text-green-100";
  return "border-blue-500/40 bg-blue-500/10 text-blue-100";
};

export default function DeadlineWorkspace({
  deadlines,
  filters,
  filteredDeadlines,
  form,
  onCancelEditing,
  onDelete,
  onSave,
  onStartEditing,
  planner,
  setFilters,
  setForm,
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
          <h4 className="text-xl font-semibold text-white">
            {form.editingId ? "Edit Deadline" : "Add Deadline"}
          </h4>
          {form.editingId ? (
            <button
              type="button"
              onClick={onCancelEditing}
              className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr_auto]">
          <input
            type="text"
            placeholder="Assignment title"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <select
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priority: event.target.value as Priority,
              }))
            }
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {priorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>

          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as Status,
              }))
            }
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onSave}
            className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Save
          </button>
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
              const workloadRisk = getDeadlineRiskPresentation(
                planner.priorityRanking,
                deadline.id,
                deadline.status
              );

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

                    {workloadRisk ? (
                      <span
                        aria-label={`Planner risk ${workloadRisk.riskLabel}`}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${riskClass(
                          workloadRisk.riskLevel
                        )}`}
                      >
                        Risk: {workloadRisk.riskLabel}
                      </span>
                    ) : null}

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

                    {workloadRisk ? (
                      <span className="text-xs text-zinc-400">
                        {workloadRisk.capacitySummary}
                      </span>
                    ) : null}
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

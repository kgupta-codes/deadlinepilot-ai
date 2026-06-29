"use client";

import { ListTodo } from "lucide-react";

import type { CaptureTaskDraft } from "@/hooks/useCapture";
import { Priority } from "@/lib/agent";

type Props = {
  draft: CaptureTaskDraft;
  onCancel: () => void;
  onConfirm: () => void;
  onChange: (patch: Partial<CaptureTaskDraft>) => void;
  saving: boolean;
};

const priorityOptions: Priority[] = ["High", "Medium", "Low"];

export default function CapturePreviewCard({
  draft,
  onCancel,
  onConfirm,
  onChange,
  saving,
}: Props) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Review
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            Extracted task preview
          </h3>
        </div>

        <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
          {draft.source === "mock" ? "Offline parser" : "Provider"} {draft.confidence}%
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm text-zinc-400">Title</span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Due date</span>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => onChange({ dueDate: event.target.value })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Estimated hours</span>
          <input
            type="number"
            min="0"
            step="0.25"
            value={draft.estimatedHours ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              const parsed = value === "" ? null : Number(value);
              onChange({
                estimatedHours:
                  parsed === null || Number.isFinite(parsed) ? parsed : draft.estimatedHours,
              });
            }}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Priority</span>
          <select
            value={draft.priority}
            onChange={(event) =>
              onChange({ priority: event.target.value as Priority })
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Category</span>
          <input
            type="text"
            value={draft.category}
            onChange={(event) => onChange({ category: event.target.value })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm text-zinc-400">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {draft.confidence}%
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Confidence from the offline parser. This is informational and not directly editable.
          </p>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-sm text-zinc-400">Description</span>
        <textarea
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
        />
      </label>

      <label className="mt-4 block">
        <span className="flex items-center gap-2 text-sm text-zinc-400">
          <ListTodo className="h-4 w-4" aria-hidden="true" />
          Subtasks
        </span>
        <textarea
          value={draft.subtasks.join("\n")}
          onChange={(event) =>
            onChange({
              subtasks: event.target.value
                .split("\n")
                .map((subtask) => subtask.trim())
                .filter(Boolean),
            })
          }
          rows={5}
          placeholder={"Review notes\nSolve questions\nFinal revision"}
          className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Confirm and Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-violet-500/30 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

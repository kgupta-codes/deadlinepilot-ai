"use client";

import { AlertTriangle, ListTodo, Trash2 } from "lucide-react";

import type { CaptureTaskDraft } from "@/hooks/useCapture";
import {
  getCaptureDraftSaveBlockReason,
  isReviewRecommended,
} from "@/lib/ai/captureReviewRules";
import { Priority } from "@/lib/agent";

type Props = {
  draft: CaptureTaskDraft;
  onRemove: () => void;
  onConfirm: () => void;
  onChange: (patch: Partial<CaptureTaskDraft>) => void;
  onToggleSelected: () => void;
  saving: boolean;
};

const priorityOptions: Priority[] = ["High", "Medium", "Low"];
const academicTypeOptions: CaptureTaskDraft["academicType"][] = [
  "assignment",
  "exam",
  "quiz",
  "project",
  "presentation",
  "lab",
  "reading",
  "admin",
  "other",
];

export default function CapturePreviewCard({
  draft,
  onRemove,
  onConfirm,
  onChange,
  onToggleSelected,
  saving,
}: Props) {
  const saveBlockReason = getCaptureDraftSaveBlockReason(draft);
  const canMarkReviewed = Boolean(draft.dueDate) && draft.dateAmbiguity === "none";
  const requiresExplicitReview =
    draft.ambiguities.length > 0 || draft.confidence < 70;
  const confidenceTone =
    draft.confidence >= 90
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
      : draft.confidence >= 70
        ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
        : "border-red-500/20 bg-red-500/10 text-red-100";

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

        <div className={`rounded-full border px-3 py-1 text-xs font-medium ${confidenceTone}`}>
          {draft.source === "mock" ? "Offline fallback" : "Gemini"} {draft.confidence}%
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={draft.selected}
            onChange={onToggleSelected}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
          />
          Save selected
        </label>

        {draft.needsReview ? (
          <span className="inline-flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {draft.reviewResolved ? "Review resolved" : "Needs review"}
          </span>
        ) : null}
      </div>

      {draft.reviewReasons.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-medium">Review before saving</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {draft.reviewReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {saveBlockReason ? (
            <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-100">
              Save blocked: {saveBlockReason}
            </p>
          ) : isReviewRecommended(draft.confidence) ? (
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              Review recommended, but saving is allowed.
            </p>
          ) : null}
          {requiresExplicitReview ? (
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.reviewResolved}
                disabled={!canMarkReviewed}
                onChange={(event) =>
                  onChange({ reviewResolved: event.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950"
              />
              <span>
                I reviewed and corrected this draft.
                {!canMarkReviewed ? " Resolve the due date first." : ""}
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

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
            value={draft.dueDate ?? ""}
            onChange={(event) => {
              const dueDate = event.target.value || null;
              const ambiguities = dueDate
                ? draft.ambiguities.filter((item) => item.field !== "dueDate")
                : draft.ambiguities;

              onChange({
                dueDate: event.target.value || null,
                dateAmbiguity: dueDate ? "none" : draft.dateAmbiguity,
                ambiguities,
                needsReview:
                  !dueDate ||
                  draft.confidence < 90 ||
                  ambiguities.length > 0,
                reviewResolved: Boolean(dueDate),
              });
            }}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
          {draft.dueDateText ? (
            <span className="mt-1 block text-xs text-zinc-500">
              Source wording: {draft.dueDateText}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Due time</span>
          <input
            type="time"
            value={draft.dueTime ?? ""}
            onChange={(event) => onChange({ dueTime: event.target.value || null })}
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
          <span className="text-sm text-zinc-400">Course or category</span>
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
            {draft.confidence >= 90
              ? "High-confidence extraction."
              : draft.confidence >= 70
                ? "Review recommended before saving."
                : "Review required before saving."}
          </p>
        </div>

        <label className="block">
          <span className="text-sm text-zinc-400">Academic type</span>
          <select
            value={draft.academicType}
            onChange={(event) =>
              onChange({ academicType: event.target.value as CaptureTaskDraft["academicType"] })
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          >
            {academicTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Weight percent</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={draft.weightPercent ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              const parsed = value === "" ? null : Number(value);
              onChange({
                weightPercent:
                  parsed === null || Number.isFinite(parsed) ? parsed : draft.weightPercent,
              });
            }}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm text-zinc-400">Course code</span>
          <input
            type="text"
            value={draft.courseCode ?? ""}
            onChange={(event) => onChange({ courseCode: event.target.value || null })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Course name</span>
          <input
            type="text"
            value={draft.courseName ?? ""}
            onChange={(event) => onChange({ courseName: event.target.value || null })}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500"
          />
        </label>
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

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
        <p className="font-medium text-white">Effort estimate</p>
        <p className="mt-2 text-zinc-400">
          {draft.estimatedHours == null
            ? "No reliable estimate found."
            : `${draft.estimatedHours}h estimated`}
          {draft.effortRangeLow != null && draft.effortRangeHigh != null
            ? ` · range ${draft.effortRangeLow}-${draft.effortRangeHigh}h`
            : ""}
          {` · ${draft.effortConfidence}% confidence`}
        </p>
        {draft.effortBasis ? (
          <p className="mt-1 text-xs text-zinc-500">{draft.effortBasis}</p>
        ) : null}
      </div>

      {draft.evidence.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">Evidence</p>
          <ul className="mt-2 space-y-2">
            {draft.evidence.slice(0, 3).map((item) => (
              <li key={`${item.field}-${item.quote}`}>
                <span className="text-zinc-500">{item.field}:</span> {item.quote}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving || Boolean(saveBlockReason)}
          className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Confirm and Save"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-violet-500/30 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Remove
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

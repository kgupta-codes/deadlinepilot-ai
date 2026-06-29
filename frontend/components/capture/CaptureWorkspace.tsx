"use client";

import { ArrowRight, FileText, Mic, ScanSearch, Sparkles, Upload } from "lucide-react";

import CapturePreviewCard from "@/components/capture/CapturePreviewCard";
import CaptureSourceTabs from "@/components/capture/CaptureSourceTabs";
import Skeleton from "@/components/ui/Skeleton";
import type { CaptureTaskDraft } from "@/hooks/useCapture";
import type { CaptureMode } from "@/src/services/ai";

type Props = {
  activeMode: CaptureMode;
  draft: CaptureTaskDraft | null;
  errorMessage: string;
  extracting: boolean;
  input: string;
  onCancelDraft: () => void;
  onConfirmDraft: () => void;
  onExtract: () => void;
  onInputChange: (value: string) => void;
  onModeChange: (mode: CaptureMode) => void;
  onReset: () => void;
  onUpdateDraft: (patch: Partial<CaptureTaskDraft>) => void;
  saving: boolean;
  statusMessage: string;
};

const futureSources = [
  { icon: FileText, label: "PDF Import" },
  { icon: ScanSearch, label: "Screenshot Import" },
  { icon: Upload, label: "Gmail Import" },
  { icon: Mic, label: "Voice Capture" },
];

export default function CaptureWorkspace({
  activeMode,
  draft,
  errorMessage,
  extracting,
  input,
  onCancelDraft,
  onConfirmDraft,
  onExtract,
  onInputChange,
  onModeChange,
  onReset,
  onUpdateDraft,
  saving,
  statusMessage,
}: Props) {
  return (
    <div className="rounded-[28px] border border-zinc-800 bg-[linear-gradient(180deg,_rgba(9,9,11,0.98),_rgba(17,17,24,0.96))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Capture Hub
          </div>
          <h3 className="text-2xl font-semibold text-white">
            Capture work in natural language
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            Describe the work the way you would say it to a project manager. The
            offline extractor converts it into a structured task for review before
            anything is saved.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-violet-500/30 hover:bg-zinc-800"
        >
          Reset
        </button>
      </div>

      <div className="mt-6">
        <CaptureSourceTabs activeMode={activeMode} onSelectMode={onModeChange} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Natural language input
              </p>
              <h4 className="mt-1 text-lg font-semibold text-white">
                Tell DeadlinePilot what needs to happen
              </h4>
            </div>

            <button
              type="button"
              onClick={onExtract}
              disabled={extracting || input.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
              aria-busy={extracting}
            >
              {extracting ? "Extracting..." : "Extract task"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <label className="mt-4 block">
            <span className="text-sm text-zinc-400">Natural language task</span>
            <textarea
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              rows={7}
              placeholder='Example: "Finish physics assignment before Friday. Takes about 4 hours."'
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-500"
            />
          </label>

          {statusMessage ? (
            <div
              className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
              role="status"
            >
              {statusMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div
              className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Example inputs
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-300">
                <li>Finish physics assignment before Friday. Takes about 4 hours.</li>
                <li>Complete robotics presentation by next Wednesday.</li>
                <li>Prepare for DSA contest this weekend.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                What happens next
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                The offline extractor returns structured fields, you review the
                preview, and only then does DeadlinePilot write to Firestore.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {extracting && !draft ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-56" />
                </div>
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>

              <Skeleton className="mt-4 h-24 w-full" />
              <Skeleton className="mt-5 h-12 w-40" />
            </div>
          ) : draft ? (
            <CapturePreviewCard
              draft={draft}
              onCancel={onCancelDraft}
              onChange={onUpdateDraft}
              onConfirm={onConfirmDraft}
              saving={saving}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-950/40 p-6 text-sm leading-6 text-zinc-400">
              Extract a task to see the editable preview before it is saved. The
              preview always stays editable before any Firestore write happens.
            </div>
          )}

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-300" aria-hidden="true" />
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                Future capture sources
              </h4>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {futureSources.map((source) => {
                const Icon = source.icon;

                return (
                  <div
                    key={source.label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-zinc-300" aria-hidden="true" />
                      <p className="font-medium text-white">{source.label}</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Coming soon. Designed to plug into the same extraction pipeline.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

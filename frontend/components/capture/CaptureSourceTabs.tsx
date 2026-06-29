"use client";

import { CAPTURE_MODES, type CaptureMode } from "@/src/services/ai";

type Props = {
  activeMode: CaptureMode;
  onSelectMode: (mode: CaptureMode) => void;
};

export default function CaptureSourceTabs({
  activeMode,
  onSelectMode,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {CAPTURE_MODES.map((mode) => {
        const active = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            disabled={!mode.enabled}
            onClick={() => onSelectMode(mode.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${
              active
                ? "border-violet-500/30 bg-violet-500/10 text-white"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-violet-500/20 hover:bg-zinc-900"
            } ${!mode.enabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{mode.label}</span>
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                {mode.enabled ? "Ready" : "Soon"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

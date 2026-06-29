"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import type { ToastItem } from "@/hooks/useToasts";

type Props = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const toneClasses: Record<ToastItem["tone"], string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-50",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-50",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-50",
};

const toneIcons: Record<ToastItem["tone"], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export default function ToastViewport({ onDismiss, toasts }: Props) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {toasts.map((toast) => {
        const Icon = toneIcons[toast.tone];

        return (
          <div
            key={toast.id}
            className={`rounded-2xl border p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur ${toneClasses[toast.tone]}`}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full border border-current/20 p-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-6 opacity-90">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full p-1 text-current/70 transition hover:text-current"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

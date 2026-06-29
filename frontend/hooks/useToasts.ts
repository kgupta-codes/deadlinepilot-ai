"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

export type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
};

const autoDismissMs = 3800;

export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast: ToastItem = {
      id,
      tone: toast.tone ?? "info",
      title: toast.title,
      description: toast.description,
    };

    setToasts((current) => [nextToast, ...current].slice(0, 4));

    const timer = window.setTimeout(() => {
      dismissToast(id);
    }, autoDismissMs);

    timersRef.current.set(id, timer);
  }, [dismissToast]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer);
      }

      timersRef.current.clear();
    },
    []
  );

  return {
    dismissToast,
    pushToast,
    toasts,
  };
};

"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";

import { Priority, prioritizeTasks, Status } from "@/lib/agent";
import {
  addDeadline,
  deleteDeadline,
  type Deadline,
  getDeadlines,
  type DeadlineWriteInput,
  updateDeadline,
} from "@/src/services/deadlines";
import type { ToastInput } from "@/hooks/useToasts";

const defaultPriority: Priority = "Medium";
const defaultStatus: Status = "Not Started";

export type DeadlineFormState = {
  title: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  editingId: string | null;
};

export type DeadlineFiltersState = {
  searchTerm: string;
  priority: Priority | "All";
  status: Status | "All";
};

type NotifyToast = (toast: ToastInput) => void;

export const useDeadlines = (user: User | null, notify?: NotifyToast) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [deadlineMessage, setDeadlineMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<DeadlineFormState>({
    title: "",
    dueDate: "",
    priority: defaultPriority,
    status: defaultStatus,
    editingId: null,
  });
  const [filters, setFilters] = useState<DeadlineFiltersState>({
    searchTerm: "",
    priority: "All",
    status: "All",
  });

  const resetForm = () => {
    setForm({
      title: "",
      dueDate: "",
      priority: defaultPriority,
      status: defaultStatus,
      editingId: null,
    });
  };

  const refreshDeadlines = async (userId: string) => {
    setLoading(true);

    try {
      const updated = await getDeadlines(userId);
      setDeadlines(updated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    getDeadlines(user.uid)
      .then((updated) => {
        if (!cancelled) {
          setDeadlines(updated);
        }
      })
      .catch((error) => {
        console.error(error);

        if (!cancelled) {
          setDeadlineMessage("Could not load deadlines. Try again.");
          notify?.({
            title: "Deadline load failed",
            description: "Could not load deadlines from Firestore.",
            tone: "error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [notify, user]);

  const saveDeadlineRecord = async (
    input: DeadlineWriteInput,
    deadlineId: string | null = null
  ) => {
    if (!user) {
      setDeadlineMessage("Sign in before saving deadlines.");
      return;
    }

    if (!input.title || !input.dueDate) {
      setDeadlineMessage("Add a title and due date before saving.");
      return;
    }

    const snapshot = deadlines;
    const optimisticDeadline: Deadline = {
      id: deadlineId ?? `optimistic-${Date.now()}`,
      title: input.title,
      dueDate: input.dueDate,
      priority: input.priority,
      status: input.status,
      userId: user.uid,
      estimatedHours: input.estimatedHours ?? null,
      category: input.category ?? "",
      description: input.description ?? "",
      subtasks: input.subtasks ?? [],
      notes: input.notes ?? "",
      origin: input.origin ?? "manual",
      aiMetadata: input.aiMetadata ?? null,
    };

    try {
      if (deadlineId) {
        setDeadlines((current) =>
          current.map((deadline) =>
            deadline.id === deadlineId ? { ...deadline, ...optimisticDeadline } : deadline
          )
        );
      } else {
        setDeadlines((current) => [optimisticDeadline, ...current]);
      }

      if (deadlineId) {
        await updateDeadline(deadlineId, user.uid, input);
        setDeadlineMessage("Deadline updated.");
      } else {
        await addDeadline(input, user.uid);
        setDeadlineMessage("Deadline saved to Firestore.");
      }

      await refreshDeadlines(user.uid);
      resetForm();
      notify?.({
        title: deadlineId ? "Deadline updated" : "Deadline saved",
        description: input.title,
        tone: "success",
      });
    } catch (error) {
      console.error(error);
      setDeadlines(snapshot);
      setDeadlineMessage("Could not save the deadline. Try again.");
      notify?.({
        title: "Save failed",
        description: "The deadline could not be written to Firestore.",
        tone: "error",
      });
    }
  };

  const saveDeadline = async () => {
    if (!form.title || !form.dueDate || !user) {
      setDeadlineMessage("Add a title and due date before saving.");
      return;
    }

    const existing = form.editingId
      ? deadlines.find((deadline) => deadline.id === form.editingId)
      : null;

    const mergedInput: DeadlineWriteInput = {
      title: form.title,
      dueDate: form.dueDate,
      priority: form.priority,
      status: form.status,
      estimatedHours: existing?.estimatedHours ?? null,
      category: existing?.category ?? "",
      description: existing?.description ?? "",
      subtasks: existing?.subtasks ?? [],
      notes: existing?.notes ?? "",
      origin: existing?.origin ?? "manual",
      aiMetadata: existing?.aiMetadata ?? null,
    };

    await saveDeadlineRecord(mergedInput, form.editingId);
  };

  const removeDeadline = async (id: string) => {
    if (!user) return;

    const snapshot = deadlines;

    try {
      setDeadlines((current) => current.filter((deadline) => deadline.id !== id));
      await deleteDeadline(id, user.uid);
      await refreshDeadlines(user.uid);
      setDeadlineMessage("Deadline deleted.");
      notify?.({
        title: "Deadline deleted",
        description: "The item was removed from Firestore.",
        tone: "success",
      });
    } catch (error) {
      console.error(error);
      setDeadlines(snapshot);
      setDeadlineMessage("Could not delete the deadline. Try again.");
      notify?.({
        title: "Delete failed",
        description: "The deadline could not be removed.",
        tone: "error",
      });
    }
  };

  const startEditing = (deadline: Deadline) => {
    setForm({
      title: deadline.title,
      dueDate: deadline.dueDate,
      priority: deadline.priority,
      status: deadline.status,
      editingId: deadline.id,
    });
  };

  const clearDeadlines = () => {
    setDeadlines([]);
    resetForm();
    setDeadlineMessage("");
  };

  const filteredDeadlines = useMemo(() => {
    const filtered = deadlines
      .filter((deadline) =>
        deadline.title.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
      .filter((deadline) =>
        filters.priority === "All" ? true : deadline.priority === filters.priority
      )
      .filter((deadline) =>
        filters.status === "All" ? true : deadline.status === filters.status
      );

    return prioritizeTasks(filtered);
  }, [deadlines, filters]);

  return {
    deadlineMessage,
    deadlines: user ? deadlines : [],
    filters,
    filteredDeadlines,
    form,
    removeDeadline,
    resetForm,
    saveDeadline,
    saveDeadlineRecord,
    clearDeadlines,
    loading,
    refreshDeadlines,
    setDeadlineMessage,
    setFilters,
    setForm,
    startEditing,
  };
};

"use client";

import { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";

import { Priority, prioritizeTasks, Status } from "@/lib/agent";
import {
  addDeadline,
  deleteDeadline,
  Deadline,
  getDeadlines,
  DeadlineWriteInput,
  updateDeadline,
} from "@/src/services/deadlines";

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

export const useDeadlines = (user: User | null) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [deadlineMessage, setDeadlineMessage] = useState("");
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
    const updated = await getDeadlines(userId);
    setDeadlines(updated);
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
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

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

    try {
      if (deadlineId) {
        await updateDeadline(deadlineId, user.uid, input);
        setDeadlineMessage("Deadline updated.");
      } else {
        await addDeadline(input, user.uid);
        setDeadlineMessage("Deadline saved to Firestore.");
      }

      await refreshDeadlines(user.uid);
      resetForm();
    } catch (error) {
      console.error(error);
      setDeadlineMessage("Could not save the deadline. Try again.");
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
      notes: existing?.notes ?? "",
      origin: existing?.origin ?? "manual",
      aiMetadata: existing?.aiMetadata ?? null,
    };

    await saveDeadlineRecord(mergedInput, form.editingId);
  };

  const removeDeadline = async (id: string) => {
    if (!user) return;

    try {
      await deleteDeadline(id, user.uid);
      await refreshDeadlines(user.uid);
      setDeadlineMessage("Deadline deleted.");
    } catch (error) {
      console.error(error);
      setDeadlineMessage("Could not delete the deadline. Try again.");
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
    refreshDeadlines,
    setDeadlineMessage,
    setFilters,
    setForm,
    startEditing,
  };
};

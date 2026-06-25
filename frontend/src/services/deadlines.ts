import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  normalizePriority,
  normalizeStatus,
  Priority,
  sortByDueDate,
  Status,
} from "@/lib/agent";
import { db } from "@/src/lib/firebase";

export type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  userId: string;
};

type DeadlineDocument = {
  title?: unknown;
  dueDate?: unknown;
  priority?: unknown;
  status?: unknown;
  userId?: unknown;
};

export const addDeadline = async (
  title: string,
  dueDate: string,
  userId: string,
  priority: Priority,
  status: Status
) => {
  return await addDoc(collection(db, "deadlines"), {
    title,
    dueDate,
    userId,
    priority,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getDeadlines = async (userId: string): Promise<Deadline[]> => {
  const q = query(collection(db, "deadlines"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const deadlines: Deadline[] = snapshot.docs.map((item) => {
    const data = item.data() as DeadlineDocument;

    return {
      id: item.id,
      title: typeof data.title === "string" ? data.title : "",
      dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
      priority: normalizePriority(data.priority),
      status: normalizeStatus(data.status),
      userId: typeof data.userId === "string" ? data.userId : userId,
    };
  });

  return sortByDueDate(deadlines);
};

const assertDeadlineOwner = async (id: string, userId: string) => {
  const reference = doc(db, "deadlines", id);
  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    throw new Error("Deadline not found.");
  }

  const data = snapshot.data() as DeadlineDocument;

  if (data.userId !== userId) {
    throw new Error("Deadline does not belong to the current user.");
  }

  return reference;
};

export const deleteDeadline = async (id: string, userId: string) => {
  const reference = await assertDeadlineOwner(id, userId);
  await deleteDoc(reference);
};

export const updateDeadline = async (
  id: string,
  userId: string,
  title: string,
  dueDate: string,
  priority: Priority,
  status: Status
) => {
  const reference = await assertDeadlineOwner(id, userId);

  await updateDoc(reference, {
    title,
    dueDate,
    priority,
    status,
    updatedAt: serverTimestamp(),
  });
};

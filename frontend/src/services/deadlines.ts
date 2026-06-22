import {
collection,
addDoc,
getDocs,
query,
where,
deleteDoc,
doc,
updateDoc,
} from "firebase/firestore";

import { db } from "@/src/lib/firebase";

export const addDeadline = async (
  title: string,
  dueDate: string,
  userId: string,
  priority: string
) => {
  return await addDoc(collection(db, "deadlines"), {
    title,
    dueDate,
    userId,
    priority,
    createdAt: new Date(),
  });
};

export const getDeadlines = async (
  userId: string
) => {
  const q = query(
    collection(db, "deadlines"),
    where("userId", "==", userId)
  );

const snapshot = await getDocs(q);

const deadlines = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

return deadlines.sort(
  (a: any, b: any) =>
    new Date(a.dueDate).getTime() -
    new Date(b.dueDate).getTime()
);
};

export const deleteDeadline = async (
  id: string
) => {
  await deleteDoc(
    doc(db, "deadlines", id)
  );
};
export const updateDeadline = async (
id: string,
title: string,
dueDate: string,
priority: string
) => {
await updateDoc(
doc(db, "deadlines", id),
{
title,
dueDate,
priority,
}
);
};


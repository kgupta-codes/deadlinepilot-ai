import { collection, addDoc, getDocs } from "firebase/firestore";
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
  });
};

export const getDeadlines = async () => {
  const snapshot = await getDocs(collection(db, "deadlines"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

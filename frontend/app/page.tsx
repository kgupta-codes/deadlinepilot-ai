"use client";

import { useState, useEffect } from "react";
import { signInWithGoogle } from "../src/services/auth";
import { addDeadline, getDeadlines } from "../src/services/deadlines";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [deadlines, setDeadlines] = useState<any[]>([]);

  const handleLogin = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);

      const data = await getDeadlines();
      setDeadlines(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddDeadline = async () => {
    if (!title || !dueDate) return;

    await addDeadline(
      title,
      dueDate,
      user.uid,
      priority
    );

    const updated = await getDeadlines();
    setDeadlines(updated);

    setTitle("");
    setDueDate("");
    setPriority("Medium");
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-6">
        DeadlinePilot AI
      </h1>

      {!user ? (
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <img
              src={user.photoURL}
              alt="profile"
              className="w-20 h-20 rounded-full mx-auto"
            />
            <h2 className="mt-4 text-xl">
              {user.displayName}
            </h2>
            <p>{user.email}</p>
          </div>

          <div className="border p-4 rounded-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Add Deadline
            </h3>

            <input
              type="text"
              placeholder="Assignment Title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="border p-2 w-full mb-3 text-black"
            />

            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
              className="border p-2 w-full mb-3 text-black"
            />

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
              className="border p-2 w-full mb-3 text-black"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <button
              onClick={handleAddDeadline}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Deadline
            </button>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">
              Deadlines
            </h3>

            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="border p-3 rounded mb-3"
              >
                <h4 className="font-bold">
                  {deadline.title}
                </h4>

                <p>
                  Due: {deadline.dueDate}
                </p>

                <p>
                  Priority: {deadline.priority}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

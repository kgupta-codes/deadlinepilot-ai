"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../src/lib/firebase";
import {
  signInWithGoogle,
  logout,
} from "../src/services/auth";
import {
  addDeadline,
  getDeadlines,
  deleteDeadline,
} from "../src/services/deadlines";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [searchTerm, setSearchTerm] = useState("");
 const [filterPriority, setFilterPriority] =
useState("All");

const [deadlines, setDeadlines] = useState<any[]>([]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);

          const data = await getDeadlines(
            currentUser.uid
          );

          setDeadlines(data);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const loggedInUser = await signInWithGoogle();

      setUser(loggedInUser);

      const data = await getDeadlines(
        loggedInUser.uid
      );

      setDeadlines(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeadline = async () => {
    if (!title || !dueDate || !user) return;

    await addDeadline(
      title,
      dueDate,
      user.uid,
      priority
    );

    const updated = await getDeadlines(
      user.uid
    );

    setDeadlines(updated);

    setTitle("");
    setDueDate("");
    setPriority("Medium");
  };

  const handleDelete = async (
    id: string
  ) => {
    await deleteDeadline(id);

    const updated = await getDeadlines(
      user.uid
    );

    setDeadlines(updated);
  };
const handleLogout = async () => {
  await logout();

  setUser(null);
  setDeadlines([]);
};

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-6">
        DeadlinePilot AI
      </h1>

      {!user ? (
        <button
          disabled={loading}
          onClick={handleLogin}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          {loading
            ? "Signing In..."
            : "Sign in with Google"}
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
<button
  onClick={handleLogout}
  className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
>
  Logout
</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">

  <div className="border p-4 rounded-lg text-center">
    <h2 className="text-2xl font-bold">
      {deadlines.length}
    </h2>
    <p>Total</p>
  </div>

  <div className="border p-4 rounded-lg text-center">
    <h2 className="text-2xl font-bold">
      {
        deadlines.filter(
          (d) => d.priority === "High"
        ).length
      }
    </h2>
    <p>High Priority</p>
  </div>

  <div className="border p-4 rounded-lg text-center">
    <h2 className="text-2xl font-bold">
      {
        deadlines.filter((d) => {
          const days =
            (new Date(d.dueDate).getTime() -
              Date.now()) /
            (1000 * 60 * 60 * 24);

          return days <= 7;
        }).length
      }
    </h2>
    <p>Due This Week</p>
  </div>

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
              My Deadlines
            </h3>
<input
  type="text"
  placeholder="Search deadlines..."
  value={searchTerm}
  onChange={(e) =>
    setSearchTerm(e.target.value)
  }
  className="border p-2 w-full mb-4 text-black rounded"
 />
<select
value={filterPriority}
onChange={(e) =>
setFilterPriority(e.target.value)
}
className="border p-2 w-full mb-4 text-black rounded"

>

  <option>All</option>
  <option>High</option>
  <option>Medium</option>
  <option>Low</option>
</select>


            {deadlines.length === 0 ? (
              <p>No deadlines yet.</p>
            ) : (
[...deadlines]
.filter((deadline) =>
deadline.title
.toLowerCase()
.includes(
searchTerm.toLowerCase()
)
)
.filter((deadline) =>
filterPriority === "All"
? true
: deadline.priority ===
filterPriority
)
.sort(
(a, b) =>
new Date(a.dueDate).getTime() -
new Date(b.dueDate).getTime()
)
.map((deadline) => (
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
<div className="mt-2">
  {deadline.priority === "High" && (
    <span className="bg-red-600 px-3 py-1 rounded text-white text-sm">
      🔴 High
    </span>
  )}

  {deadline.priority === "Medium" && (
    <span className="bg-yellow-500 px-3 py-1 rounded text-black text-sm">
      🟡 Medium
    </span>
  )}

  {deadline.priority === "Low" && (
    <span className="bg-green-600 px-3 py-1 rounded text-white text-sm">
      🟢 Low
    </span>
  )}
</div>
<p className="font-semibold mt-2">
  {(() => {
    const daysLeft = Math.ceil(
      (new Date(deadline.dueDate).getTime() -
        Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return (
        <span className="text-red-500 font-bold">
          🚨 OVERDUE
        </span>
      );
    }

    if (daysLeft === 0) {
      return (
        <span className="text-orange-400 font-bold">
          🔥 Due Today
        </span>
      );
    }

    if (daysLeft <= 3) {
      return (
        <span className="text-yellow-400 font-bold">
          ⚠️ {daysLeft} Day
          {daysLeft > 1 ? "s" : ""} Left
        </span>
      );
    }

    return (
      <span className="text-blue-400 font-bold">
        📅 {daysLeft} Days Left
      </span>
    );
  })()}
</p>

                  <button
                    onClick={() =>
                      handleDelete(deadline.id)
                    }
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}

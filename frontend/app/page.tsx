"use client";

import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import AICoach from "@/components/AICoach";
import TodayPlan from "@/components/TodayPlan";
import HabitTracker from "@/components/HabitTracker";
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
updateDeadline,
} from "../src/services/deadlines";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] =
  useState("Not Started");

  const [searchTerm, setSearchTerm] = useState("");
 const [filterPriority, setFilterPriority] =
useState("All");
const [filterStatus, setFilterStatus] =
  useState("All");

const [aiInsight, setAiInsight] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [deadlines, setDeadlines] = useState<any[]>([]);
const [editingId, setEditingId] =
useState<string | null>(null);

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

if (editingId) {
await updateDeadline(
  editingId,
  title,
  dueDate,
  priority,
  status
);

setEditingId(null);
} else {
await addDeadline(
  title,
  dueDate,
  user.uid,
  priority,
  status
);
}

    const updated = await getDeadlines(
      user.uid
    );

    setDeadlines(updated);

    setTitle("");
    setDueDate("");
    setPriority("Medium");
    setStatus("Not Started");
setEditingId(null);

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
const handleAnalyze = async () => {
  setAiLoading(true);

  try {
    const response = await fetch(
      "/api/analyze",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          deadlines,
        }),
      }
    );

    const data = await response.json();

    setAiInsight(data.insight);
  } catch {
    setAiInsight(
      "Unable to generate AI insights."
    );
  }

  setAiLoading(false);
};
const completedCount = deadlines.filter(
  (d) => d.status === "Completed"
).length;

const progress =
  deadlines.length === 0
    ? 0
    : Math.round(
        (completedCount / deadlines.length) * 100
      );
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
<div className="flex min-h-screen bg-black text-white">
  <Sidebar />

<div className="flex-1 p-8">
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
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
  <div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
    <h2 className="text-3xl font-bold">
      {deadlines.length}
    </h2>
    <p className="text-gray-400">
      Total
    </p>
  </div>

  <div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
    <h2 className="text-3xl font-bold text-red-400">
      {
        deadlines.filter(
          (d) => d.priority === "High"
        ).length
      }
    </h2>
    <p className="text-gray-400">
      High Priority
    </p>
  </div>

  <div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
    <h2 className="text-3xl font-bold text-yellow-400">
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
    <p className="text-gray-400">
      Due This Week
    </p>
  </div>

  <div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
    <h2 className="text-3xl font-bold text-green-400">
      {
        deadlines.filter(
          (d) => d.status === "Completed"
        ).length
      }
    </h2>
    <p className="text-gray-400">
      Completed
    </p>
  </div>

  <div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
    <h2 className="text-3xl font-bold text-blue-400">
      {
        deadlines.filter(
          (d) => d.status === "In Progress"
        ).length
      }
    </h2>
    <p className="text-gray-400">
      In Progress
    </p>
  </div>
<div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
  <h2 className="text-3xl font-bold text-red-500">
    {
      deadlines.filter(
        (d) =>
          new Date(d.dueDate).getTime() <
          Date.now()
      ).length
    }
  </h2>

  <p className="text-gray-400">
    Overdue
  </p>
</div>
<div className="border border-gray-700 p-4 rounded-xl text-center bg-zinc-900">
  <h2 className="text-3xl font-bold text-purple-400">
    {progress}%
  </h2>

  <p className="text-gray-400">
    Progress
  </p>

  <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">
    <div
      className="bg-purple-500 h-2 rounded-full"
      style={{
        width: `${progress}%`,
      }}
    />
  </div>
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
className="border border-gray-700 bg-zinc-900 text-white p-2 w-full mb-3 rounded"
            />

            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
className="border border-gray-700 bg-zinc-900 text-white p-2 w-full mb-3 rounded"
            />

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
className="border border-gray-700 bg-zinc-900 text-white p-2 w-full mb-3 rounded"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
<select
value={status}
onChange={(e) =>
setStatus(e.target.value)
}
className="border border-gray-700 bg-zinc-900 text-white p-2 w-full mb-3 rounded"

>

  <option>Not Started</option>
  <option>In Progress</option>
  <option>Completed</option>
</select>


<button
onClick={handleAddDeadline}
className="bg-green-600 text-white px-4 py-2 rounded"

>

{editingId
? "Update Deadline"
: "Save Deadline"} </button>
{editingId && (
  <button
    onClick={() => {
      setEditingId(null);
      setTitle("");
      setDueDate("");
      setPriority("Medium");
      setStatus("Not Started");
    }}
    className="ml-2 bg-gray-600 text-white px-4 py-2 rounded"
  >
    Cancel
  </button>
)}

          </div>

          <div>
<div className="mb-6">
  <button
    onClick={handleAnalyze}
    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-semibold"
  >
    {aiLoading
      ? "Analyzing..."
      : "✨ Analyze My Deadlines"}
  </button>
</div>

{aiInsight && (
  <div className="mb-6 border border-purple-500 bg-zinc-900 p-4 rounded-xl">
    <h3 className="font-bold text-purple-400 mb-2">
      AI Productivity Coach
    </h3>

    <pre className="whitespace-pre-wrap text-sm">
      {aiInsight}
    </pre>
  </div>
)}            
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
  value={filterStatus}
  onChange={(e) =>
    setFilterStatus(e.target.value)
  }
  className="border border-gray-700 bg-zinc-900 p-2 rounded-lg w-full mb-4"
>
  <option value="All">
    All Status
  </option>

  <option value="Not Started">
    Not Started
  </option>

  <option value="In Progress">
    In Progress
  </option>

  <option value="Completed">
    Completed
  </option>
</select>
<select
value={filterPriority}
onChange={(e) =>
setFilterPriority(e.target.value)
}
className="border p-2 w-full mb-4 text-black rounded"

>

<option value="All">
  All Priority
</option>

<option value="High">
  🔴 High
</option>

<option value="Medium">
  🟡 Medium
</option>

<option value="Low">
  🟢 Low
</option>
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
.filter((deadline) =>
  filterStatus === "All"
    ? true
    : deadline.status === filterStatus
)
.sort(
(a, b) =>
new Date(a.dueDate).getTime() -
new Date(b.dueDate).getTime()
)
.map((deadline) => (
                <div
                  key={deadline.id}
className="border border-gray-700 bg-zinc-900 p-4 rounded-xl mb-4 hover:border-blue-500 transition-all"
                >
                  <h4 className="font-bold">
                    {deadline.title}
                  </h4>

                  <p>
                    Due: {deadline.dueDate}
                  </p>
<div className="mt-2">

{deadline.status === "Not Started" && ( <span className="bg-gray-600 px-3 py-1 rounded text-white text-sm">
📌 Not Started </span>
)}

{deadline.status === "In Progress" && ( <span className="bg-blue-600 px-3 py-1 rounded text-white text-sm">
🚧 In Progress </span>
)}

{deadline.status === "Completed" && ( <span className="bg-green-600 px-3 py-1 rounded text-white text-sm">
✅ Completed </span>
)}

</div>

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

<div className="mt-2 flex gap-2">

<button
  onClick={() => {
    setEditingId(deadline.id);

    setTitle(deadline.title);
    setDueDate(deadline.dueDate);
    setPriority(deadline.priority);
    setStatus(deadline.status);  
}}
  className="bg-blue-600 text-white px-3 py-1 rounded"
>
  Edit
</button>
<button
onClick={() =>
handleDelete(deadline.id)
}
className="bg-red-600 text-white px-3 py-1 rounded"

>


Delete


</button>

</div>
</div>
))
)}
          </div>
        </div>
      </div>
    )}
    </main>
 
 );
}

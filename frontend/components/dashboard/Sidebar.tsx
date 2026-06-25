export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#0D1117] border-r border-zinc-800 p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-purple-500">
        DeadlinePilot AI
      </h1>

      <nav className="mt-10 space-y-3">
        <button className="w-full text-left p-3 rounded-lg bg-purple-600">
          Dashboard
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          Planner
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          Calendar
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          Deadlines
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          Analytics
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          AI Coach
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          Integrations
        </button>

        <button className="w-full text-left p-3 rounded-lg">
          Settings
        </button>
      </nav>

      <div className="mt-auto">
        AI Assistant
      </div>
    </aside>
  );
}

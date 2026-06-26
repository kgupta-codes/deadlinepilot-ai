import { User } from "firebase/auth";

import StatsCards from "@/components/StatsCards";

type Props = {
  actionMessage: string;
  completed: number;
  highPriority: number;
  onLogout: () => void;
  overdue: number;
  productivityScore: number;
  total: number;
  user: User;
};

export default function DashboardHeader({
  actionMessage,
  completed,
  highPriority,
  onLogout,
  overdue,
  productivityScore,
  total,
  user,
}: Props) {
  return (
    <>

<div className="mb-8 flex items-start justify-between">
  {/* Left */}
  <div>
    <h1 className="text-4xl font-bold text-white">
      Good Morning, Kunal 👋
    </h1>

    <p className="mt-2 text-zinc-400 text-lg">
      Let's make today productive and stress-free.
    </p>
  </div>

  {/* Right */}
  <div className="flex items-center gap-4">

    <button className="rounded-xl border border-zinc-700 px-5 py-3">
      Focus Mode
    </button>

    <button className="rounded-xl border border-zinc-700 p-3">
      🔔
    </button>

    <button className="rounded-xl border border-zinc-700 px-5 py-3">
      🌙 Dark
    </button>

  </div>
</div>

      {actionMessage && (
        <p
          className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-100"
          role="status"
        >
          {actionMessage}
        </p>
      )}

      <StatsCards
        total={total}
        overdue={overdue}
        completed={completed}
        highPriority={highPriority}
        productivityScore={productivityScore}
      />
    </>
  );
}

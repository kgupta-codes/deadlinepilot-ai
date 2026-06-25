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
      <div className="text-center mb-8">
        <div
          role="img"
          aria-label={`${user.displayName || "User"} profile photo`}
          className="mx-auto h-20 w-20 rounded-full bg-cover bg-center bg-purple-900"
          style={{
            backgroundImage: `url(${
              user.photoURL || "https://ui-avatars.com/api/?name=User"
            })`,
          }}
        />

        <h2 className="mt-4 text-xl">{user.displayName}</h2>
        <p className="text-gray-300">{user.email}</p>

        <button
          onClick={onLogout}
          className="mt-4 rounded border border-red-500/30 bg-red-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Logout
        </button>
      </div>

      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <h2 className="text-3xl font-bold">
          Welcome Back, {user.displayName?.split(" ")[0] || "Pilot"}
        </h2>

        <p className="mt-2 text-purple-100">
          Stay ahead of deadlines with a local planning agent that works even
          when Gemini quota is unavailable.
        </p>
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

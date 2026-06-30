import type { User } from "firebase/auth";

type Props = {
  onLogout: () => void;
  user: User;
};

export default function SettingsSection({ onLogout, user }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-2xl font-bold text-purple-400">Settings</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm text-gray-400">Account</p>
          <p className="mt-1 font-semibold">{user.email}</p>
          <p className="mt-2 text-sm text-gray-300">
            Signed in with Google. Firebase Auth keeps the session stable across
            reloads.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm text-gray-400">AI Mode</p>
          <p className="mt-1 font-semibold">Offline first, provider swappable</p>
          <p className="mt-2 text-sm text-gray-300">
            The local planner and extractor still work when external providers are
            unavailable.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-sm text-gray-400">Workspace</p>
          <p className="mt-1 font-semibold">DeadlinePilot AI</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 rounded bg-zinc-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

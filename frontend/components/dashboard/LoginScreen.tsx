type Props = {
  loading: boolean;
  onLogin: () => void;
};

export default function LoginScreen({ loading, onLogin }: Props) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-6 text-4xl font-bold">DeadlinePilot AI</h1>
        <p className="mb-8 max-w-md text-sm text-gray-300">
          An AI productivity companion that stays useful even when external AI
          providers are offline.
        </p>

        <button
          disabled={loading}
          onClick={onLogin}
          className="rounded-lg bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-700 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {loading ? "Signing In..." : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}

type Props = {
  pending: number;
  focusTask: string;
  studyHours: number;
  completionConfidence: number;
  recommendation: string;
};

export default function AIDailyBrief({
  pending,
  focusTask,
  studyHours,
  completionConfidence,
  recommendation,
}: Props) {
  return (
    <section className="mb-8 rounded-3xl border border-violet-500/20 bg-gradient-to-r from-[#23113D] via-[#1D1637] to-[#24124A] p-8 shadow-xl">

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">

        {/* LEFT */}

        <div>

          <h2 className="mb-8 text-2xl font-bold text-violet-300">
            🧠 AI Daily Brief
          </h2>

          <div className="grid grid-cols-2 gap-5">

            <div className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm text-zinc-400">
                Pending Deadlines
              </p>

              <h3 className="mt-3 text-3xl font-bold">
                {pending}
              </h3>
            </div>

            <div className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm text-zinc-400">
                Focus Task
              </p>

              <h3 className="mt-3 text-lg font-semibold">
                {focusTask}
              </h3>
            </div>

            <div className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm text-zinc-400">
                Available Study Hours
              </p>

              <h3 className="mt-3 text-3xl font-bold">
                {studyHours.toFixed(1)}h
              </h3>
            </div>

            <div className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm text-zinc-400">
                Completion Confidence
              </p>

              <h3 className="mt-3 text-3xl font-bold text-green-400">
                {completionConfidence}%
              </h3>
            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="rounded-3xl bg-violet-500/10 border border-violet-500/20 p-6">

          <h3 className="text-xl font-bold">
            🚀 AI Recommendation
          </h3>

          <p className="mt-5 text-zinc-300 leading-7">
            {recommendation}
          </p>

          <button className="mt-8 rounded-xl bg-violet-600 px-6 py-3 font-medium hover:bg-violet-500 transition">
            View Full Plan →
          </button>

        </div>

      </div>

    </section>
  );
}

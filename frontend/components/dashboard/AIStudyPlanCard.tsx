type Props = {
  mission: string;
  confidence: number;
  studyHours: number;
  recommendation: string;
};

export default function AIStudyPlanCard({
  mission,
  confidence,
  studyHours,
  recommendation,
}: Props) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#1E1433] to-[#241640] p-6">
      <h3 className="text-xl font-bold text-violet-300">
        📚 AI Study Plan
      </h3>

      <div className="mt-6 space-y-4">

        <div>
          <p className="text-sm text-gray-400">
            Today's Mission
          </p>

          <p className="mt-1 text-lg font-semibold text-white">
            {mission}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">
            Completion Confidence
          </p>

          <p className="mt-1 text-3xl font-bold text-green-400">
            {confidence}%
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">
            Recommended Study
          </p>

          <p className="mt-1 text-white">
            {studyHours.toFixed(1)} hours
          </p>
        </div>

        <div className="rounded-xl bg-violet-500/10 p-3 text-sm text-violet-200">
          {recommendation}
        </div>

      </div>
    </div>
  );
}
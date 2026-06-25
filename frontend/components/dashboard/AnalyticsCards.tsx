import Analytics from "@/components/Analytics";
import TodayPlan from "@/components/TodayPlan";
import AICoach from "@/components/AICoach";
import { AiSource } from "@/hooks/useAI";

type Props = {
  aiInsight: string;
  aiSource: AiSource;
  coachAdvice: string[];
  completed: number;
  completionRate: number;
  dailyConfidence: number;
  dailyTasks: string[];
  highPriority: number;
  nextAction: string;
  overdue: number;
  pending: number;
};

export default function AnalyticsCards({
  aiInsight,
  aiSource,
  coachAdvice,
  completed,
  completionRate,
  dailyConfidence,
  dailyTasks,
  highPriority,
  nextAction,
  overdue,
  pending,
}: Props) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section id="ai-coach">
        <AICoach
          insight={aiInsight}
          localAdvice={coachAdvice}
          source={aiSource}
        />
      </section>

      <section id="analytics">
        <Analytics
          completionRate={completionRate}
          completed={completed}
          pending={pending}
          overdue={overdue}
          highPriority={highPriority}
        />
      </section>

      <section id="today-plan">
        <TodayPlan
          tasks={dailyTasks}
          nextAction={nextAction}
          confidence={dailyConfidence}
        />
      </section>
    </div>
  );
}

import type { User } from "firebase/auth";

import AICommandCenter from "./AICommandCenter";
import type { DashboardSnapshot } from "@/hooks/useDashboard";
import { type AgentTask } from "@/lib/agent";
import { type CalendarEvent } from "@/lib/integrations/googleCalendar";

type Props = {
  user: User;
  greeting: string;
  planner: DashboardSnapshot["planner"];
  recommendation: string;
  deadlines: AgentTask[];
  calendarEvents: CalendarEvent[];
  loading: boolean;
  onAcceptPlan: () => void;
  acceptingPlan: boolean;
  planStatus: string;
};

export default function DashboardGrid({
  user,
  greeting,
  planner,
  recommendation,
  deadlines,
  calendarEvents,
  loading,
  onAcceptPlan,
  acceptingPlan,
  planStatus,
}: Props) {
  return (
    <div className="space-y-6">
      <AICommandCenter
        deadlines={deadlines}
        calendarEvents={calendarEvents}
        user={user}
        greeting={greeting}
        planner={planner}
        recommendation={recommendation}
        loading={loading}
        onAcceptPlan={onAcceptPlan}
        acceptingPlan={acceptingPlan}
        planStatus={planStatus}
      />
    </div>
  );
}

import type { User } from "firebase/auth";

import AICommandCenter from "./AICommandCenter";
import type { DashboardSnapshot } from "@/hooks/useDashboard";

type Props = {
  user: User;
  greeting: string;
  planner: DashboardSnapshot["planner"];
  recommendation: string;
  loading: boolean;
};

export default function DashboardGrid({
  user,
  greeting,
  planner,
  recommendation,
  loading,
}: Props) {
  return (
    <div className="space-y-6">
      <AICommandCenter
        user={user}
        greeting={greeting}
        planner={planner}
        recommendation={recommendation}
        loading={loading}
      />
    </div>
  );
}

export type Priority = "High" | "Medium" | "Low";
export type Status = "Not Started" | "In Progress" | "Completed";
export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export type AgentTask = {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  estimatedHours?: number | null;
};

export type PlanningTask = AgentTask & {
  dueTime?: string | null;
  timezone?: string | null;
  academicType?: string | null;
  courseCode?: string | null;
  courseName?: string | null;
  weightPercent?: number | null;
  subtasks?: string[];
};

export type DailyCapacity = {
  date: string;
  availableHours: number;
  busyHours: number;
  studyWindowHours: number;
};

export type DeadlineUrgency = "overdue" | "due-now" | "urgent" | "soon" | "upcoming" | "later";
export type CollisionLevel = "none" | "low" | "medium" | "high" | "critical";

export type WorkloadCollision = {
  competingEffortHours: number;
  sharedCapacityHours: number;
  collisionRatio: number;
  collisionLevel: CollisionLevel;
  competingTaskIds: string[];
};

export type WorkloadAnalysis = {
  taskId: string;
  requiredEffortHours: number;
  remainingEffortHours: number;
  availableCapacityHours: number;
  capacityDeficitHours: number;
  deadlineUrgency: DeadlineUrgency;
  academicImportanceScore: number;
  workloadCollisionScore: number;
  completionFeasibility: number;
  effortKnown: boolean;
  uncertaintyFlags: string[];
  dailyCapacity: DailyCapacity[];
  collision: WorkloadCollision;
  overallRiskInputs: {
    daysRemaining: number;
    hoursUntilDeadline: number;
    capacityDeficitHours: number;
    completionFeasibility: number;
    collisionLevel: CollisionLevel;
    effortKnown: boolean;
    academicImportanceScore: number;
  };
  recommendedNextAction: string;
};

export type FocusTaskInsight = {
  task: AgentTask;
  daysRemaining: number;
  riskLevel: RiskLevel;
  riskReason: string;
  reason: string;
  estimatedEffortHours: number;
  suggestedWorkDuration: string;
  delayImpact: string;
  recommendedNextAction: string;
  completionConfidence: number;
};

export type DailyMission = {
  focusTask: AgentTask | null;
  tasks: AgentTask[];
  focusBlocks: string[];
  nextAction: string;
  confidence: number;
};

export type WeeklyMission = {
  thisWeek: AgentTask[];
  later: AgentTask[];
  summary: string;
};

export type DeadlineConflict = {
  dueDate: string;
  tasks: AgentTask[];
  severity: RiskLevel;
  reason: string;
};

export type PostponementSuggestion = {
  task: AgentTask;
  reason: string;
  pressureReduction: number;
};

export type RecoveryPlan = {
  todayMission: AgentTask[];
  tomorrow: AgentTask[];
  suggestedWorkOrder: AgentTask[];
  estimatedWorkload: number;
  risk: Record<RiskLevel, AgentTask[]>;
  completionProbability: number;
  advice: string[];
  focusBlocks: string[];
  overloaded: boolean;
  conflicts: DeadlineConflict[];
  postponementSuggestion: PostponementSuggestion | null;
};

export type AgentDashboardMetrics = {
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
  completionRate: number;
  productivityScore: number;
  upcomingPressure: number;
};

export type PlannerPriorityScore = {
  task: PlanningTask;
  score: number;
  reasons: string[];
  workloadHours: number;
  workload: WorkloadAnalysis;
  daysRemaining: number;
  riskLevel: RiskLevel;
  conflictPenalty: number;
};

export type PlannerConflictType =
  | "calendar-overlap"
  | "deadline-calendar-overlap"
  | "capacity-shortfall";

export type PlannerConflict = {
  id: string;
  type: PlannerConflictType;
  severity: RiskLevel;
  title: string;
  reason: string;
  taskIds: string[];
  eventIds: string[];
  requiredMinutes: number;
  availableMinutes: number;
};

export type PlannerStudySlot = {
  id: string;
  start: string;
  end: string;
  durationMinutes: number;
  title: string;
  reason: string;
  linkedTaskId: string | null;
};

export type PlannerTimelineEntryKind = "calendar" | "mission" | "study" | "buffer";

export type PlannerTimelineEntry = {
  id: string;
  start: string;
  end: string;
  title: string;
  kind: PlannerTimelineEntryKind;
  reason: string;
  taskId: string | null;
  eventId: string | null;
};

export type PlannerMission = {
  task: PlanningTask | null;
  reason: string;
  riskLevel: RiskLevel | "None";
  estimatedTimeRequired: number;
  daysRemaining: number | null;
  completionConfidence: number;
  priorityScore: number;
};

export type PlannerPostponement = {
  task: PlanningTask;
  reason: string;
  suggestedDelay: string;
  score: number;
};

export type PlannerRecoveryPlan = {
  impossible: boolean;
  totalWorkHours: number;
  availableWorkHours: number;
  achievableWorkHours: number;
  postponements: PlannerPostponement[];
  explanation: string;
};

export type PlannerRecommendedSession = {
  id: string;
  taskId: string;
  title: string;
  date: string;
  hours: number;
  kind: "work" | "buffer";
};

export type AgenticDayPlan = {
  todaysMission: PlannerMission;
  conflicts: PlannerConflict[];
  recoveryPlan: PlannerRecoveryPlan;
  studySlots: PlannerStudySlot[];
  dailyTimeline: PlannerTimelineEntry[];
  priorityRanking: PlannerPriorityScore[];
  recommendedSessions: PlannerRecommendedSession[];
  planFeasible: boolean;
  decisionLog: string[];
};

"use client";

import AIStudyPlanCard from "@/components/dashboard/AIStudyPlanCard";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import CalendarSection from "@/components/dashboard/CalendarSection";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DeadlineWorkspace from "@/components/dashboard/DeadlineWorkspace";
import PlannerBoard from "@/components/dashboard/PlannerBoard";
import IntegrationsSection from "@/components/dashboard/IntegrationsSection";
import LoginScreen from "@/components/dashboard/LoginScreen";
import SectionContainer from "@/components/dashboard/SectionContainer";
import SettingsSection from "@/components/dashboard/SettingsSection";
import Sidebar from "@/components/Sidebar";
import UpcomingDeadlines from "@/components/UpcomingDeadlines";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useDeadlines } from "@/hooks/useDeadlines";
import { useSidebar } from "@/hooks/useSidebar";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import {
  AIDailyBrief,
  DashboardGrid,
} from "@/components/dashboard";

export default function Home() {
  const { authMessage, loading, login, signOut, user } = useAuth();
  const {
    deadlineMessage,
    clearDeadlines,
    deadlines,
    filters,
    filteredDeadlines,
    form,
    removeDeadline,
    resetForm,
    saveDeadline,
    setFilters,
    setForm,
    startEditing,
  } = useDeadlines(user);
  const calendar = useGoogleCalendar()
  const { activeSection, navigate, sections } = useSidebar(Boolean(user));
  const dashboard = useDashboard(deadlines, calendar.events);
  const { aiInsight, aiLoading, aiSource, analyze, resetAI } = useAI(deadlines);
  const actionMessage = deadlineMessage || authMessage;

  const handleLogout = async () => {
    resetAI();
    clearDeadlines();
    await signOut();
  };

  if (!user) {
    return <LoginScreen loading={loading} onLogin={login} />;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <Sidebar
          activeSection={activeSection}
          onNavigate={navigate}
          sections={sections}
        />

        <div className="flex-1 p-4 md:p-8">


<SectionContainer id="dashboard">
  <DashboardHeader
    actionMessage={actionMessage}
    completed={dashboard.completed}
    highPriority={dashboard.highPriority}
    onLogout={handleLogout}
    overdue={dashboard.overdue}
    productivityScore={dashboard.productivityScore}
    total={deadlines.length}
    user={user}
  />

<AIDailyBrief
  pending={dashboard.pending}
  focusTask={
    dashboard.planner.todaysMission.task?.title ??
    "No focus task"
  }
  studyHours={
    dashboard.planner.studySlots.reduce(
      (sum, slot) => sum + slot.durationMinutes,
      0
    ) / 60
  }
  completionConfidence={
    dashboard.planner.todaysMission.completionConfidence
  }
  recommendation={
    dashboard.coachAdvice[0] ??
    "Your schedule is stable."
  }
/>

  <DashboardGrid
  deadlines={deadlines}
  calendar={calendar}
/>

<div className="mt-8">
  <AIStudyPlanCard
    mission={
      dashboard.planner.todaysMission.task?.title ??
      "No mission"
    }
    confidence={
      dashboard.planner.todaysMission.completionConfidence
    }
    studyHours={
      dashboard.planner.studySlots.reduce(
        (sum, slot) => sum + slot.durationMinutes,
        0
      ) / 60
    }
    recommendation={
      dashboard.coachAdvice[0] ??
      "Your schedule looks healthy."
    }
  />
</div>
</SectionContainer>

<SectionContainer id="planner">
  <PlannerBoard plan={dashboard.planner} />
</SectionContainer>
        

          <DeadlineWorkspace
            aiLoading={aiLoading}
            deadlines={deadlines}
            filters={filters}
            filteredDeadlines={filteredDeadlines}
            form={form}
            onAnalyze={analyze}
            onDelete={removeDeadline}
            onSave={saveDeadline}
            onStartEditing={startEditing}
            resetForm={resetForm}
            setFilters={setFilters}
            setForm={setForm}
          />

          <SettingsSection onLogout={handleLogout} user={user} />
          <IntegrationsSection aiSource={aiSource} signedIn={Boolean(user)} />
        </div>
      </div>
    </main>
  );
}

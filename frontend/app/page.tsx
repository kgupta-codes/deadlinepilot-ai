"use client";

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
  const calendar = useGoogleCalendar();
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
          </SectionContainer>

          <SectionContainer id="planner">
            <PlannerBoard plan={dashboard.planner} />
          </SectionContainer>

          <AnalyticsCards
            aiInsight={aiInsight}
            aiSource={aiSource}
            coachAdvice={dashboard.coachAdvice}
            completed={dashboard.completed}
            completionRate={dashboard.completionRate}
            dailyConfidence={dashboard.planner.todaysMission.completionConfidence}
            dailyTasks={dashboard.planner.priorityRanking
              .slice(0, 3)
              .map((item) => item.task.title)}
            highPriority={dashboard.highPriority}
            nextAction={dashboard.planner.todaysMission.reason}
            overdue={dashboard.overdue}
            pending={dashboard.pending}
          />

          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <UpcomingDeadlines deadlines={deadlines} />
            <CalendarSection
              actionLoading={calendar.actionLoading}
              connect={calendar.connect}
              connection={calendar.connection}
              conflicts={calendar.conflicts}
              disconnect={calendar.disconnect}
              errorMessage={calendar.errorMessage}
              events={calendar.events}
              loading={calendar.loading}
              studySlots={calendar.studySlots}
            />
          </div>

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

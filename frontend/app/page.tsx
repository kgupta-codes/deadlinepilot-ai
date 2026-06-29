"use client";

import AnalyticsWorkspace from "@/components/dashboard/AnalyticsWorkspace";
import AssistantWorkspace from "@/components/dashboard/AssistantWorkspace";
import CalendarSection from "@/components/dashboard/CalendarSection";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import DeadlineWorkspace from "@/components/dashboard/DeadlineWorkspace";
import LoginScreen from "@/components/dashboard/LoginScreen";
import SectionContainer from "@/components/dashboard/SectionContainer";
import SettingsSection from "@/components/dashboard/SettingsSection";
import Sidebar from "@/components/dashboard/Sidebar";
import CaptureWorkspace from "@/components/capture/CaptureWorkspace";
import ToastViewport from "@/components/ui/ToastViewport";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useCapture } from "@/hooks/useCapture";
import { useDeadlines } from "@/hooks/useDeadlines";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useToasts } from "@/hooks/useToasts";
import { useSidebar } from "@/hooks/useSidebar";

export default function Home() {
  const { authMessage, loading, login, signOut, user } = useAuth();
  const toasts = useToasts();
  const {
    deadlineMessage,
    loading: deadlinesLoading,
    clearDeadlines,
    deadlines,
    filters,
    filteredDeadlines,
    form,
    removeDeadline,
    resetForm,
    saveDeadline,
    saveDeadlineRecord,
    setFilters,
    setForm,
    startEditing,
  } = useDeadlines(user, toasts.pushToast);
  const calendar = useGoogleCalendar();
  const { activeSection, navigate, sections } = useSidebar(Boolean(user));
  const dashboard = useDashboard(deadlines, calendar.events);
  const capture = useCapture({ notify: toasts.pushToast, saveDeadlineRecord });
  const actionMessage = deadlineMessage || authMessage;

  const handleLogout = async () => {
    clearDeadlines();
    await signOut();
  };

  if (!user) {
    return <LoginScreen loading={loading} onLogin={login} />;
  }

  const hour = new Date().getHours();
  const greetingPeriod =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const greeting = `Good ${greetingPeriod}, ${user.displayName || user.email || "there"}`;

  const recommendation =
    dashboard.coachAdvice[0] ||
    dashboard.planner.recoveryPlan.explanation ||
    "The planner is ready.";

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
            {actionMessage ? (
              <div
                className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100"
                role="status"
              >
                {actionMessage}
              </div>
            ) : null}

            <DashboardGrid
              deadlines={deadlines}
              calendarEvents={calendar.events}
              greeting={greeting}
              loading={calendar.loading || deadlinesLoading}
              planner={dashboard.planner}
              recommendation={recommendation}
              user={user}
            />
          </SectionContainer>

          <SectionContainer id="capture">
            <CaptureWorkspace
              activeMode={capture.mode}
              draft={capture.draft}
              errorMessage={capture.errorMessage}
              extracting={capture.extracting}
              input={capture.input}
              onCancelDraft={capture.cancelDraft}
              onConfirmDraft={capture.confirmSave}
              onExtract={capture.extract}
              onInputChange={capture.setInput}
              onModeChange={capture.setMode}
              onReset={capture.resetCapture}
              onUpdateDraft={capture.updateDraft}
              saving={capture.saving}
              statusMessage={capture.statusMessage}
            />
          </SectionContainer>

          <SectionContainer id="deadlines">
            <DeadlineWorkspace
              deadlines={deadlines}
              filters={filters}
              filteredDeadlines={filteredDeadlines}
              form={form}
              onCancelEditing={resetForm}
              onDelete={removeDeadline}
              onSave={saveDeadline}
              onStartEditing={startEditing}
              setFilters={setFilters}
              setForm={setForm}
            />
          </SectionContainer>

          <SectionContainer id="calendar">
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
          </SectionContainer>

          <SectionContainer id="assistant">
            <AssistantWorkspace dashboard={dashboard} />
          </SectionContainer>

          <SectionContainer id="analytics">
            <AnalyticsWorkspace dashboard={dashboard} />
          </SectionContainer>

          <SectionContainer id="settings">
            <SettingsSection onLogout={handleLogout} user={user} />
          </SectionContainer>
        </div>
      </div>
      <ToastViewport onDismiss={toasts.dismissToast} toasts={toasts.toasts} />
    </main>
  );
}

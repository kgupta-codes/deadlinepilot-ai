import UpcomingDeadlines from "@/components/UpcomingDeadlines";
import CalendarSection from "./CalendarSection";
import QuickStats from "./QuickStats";

type Props = {
  deadlines: any;
  calendar: any;
};

export default function DashboardGrid({
  deadlines,
  calendar,
}: Props) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div>
          <UpcomingDeadlines deadlines={deadlines} />
        </div>

        <div>
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

        <div>
          <QuickStats />
        </div>
      </div>
    </section>
  );
}

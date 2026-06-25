"use client";

import CalendarPanel from "@/components/dashboard/CalendarPanel";
import {
  BusySlot,
  CalendarEvent,
  GoogleCalendarConnection,
  StudySlot,
} from "@/lib/integrations/googleCalendar";

type Props = {
  actionLoading: boolean;
  connect: () => void;
  connection: GoogleCalendarConnection;
  conflicts: BusySlot[];
  disconnect: () => void;
  errorMessage: string;
  events: CalendarEvent[];
  loading: boolean;
  studySlots: StudySlot[];
};

export default function CalendarSection({
  actionLoading,
  connect,
  connection,
  conflicts,
  disconnect,
  errorMessage,
  events,
  loading,
  studySlots,
}: Props) {

  return (
    <CalendarPanel
      actionLoading={actionLoading}
      connection={connection}
      conflicts={conflicts}
      disconnect={disconnect}
      errorMessage={errorMessage}
      events={events}
      loading={loading}
      onConnect={connect}
      studySlots={studySlots}
    />
  );
}

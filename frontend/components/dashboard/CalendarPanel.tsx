"use client";

import {
  BusySlot,
  CalendarEvent,
  GoogleCalendarConnection,
  StudySlot,
} from "@/lib/integrations/googleCalendar";

type Props = {
  actionLoading: boolean;
  connection: GoogleCalendarConnection;
  conflicts: BusySlot[];
  disconnect: () => void;
  errorMessage: string;
  events: CalendarEvent[];
  loading: boolean;
  onConnect: () => void;
  studySlots: StudySlot[];
};

const formatWindow = (start: string, end: string) => {
  const formatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(
    new Date(end)
  )}`;
};

const EmptyState = ({ message }: { message: string }) => (
  <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-gray-400">
    {message}
  </p>
);

export default function CalendarPanel({
  actionLoading,
  connection,
  conflicts,
  disconnect,
  errorMessage,
  events,
  loading,
  onConnect,
  studySlots,
}: Props) {
  const connected = connection.connected;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-purple-400">
            Google Calendar
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Calendar sync foundation for events, conflicts, and study blocks.
          </p>
        </div>

        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={actionLoading}
            className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-5 py-3 font-semibold hover:border-purple-500"
          >
            {actionLoading ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={actionLoading}
            className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
          >
            {actionLoading ? "Connecting..." : "Connect Google Calendar"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            connected
              ? "bg-green-500/20 text-green-300"
              : "bg-zinc-800 text-gray-300"
          }`}
        >
          {connected ? "Connected" : "Not Connected"}
        </span>

        {connection.email && (
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs">
            {connection.email}
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {/* Upcoming Events */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h4 className="font-semibold text-purple-200">Upcoming Events</h4>

          <div className="mt-3 space-y-3">
            {loading ? (
              <EmptyState message="Loading calendar events..." />
            ) : events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg bg-zinc-900 p-3"
                >
                  <p className="font-semibold">{event.title}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatWindow(event.start, event.end)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No upcoming events." />
            )}
          </div>
        </section>

        {/* Conflicts */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h4 className="font-semibold text-purple-200">
            Conflict Detection
          </h4>

          <div className="mt-3 space-y-3">
            {loading ? (
              <EmptyState message="Scanning conflicts..." />
            ) : conflicts.length > 0 ? (
              conflicts.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-lg bg-zinc-900 p-3"
                >
                  <p className="font-semibold">{slot.title}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatWindow(slot.start, slot.end)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {slot.reason}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No conflicts detected." />
            )}
          </div>
        </section>

        {/* Study Slots */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <h4 className="font-semibold text-purple-200">
            Suggested Study Slots
          </h4>

          <div className="mt-3 space-y-3">
            {loading ? (
              <EmptyState message="Calculating study slots..." />
            ) : studySlots.length > 0 ? (
              studySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-lg bg-zinc-900 p-3"
                >
                  <p className="font-semibold">{slot.label}</p>

                  <p className="mt-1 text-sm text-gray-400">
                    {formatWindow(slot.start, slot.end)} •{" "}
                    {slot.durationMinutes} min
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {slot.reason}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No study slots available." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BusySlot,
  CalendarEvent,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  fetchCalendarEvents,
  getGoogleCalendarConnection,
  GoogleCalendarClientError,
  GoogleCalendarConnection,
  suggestStudySlots,
  detectCalendarConflicts,
  StudySlot,
} from "@/lib/integrations/googleCalendar";

export type GoogleCalendarState = {
  actionLoading: boolean;
  connect: () => Promise<void>;
  connection: GoogleCalendarConnection;
  conflicts: BusySlot[];
  disconnect: () => Promise<void>;
  errorMessage: string;
  events: CalendarEvent[];
  loading: boolean;
  refresh: () => Promise<void>;
  studySlots: StudySlot[];
};

export const useGoogleCalendar = () => {
  const [connection, setConnection] = useState<GoogleCalendarConnection>({
    provider: "google-calendar",
    connected: false,
    status: "unauthenticated",
    email: null,
    expiresAt: null,
    message: "Google Calendar is not connected.",
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const refresh = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const status = await getGoogleCalendarConnection();
      setConnection(status);

      if (status.connected) {
        const nextEvents = await fetchCalendarEvents({ maxResults: 8 });
        setEvents(nextEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load Google Calendar.";
      setErrorMessage(message);
      setConnection((current) => ({
        ...current,
        connected: false,
        status:
          error instanceof GoogleCalendarClientError &&
          (error.code === "expired" || error.code === "revoked")
            ? error.code
            : "error",
        message,
      }));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const connect = async () => {
    setActionLoading(true);

    try {
      await connectGoogleCalendar();
    } finally {
      setActionLoading(false);
    }
  };

  const disconnect = async () => {
    setActionLoading(true);
    setErrorMessage("");

    try {
      const nextConnection = await disconnectGoogleCalendar();
      setConnection(nextConnection);
      setEvents([]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to disconnect Google Calendar.";
      setErrorMessage(message);
    } finally {
      setActionLoading(false);
    }
  };

  const conflicts: BusySlot[] = useMemo(
    () => detectCalendarConflicts(events),
    [events]
  );
  const studySlots: StudySlot[] = useMemo(
    () => suggestStudySlots(events),
    [events]
  );

  return {
    actionLoading,
    connect,
    connection,
    conflicts,
    disconnect,
    errorMessage,
    events,
    loading,
    refresh,
    studySlots,
  } satisfies GoogleCalendarState;
};

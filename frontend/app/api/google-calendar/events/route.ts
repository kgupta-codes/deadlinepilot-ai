import { NextResponse } from "next/server";

import {
  getGoogleCalendarClearSessionCookie,
  getGoogleCalendarSessionCookie,
  loadGoogleCalendarEvents,
} from "@/lib/integrations/googleCalendar";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const maxResults = Number(url.searchParams.get("maxResults") || "5");
    const resolution = await loadGoogleCalendarEvents(
      request.headers.get("cookie"),
      {
        maxResults: Number.isFinite(maxResults) && maxResults > 0 ? maxResults : 5,
      }
    );

    const response = NextResponse.json({
      events: resolution.events,
      connection: {
        provider: "google-calendar",
        connected: resolution.status === "connected",
        status: resolution.status,
        email: resolution.session?.email || null,
        expiresAt: resolution.session?.expiresAt || null,
        message:
          resolution.status === "connected"
            ? "Google Calendar events loaded."
            : resolution.status === "revoked"
              ? "Google Calendar permission was revoked."
              : resolution.status === "expired"
                ? "Google Calendar session expired."
                : "Google Calendar is not connected.",
      },
    });

    const cookies: string[] = [];

    if (resolution.setCookieValue) {
      cookies.push(getGoogleCalendarSessionCookie(resolution.setCookieValue));
    }

    if (resolution.clearSessionCookie) {
      cookies.push(getGoogleCalendarClearSessionCookie());
    }

    if (cookies.length > 0) {
      cookies.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Google Calendar events.";

    return NextResponse.json(
      {
        message,
      },
      {
        status: 500,
      }
    );
  }
}

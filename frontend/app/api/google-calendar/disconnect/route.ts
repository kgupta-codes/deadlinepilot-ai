import { NextResponse } from "next/server";

import {
  disconnectGoogleCalendarSession,
  getGoogleCalendarClearSessionCookie,
} from "@/lib/integrations/googleCalendar";

export async function POST(request: Request) {
  try {
    const resolution = await disconnectGoogleCalendarSession(
      request.headers.get("cookie")
    );
    const response = NextResponse.json({
      connection: {
        provider: "google-calendar",
        connected: false,
        status: "unauthenticated",
        email: null,
        expiresAt: null,
        message: "Google Calendar disconnected.",
      },
    });

    if (resolution.clearSessionCookie) {
      response.headers.append("Set-Cookie", getGoogleCalendarClearSessionCookie());
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to disconnect Google Calendar.";

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

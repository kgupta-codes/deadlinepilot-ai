import { NextResponse } from "next/server";

import {
  getGoogleCalendarClearSessionCookie,
  getGoogleCalendarSessionCookie,
  resolveGoogleCalendarSession,
} from "@/lib/integrations/googleCalendar";

export async function GET(request: Request) {
  try {
    const resolution = await resolveGoogleCalendarSession(
      request.headers.get("cookie")
    );
    const response = NextResponse.json({
      connection: resolution.connection,
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
      error instanceof Error ? error.message : "Unable to load Google Calendar status.";

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

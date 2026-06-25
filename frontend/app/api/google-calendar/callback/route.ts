import { NextResponse } from "next/server";

import {
  completeGoogleCalendarConnection,
  getGoogleCalendarClearOauthCookie,
  getGoogleCalendarSessionCookie,
} from "@/lib/integrations/googleCalendar";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const completion = await completeGoogleCalendarConnection(
      requestUrl.origin,
      requestUrl,
      request.headers.get("cookie")
    );
    const response = NextResponse.redirect(
      new URL("/?googleCalendar=connected", requestUrl.origin)
    );

    response.headers.append(
      "Set-Cookie",
      getGoogleCalendarSessionCookie(completion.sessionCookieValue)
    );
    response.headers.append(
      "Set-Cookie",
      getGoogleCalendarClearOauthCookie()
    );

    return response;
  } catch (error) {
    const requestUrl = new URL(request.url);
    const message =
      error instanceof Error ? error.message : "Unable to complete Google OAuth.";

    return NextResponse.redirect(
      new URL(`/?googleCalendar=error&message=${encodeURIComponent(message)}`, requestUrl.origin)
    );
  }
}

import { NextResponse } from "next/server";

import {
  createGoogleCalendarConnectRequestAsync,
  getGoogleCalendarOauthCookie,
} from "@/lib/integrations/googleCalendar";

export async function GET(request: Request) {
  try {
    const connect = await createGoogleCalendarConnectRequestAsync(
      new URL(request.url).origin
    );
    const response = NextResponse.redirect(connect.authorizationUrl);

    response.headers.append(
      "Set-Cookie",
      getGoogleCalendarOauthCookie(
        connect.oauthCookieValue,
        connect.oauthCookieMaxAge
      )
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Google OAuth.";

    return NextResponse.json(
      { message },
      {
        status: 500,
      }
    );
  }
}

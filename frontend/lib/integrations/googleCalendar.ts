export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarId?: string;
  location?: string;
  description?: string;
};

export type BusySlot = {
  id: string;
  title: string;
  start: string;
  end: string;
  conflictingEventIds: string[];
  reason: string;
};

export type StudySlot = {
  id: string;
  start: string;
  end: string;
  durationMinutes: number;
  label: string;
  reason: string;
};

export type GoogleCalendarConnectionStatus =
  | "connected"
  | "unauthenticated"
  | "expired"
  | "revoked"
  | "error";

export type GoogleCalendarConnection = {
  provider: "google-calendar";
  connected: boolean;
  status: GoogleCalendarConnectionStatus;
  email: string | null;
  message: string;
  expiresAt: string | null;
};

export type CalendarFetchOptions = {
  maxResults?: number;
};

export type StudySlotOptions = {
  dayStartHour?: number;
  dayEndHour?: number;
  minimumDurationMinutes?: number;
  maxSlots?: number;
  now?: Date;
};

export type GoogleCalendarClientErrorCode =
  | "unauthenticated"
  | "expired"
  | "revoked"
  | "network"
  | "configuration";

export class GoogleCalendarClientError extends Error {
  code: GoogleCalendarClientErrorCode;

  constructor(code: GoogleCalendarClientErrorCode, message: string) {
    super(message);
    this.name = "GoogleCalendarClientError";
    this.code = code;
  }
}

export type GoogleCalendarSession = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  email: string | null;
  scope: string;
  tokenType: string;
};

type GoogleCalendarOAuthState = {
  state: string;
  codeVerifier: string;
  createdAt: number;
};

type GoogleCalendarTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleCalendarEventApiItem = {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  calendarId?: string;
  location?: string;
  description?: string;
};

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarEventApiItem[];
};

type GoogleCalendarResolution = {
  session: GoogleCalendarSession | null;
  connection: GoogleCalendarConnection;
  setCookieValue?: string;
  clearSessionCookie?: boolean;
};

type ConnectInit = {
  authorizationUrl: string;
  oauthCookieValue: string;
  oauthCookieMaxAge: number;
};

type OAuthCompletion = {
  session: GoogleCalendarSession;
  sessionCookieValue: string;
  clearOauthCookie: boolean;
};

const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const GOOGLE_CALENDAR_API_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GOOGLE_SCOPE =
  "openid email https://www.googleapis.com/auth/calendar.readonly";
const SESSION_COOKIE_NAME = "deadlinepilot_google_calendar_session";
const OAUTH_COOKIE_NAME = "deadlinepilot_google_calendar_oauth";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_TTL_SECONDS = 10 * 60;
const DEFAULT_STUDY_WINDOW_START = 8;
const DEFAULT_STUDY_WINDOW_END = 21;
const DEFAULT_STUDY_MINUTES = 45;
const DEFAULT_STUDY_SLOTS = 3;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const sortByStart = <T extends { start: string }>(items: T[]) =>
  [...items].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

const minutesBetween = (start: Date, end: Date) =>
  Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

const isBrowser = () => typeof window !== "undefined";

const getCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
};

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize)
    );
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const generateRandomBase64Url = (length = 32) => {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

const sha256 = async (value: string) => {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(value)
  );
  return new Uint8Array(digest);
};

const stringFromBase64Url = (value: string) =>
  textDecoder.decode(fromBase64Url(value));

const getSecretMaterial = () => {
  const secret = process.env.GOOGLE_CALENDAR_COOKIE_SECRET;

  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "GOOGLE_CALENDAR_COOKIE_SECRET must be set to a strong secret string."
    );
  }

  return secret;
};

const deriveAesKey = async () => {
  const secretBytes = textEncoder.encode(getSecretMaterial());
  const hashed = await globalThis.crypto.subtle.digest("SHA-256", secretBytes);

  return globalThis.crypto.subtle.importKey(
    "raw",
    hashed,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptValue = async (value: unknown) => {
  const key = await deriveAesKey();
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const payload = textEncoder.encode(JSON.stringify(value));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    payload
  );

  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
};

const decryptValue = async <T>(serialized: string): Promise<T> => {
  const [ivValue, payloadValue] = serialized.split(".");

  if (!ivValue || !payloadValue) {
    throw new Error("Invalid encrypted payload.");
  }

  const key = await deriveAesKey();
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivValue) },
    key,
    fromBase64Url(payloadValue)
  );

  return JSON.parse(textDecoder.decode(decrypted)) as T;
};

const serializeCookie = (
  name: string,
  value: string,
  maxAgeSeconds: number
) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const clearCookie = (name: string) =>
  `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

const isTokenExpired = (session: GoogleCalendarSession, skewMs = 60_000) =>
  Date.parse(session.expiresAt) - skewMs <= Date.now();

const mapErrorCode = (
  error: string | undefined,
  status?: number
): GoogleCalendarClientErrorCode => {
  if (status === 401) {
    return "expired";
  }

  if (
    error === "invalid_grant" ||
    error === "invalid_token" ||
    error === "unauthorized_client" ||
    error === "access_denied"
  ) {
    return "revoked";
  }

  return "network";
};

const ensureConfiguration = () => {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET must be configured."
    );
  }

  return { clientId, clientSecret };
};

const buildRedirectUri = (origin: string) =>
  new URL("/api/google-calendar/callback", origin).toString();

const parseGoogleIdTokenEmail = (idToken?: string) => {
  if (!idToken) {
    return null;
  }

  const [, payload] = idToken.split(".");

  if (!payload) {
    return null;
  }

  try {
    const decoded = JSON.parse(stringFromBase64Url(payload)) as {
      email?: string;
    };
    return typeof decoded.email === "string" ? decoded.email : null;
  } catch {
    return null;
  }
};

const tokenResponseToSession = (
  token: GoogleCalendarTokenResponse,
  fallbackEmail: string | null
): GoogleCalendarSession => {
  const email = parseGoogleIdTokenEmail(token.id_token) || fallbackEmail;

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    email,
    scope: token.scope || GOOGLE_SCOPE,
    tokenType: token.token_type || "Bearer",
  };
};

const exchangeCodeForToken = async (
  code: string,
  codeVerifier: string,
  redirectUri: string
) => {
  const { clientId, clientSecret } = ensureConfiguration();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as GoogleCalendarTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error || data.error_description || "oauth_exchange_failed");
  }

  return data;
};

const refreshAccessToken = async (session: GoogleCalendarSession) => {
  if (!session.refreshToken) {
    throw new Error("missing_refresh_token");
  }

  const { clientId, clientSecret } = ensureConfiguration();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as GoogleCalendarTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error || data.error_description || "refresh_failed");
  }

  return {
    ...session,
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    refreshToken: data.refresh_token || session.refreshToken,
    scope: data.scope || session.scope,
    tokenType: data.token_type || session.tokenType,
  };
};

const revokeToken = async (token: string) => {
  const body = new URLSearchParams({ token });

  await fetch(GOOGLE_REVOKE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
};

const fetchGoogleCalendarEvents = async (
  accessToken: string,
  options: CalendarFetchOptions = {}
) => {
  const params = new URLSearchParams({
    calendarId: "primary",
    maxResults: String(options.maxResults ?? 5),
    orderBy: "startTime",
    singleEvents: "true",
    timeMin: new Date().toISOString(),
fields:
  "items(id,summary,start,end,location,description),nextSyncToken",
  });

  const response = await fetch(`${GOOGLE_CALENDAR_API_ENDPOINT}?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as GoogleCalendarEventsResponse;

  if (!response.ok) {
    const error = (data as { error?: { message?: string; status?: string } })
      .error;
    throw new Error(error?.status || error?.message || "calendar_fetch_failed");
  }

  return (data.items || []).map<CalendarEvent>((item, index) => {
    const start = item.start?.dateTime || item.start?.date || "";
    const end = item.end?.dateTime || item.end?.date || start;

    return {
      id: item.id || `event-${index}`,
      title: item.summary || "Untitled event",
      start,
      end,
      calendarId: item.calendarId,
      location: item.location,
      description: item.description,
    };
  });
};

const getPlanningWindow = (now: Date, options: Required<StudySlotOptions>) => {
  const start = new Date(now);
  start.setHours(options.dayStartHour, 0, 0, 0);

  const end = new Date(now);
  end.setHours(options.dayEndHour, 0, 0, 0);

  if (start < now) {
    start.setTime(now.getTime());
  }

  return { start, end };
};

export const createGoogleCalendarConnectRequestAsync = async (
  origin: string
): Promise<ConnectInit> => {
  const state = generateRandomBase64Url(24);
  const codeVerifier = generateRandomBase64Url(64);
  const codeChallenge = toBase64Url(await sha256(codeVerifier));
  const redirectUri = buildRedirectUri(origin);
  const { clientId } = ensureConfiguration();
  const authorization = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);

  authorization.search = new URLSearchParams({
    client_id: clientId,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    include_granted_scopes: "true",
    access_type: "offline",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    state,
  }).toString();

  const oauthCookieValue = await encryptValue({
    codeVerifier,
    createdAt: Date.now(),
    state,
  } satisfies GoogleCalendarOAuthState);

  return {
    authorizationUrl: authorization.toString(),
    oauthCookieValue,
    oauthCookieMaxAge: OAUTH_TTL_SECONDS,
  };
};

export const completeGoogleCalendarConnection = async (
  origin: string,
  requestUrl: URL,
  cookieHeader: string | null
): Promise<OAuthCompletion> => {
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const oauthCookie = getCookieValue(cookieHeader, OAUTH_COOKIE_NAME);

  if (!code || !state || !oauthCookie) {
    throw new Error("missing_oauth_parameters");
  }

  const oauthState = await decryptValue<GoogleCalendarOAuthState>(oauthCookie);

  if (oauthState.state !== state) {
    throw new Error("oauth_state_mismatch");
  }

  const token = await exchangeCodeForToken(
    code,
    oauthState.codeVerifier,
    buildRedirectUri(origin)
  );
  const session = tokenResponseToSession(token, null);

  return {
    session,
    sessionCookieValue: await encryptValue(session),
    clearOauthCookie: true,
  };
};

export const resolveGoogleCalendarSession = async (
  cookieHeader: string | null
): Promise<GoogleCalendarResolution> => {
  const sessionCookie = getCookieValue(cookieHeader, SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return {
      session: null,
      connection: {
        provider: "google-calendar",
        connected: false,
        status: "unauthenticated",
        email: null,
        expiresAt: null,
        message: "Google Calendar is not connected.",
      },
    };
  }

  try {
    const session = await decryptValue<GoogleCalendarSession>(sessionCookie);

    if (!session.email) {
      return {
        session,
        connection: {
          provider: "google-calendar",
          connected: false,
          status: "error",
          email: null,
          expiresAt: session.expiresAt,
          message: "Google Calendar session is missing account metadata.",
        },
        clearSessionCookie: true,
      };
    }

    if (isTokenExpired(session)) {
      if (!session.refreshToken) {
        return {
          session,
          connection: {
            provider: "google-calendar",
            connected: false,
            status: "expired",
            email: session.email,
            expiresAt: session.expiresAt,
            message: "Google Calendar session expired. Reconnect to continue.",
          },
        };
      }

      try {
        const refreshed = await refreshAccessToken(session);

        return {
          session: refreshed,
          setCookieValue: await encryptValue(refreshed),
          connection: {
            provider: "google-calendar",
            connected: true,
            status: "connected",
            email: refreshed.email,
            expiresAt: refreshed.expiresAt,
            message: `Connected to Google Calendar${refreshed.email ? ` as ${refreshed.email}` : ""}.`,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "refresh_failed";
        const status = mapErrorCode(message, 401);

        return {
          session: null,
          clearSessionCookie: true,
          connection: {
            provider: "google-calendar",
            connected: false,
            status: status === "revoked" ? "revoked" : "expired",
            email: session.email,
            expiresAt: session.expiresAt,
            message:
              status === "revoked"
                ? "Google Calendar permission was revoked. Reconnect to restore access."
                : "Google Calendar session expired. Reconnect to continue.",
          },
        };
      }
    }

    return {
      session,
      connection: {
        provider: "google-calendar",
        connected: true,
        status: "connected",
        email: session.email,
        expiresAt: session.expiresAt,
        message: `Connected to Google Calendar${session.email ? ` as ${session.email}` : ""}.`,
      },
    };
  } catch {
    return {
      session: null,
      clearSessionCookie: true,
      connection: {
        provider: "google-calendar",
        connected: false,
        status: "error",
        email: null,
        expiresAt: null,
        message: "Could not read the Google Calendar session.",
      },
    };
  }
};

export const loadGoogleCalendarEvents = async (
  cookieHeader: string | null,
  options: CalendarFetchOptions = {}
): Promise<{
  events: CalendarEvent[];
  session: GoogleCalendarSession | null;
  status: GoogleCalendarConnectionStatus;
  setCookieValue?: string;
  clearSessionCookie?: boolean;
}> => {
  const resolution = await resolveGoogleCalendarSession(cookieHeader);

  if (!resolution.session || !resolution.connection.connected) {
    return {
      events: [],
      session: resolution.session,
      status: resolution.connection.status,
      setCookieValue: resolution.setCookieValue,
      clearSessionCookie: resolution.clearSessionCookie,
    };
  }

  const fetchEventsWithSession = async (session: GoogleCalendarSession) => {
    try {
      const events = await fetchGoogleCalendarEvents(session.accessToken, options);
      return {
        events,
        session,
        status: "connected" as const,
        setCookieValue: resolution.setCookieValue,
        clearSessionCookie: resolution.clearSessionCookie,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "calendar_fetch_failed";

      if ((message === "expired" || message === "invalid_token") && session.refreshToken) {
        const refreshed = await refreshAccessToken(session);
        const events = await fetchGoogleCalendarEvents(refreshed.accessToken, options);

        return {
          events,
          session: refreshed,
          status: "connected" as const,
          setCookieValue: await encryptValue(refreshed),
          clearSessionCookie: false,
        };
      }

      if (message === "invalid_grant" || message === "revoked" || message === "unauthorized_client") {
        return {
          events: [],
          session: null,
          status: "revoked" as const,
          clearSessionCookie: true,
        };
      }

      throw new Error(message);
    }
  };

  return fetchEventsWithSession(resolution.session);
};

export const disconnectGoogleCalendarSession = async (
  cookieHeader: string | null
): Promise<{
  clearSessionCookie: boolean;
}> => {
  const sessionCookie = getCookieValue(cookieHeader, SESSION_COOKIE_NAME);

  if (sessionCookie) {
    try {
      const session = await decryptValue<GoogleCalendarSession>(sessionCookie);
      await revokeToken(session.refreshToken || session.accessToken);
    } catch {
      // Best effort revocation. Always clear local state.
    }
  }

  return {
    clearSessionCookie: true,
  };
};

export const connectGoogleCalendar = async () => {
  if (!isBrowser()) {
    throw new Error("Google Calendar can only be connected in the browser.");
  }

  window.location.assign("/api/google-calendar/connect");
};

export const getGoogleCalendarConnection = async (): Promise<GoogleCalendarConnection> => {
  const response = await fetch("/api/google-calendar/status", {
    cache: "no-store",
  });
  const data = (await response.json()) as { connection?: GoogleCalendarConnection; message?: string };

  if (!response.ok || !data.connection) {
    throw new GoogleCalendarClientError(
      "network",
      data.message || "Unable to load Google Calendar status."
    );
  }

  return data.connection;
};

export const disconnectGoogleCalendar = async (): Promise<GoogleCalendarConnection> => {
  const response = await fetch("/api/google-calendar/disconnect", {
    method: "POST",
    cache: "no-store",
  });
  const data = (await response.json()) as { connection?: GoogleCalendarConnection; message?: string };

  if (!response.ok || !data.connection) {
    throw new GoogleCalendarClientError(
      "network",
      data.message || "Unable to disconnect Google Calendar."
    );
  }

  return data.connection;
};

export const fetchCalendarEvents = async (
  options: CalendarFetchOptions = {}
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams();

  if (typeof options.maxResults === "number") {
    params.set("maxResults", String(options.maxResults));
  }

  const response = await fetch(
    `/api/google-calendar/events${params.toString() ? `?${params.toString()}` : ""}`,
    { cache: "no-store" }
  );

  const data = (await response.json()) as
    | { events?: CalendarEvent[]; connection?: GoogleCalendarConnection; message?: string }
    | undefined;

  if (!response.ok) {
    const connection = data?.connection;
    const code = connection?.status || "network";
    throw new GoogleCalendarClientError(
      code === "unauthenticated" || code === "expired" || code === "revoked"
        ? code
        : "network",
      data?.message || "Unable to load Google Calendar events."
    );
  }

  return data?.events || [];
};

const defaultStudySlotOptions = {
  dayStartHour: DEFAULT_STUDY_WINDOW_START,
  dayEndHour: DEFAULT_STUDY_WINDOW_END,
  minimumDurationMinutes: DEFAULT_STUDY_MINUTES,
  maxSlots: DEFAULT_STUDY_SLOTS,
};

export const detectCalendarConflicts = (
  events: CalendarEvent[]
): BusySlot[] => {
  const sorted = sortByStart(events);
  const conflicts: BusySlot[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const currentEnd = new Date(current.end).getTime();
    const nextStart = new Date(next.start).getTime();

    if (nextStart < currentEnd) {
      conflicts.push({
        id: `conflict-${current.id}-${next.id}`,
        title: `${current.title} overlaps ${next.title}`,
        start: current.start,
        end: next.end,
        conflictingEventIds: [current.id, next.id],
        reason: `These events overlap and should be resolved before adding study time.`,
      });
    }
  }

  return conflicts;
};

export const suggestStudySlots = (
  events: CalendarEvent[],
  options: StudySlotOptions = {}
): StudySlot[] => {
  const resolvedOptions: Required<StudySlotOptions> = {
    ...defaultStudySlotOptions,
    ...options,
    now: options.now || new Date(),
  };
  const busySlots = sortByStart(events);
  const window = getPlanningWindow(resolvedOptions.now, resolvedOptions);
  const suggestions: StudySlot[] = [];
  let cursor = new Date(window.start);

  for (const event of busySlots) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    if (eventEnd <= window.start || eventStart >= window.end) {
      continue;
    }

    const openMinutes = minutesBetween(cursor, eventStart);

    if (openMinutes >= resolvedOptions.minimumDurationMinutes) {
      suggestions.push({
        id: `study-${toBase64Url(textEncoder.encode(`${cursor.toISOString()}-${eventStart.toISOString()}`))}`,
        start: cursor.toISOString(),
        end: eventStart.toISOString(),
        durationMinutes: openMinutes,
        label: "Available study block",
        reason: `Open time before ${event.title}.`,
      });
    }

    if (eventEnd > cursor) {
      cursor = eventEnd;
    }
  }

  const finalOpenMinutes = minutesBetween(cursor, window.end);

  if (finalOpenMinutes >= resolvedOptions.minimumDurationMinutes) {
    suggestions.push({
      id: `study-${toBase64Url(textEncoder.encode(`${cursor.toISOString()}-${window.end.toISOString()}`))}`,
      start: cursor.toISOString(),
      end: window.end.toISOString(),
      durationMinutes: finalOpenMinutes,
      label: "Available study block",
      reason: "Open time after scheduled calendar events.",
    });
  }

  return suggestions.slice(0, resolvedOptions.maxSlots);
};

export const getGoogleCalendarSessionCookieName = () => SESSION_COOKIE_NAME;
export const getGoogleCalendarOauthCookieName = () => OAUTH_COOKIE_NAME;
export const getGoogleCalendarSessionCookie = (value: string, maxAgeSeconds = SESSION_TTL_SECONDS) =>
  serializeCookie(SESSION_COOKIE_NAME, value, maxAgeSeconds);
export const getGoogleCalendarOauthCookie = (value: string, maxAgeSeconds = OAUTH_TTL_SECONDS) =>
  serializeCookie(OAUTH_COOKIE_NAME, value, maxAgeSeconds);
export const getGoogleCalendarClearSessionCookie = () => clearCookie(SESSION_COOKIE_NAME);
export const getGoogleCalendarClearOauthCookie = () => clearCookie(OAUTH_COOKIE_NAME);

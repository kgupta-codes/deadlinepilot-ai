# DeadlinePilot AI

DeadlinePilot AI is an AI productivity companion for the Google AI Hackathon. It helps users choose what to work on next, reduce deadline risk, and recover when their schedule becomes overloaded.

## Architecture

```text
Next.js App Router
  app/page.tsx
    hooks/useAuth.ts          -> Firebase Auth session
    hooks/useDeadlines.ts     -> authenticated deadline API calls, form state, filters
    hooks/useAI.ts            -> Gemini request with local fallback
    hooks/useSidebar.ts       -> section navigation and active state
    hooks/useDashboard.ts     -> memoized agent-derived dashboard data

  components/dashboard/*      -> dashboard sections and workflow components
  components/*                -> shared presentational cards
  lib/agent/*                 -> pure TypeScript planning engine
  lib/integrations/google.ts  -> Google integration registry
  lib/integrations/googleCalendar.ts -> Google Calendar auth and event service
  src/services/deadlines.ts   -> typed deadline API client
  app/api/capture/route.ts    -> authenticated natural-language extraction endpoint
  app/api/deadlines/*         -> authenticated Firestore persistence endpoints
  app/api/analyze/route.ts    -> local agent analysis endpoint
```

`app/page.tsx` composes the product shell only. Business rules live in `lib/agent`, API clients live in `src/services`, server-side persistence lives in `app/api` and `lib/server`, and UI state lives in hooks.

## Folder Structure

- `app/` Next.js routes and API handlers
- `components/dashboard/` dashboard-specific sections, filters, and workspace UI
- `components/` reusable presentational cards
- `hooks/` client-side orchestration for auth, deadlines, AI, dashboard data, and navigation
- `lib/agent/` modular local AI planning engine
- `lib/integrations/` typed integration extension points
- `src/lib/` Firebase initialization
- `src/services/` Firestore service layer

## Agent Architecture

- `priorityEngine.ts` focus-task selection and task ordering
- `riskEngine.ts` deadline risk, urgent task detection, and stress scoring
- `scheduleEngine.ts` workload, completion probability, daily mission, and weekly mission
- `recoveryEngine.ts` recovery plans, overload detection, conflicts, and postponement suggestions
- `coachEngine.ts` local coach advice, procrastination detection, and fallback insight generation
- `analyticsEngine.ts` productivity score, completion rate, pressure, and dashboard metrics
- `helpers.ts` shared date, priority, status, and formatting utilities
- `types.ts` shared agent domain types

All agent modules are pure TypeScript and contain no React or Firebase dependencies.

## Data Flow

```text
Firebase Auth -> useAuth -> page.tsx
Firestore -> app/api/deadlines -> src/services/deadlines.ts -> useDeadlines -> useDashboard
useDashboard -> lib/agent engines -> dashboard components
Capture -> useCapture -> /api/capture -> Gemini extraction or offline fallback -> review -> /api/deadlines
Analyze button -> useAI -> /api/analyze -> local agent plan
Sidebar clicks -> useSidebar -> anchored dashboard sections
```

## Capture Extraction

`/api/capture` is authenticated and currently accepts natural-language input only. It uses Gemini structured JSON extraction when `GEMINI_API_KEY` is configured on the server. Gemini output is parsed and validated against the academic extraction Zod schema before the UI receives drafts.

If Gemini is unavailable or validation fails, the server falls back to the offline rules extractor. Drafts must be reviewed before saving. Missing dates, unresolved date ambiguity, unresolved extraction ambiguity, and unreviewed low-confidence drafts are blocked before they can be written through `/api/deadlines`.

PDF, screenshot, Gmail, and voice capture are visible as disabled future sources only; they are not implemented in this milestone.

## Google Technology Readiness

- Firebase Authentication: active
- Firestore: active through authenticated API routes with server-side owner checks
- Gemini API: optional server-side capture extraction with offline fallback
- Google Calendar: configured integration boundary with OAuth-backed session handling
- Google OAuth: delegated access path for Calendar integration
- Cloud Run: planned deployment target
- Firebase Hosting: planned deployment target
- Vertex AI: future managed AI upgrade path

## Setup

1. Install dependencies with `npm install`.
2. Add Firebase public environment variables in `.env.local`.
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. Add Firebase Admin server environment variables for authenticated API routes:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
4. Optionally add server-only `GEMINI_API_KEY` for Gemini capture extraction.
4. Add Google Calendar environment variables if you want Calendar sync:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_COOKIE_SECRET`
5. Run `npm run dev`.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`

## Remaining Production Hardening

- Add indexed Firestore ordering and pagination for larger datasets.
- Add Google Calendar API sync scopes and consent screen values in Google Cloud.
- Add deployment configuration for Cloud Run or Firebase Hosting.

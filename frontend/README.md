# DeadlinePilot AI

DeadlinePilot AI is an AI productivity companion for the Google AI Hackathon. It helps users choose what to work on next, reduce deadline risk, and recover when their schedule becomes overloaded.

## Architecture

```text
Next.js App Router
  app/page.tsx
    hooks/useAuth.ts          -> Firebase Auth session
    hooks/useDeadlines.ts     -> Firestore CRUD, form state, filters
    hooks/useAI.ts            -> Gemini request with local fallback
    hooks/useSidebar.ts       -> section navigation and active state
    hooks/useDashboard.ts     -> memoized agent-derived dashboard data

  components/dashboard/*      -> dashboard sections and workflow components
  components/*                -> shared presentational cards
  lib/agent/*                 -> pure TypeScript planning engine
  lib/integrations/google.ts  -> Google integration registry
  lib/integrations/googleCalendar.ts -> Google Calendar auth and event service
  src/services/deadlines.ts   -> typed Firestore persistence
  app/api/analyze/route.ts    -> optional Gemini analysis endpoint
```

`app/page.tsx` composes the product shell only. Business rules live in `lib/agent`, data access lives in `src/services`, and UI state lives in hooks.

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
Firestore -> src/services/deadlines.ts -> useDeadlines -> useDashboard
useDashboard -> lib/agent engines -> dashboard components
Analyze button -> useAI -> /api/analyze -> Gemini or local fallback
Sidebar clicks -> useSidebar -> anchored dashboard sections
```

## Local AI Fallback

Gemini is optional. `/api/analyze` normalizes the incoming deadline payload, uses Gemini only when `GEMINI_API_KEY` is configured, and returns `generateLocalInsight()` when Gemini is unavailable or fails. The dashboard itself never depends on Gemini because Mission Control, Recovery Plan, Today’s Plan, Calendar, and AI Coach all receive local agent output from `lib/agent`.

## Google Technology Readiness

- Firebase Authentication: active
- Firestore: active with typed models and owner checks in the client service
- Gemini API: optional server-side integration with local fallback
- Google Calendar: configured integration boundary with OAuth-backed session handling
- Google OAuth: delegated access path for Calendar integration
- Cloud Run: planned deployment target
- Firebase Hosting: planned deployment target
- Vertex AI: future managed AI upgrade path

## Setup

1. Install dependencies with `npm install`.
2. Add Firebase public environment variables in `.env.local`.
3. Optionally add `GEMINI_API_KEY` for Gemini analysis.
4. Add Google Calendar environment variables if you want Calendar sync:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_COOKIE_SECRET`
4. Run `npm run dev`.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Remaining Production Hardening

- Add Firestore security rules for owner-scoped reads and writes.
- Add indexed Firestore ordering and pagination for larger datasets.
- Add Google Calendar API sync scopes and consent screen values in Google Cloud.
- Add deployment configuration for Cloud Run or Firebase Hosting.

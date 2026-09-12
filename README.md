# Deadline Pilot AI

**Turn a messy student deadline into a realistic, reviewable plan before it becomes a crisis.**

Deadline Pilot AI is a HackDays-ready student planning MVP. Gemini understands natural-language deadline descriptions; deterministic application engines validate dates and effort, assess risk and workload, and create the plan that the student can accept.

## Problem and solution

Students often know *what* is due but not the next actionable step. A vague note such as “Engineering Mechanics assignment due Monday, about five hours, not started” is hard to turn into a reliable schedule.

Deadline Pilot converts it into a reviewed deadline, calculates capacity and risk from real task and calendar data, distributes work into short sessions, and stores the accepted plan. It is intentionally not an AI chatbot that invents a schedule.

```text
Messy student input → Gemini extraction → schema/date validation → Firestore deadline
→ deterministic risk + workload → deterministic sessions → accept → persisted plan
```

## Gemini’s role

The server-only Gemini integration extracts structured academic deadlines, preserves evidence and uncertainty, and returns a confidence score. Responses are constrained to JSON, validated with Zod, normalized by deterministic date logic, and fall back to a local rules extractor when Gemini is unavailable. Gemini does not decide dates, risk scores, capacity, or sessions.

## Core MVP flow

1. Sign in with Firebase Auth.
2. Capture natural language in the Capture workspace.
3. Review and correct the editable extracted deadline; ambiguous or low-confidence data is blocked until reviewed.
4. Save the deadline through authenticated API routes.
5. Review workload, risk, and deterministic work sessions in the AI Command Center.
6. Accept the feasible plan. The server validates task ownership and transactionally upserts that day’s accepted plan, preventing duplicate plans from repeated clicks.

## Tech and architecture

- Next.js 16, TypeScript, React, Tailwind CSS
- Firebase Auth and Firestore
- Firebase Admin using Application Default Credentials on the server
- Google Gemini API, server-side only
- Pure TypeScript risk, workload, planner, recovery, and analytics engines
- Google Calendar integration boundary for calendar-aware availability

Firestore client rules restrict deadline and accepted-plan documents to their owning authenticated user. API routes also verify Firebase ID tokens and validate all writes.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local` with public Firebase web configuration:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

For authenticated server API routes, configure ADC (`gcloud auth application-default login`) and `FIREBASE_PROJECT_ID` (or the public project ID). To enable Gemini extraction, set server-only `GEMINI_API_KEY`. Calendar OAuth is optional; see [frontend/README.md](frontend/README.md).

Deploy Firestore rules with the Firebase CLI after reviewing `firestore.rules` for the target project.

## Verification

```bash
cd frontend
npx tsc --noEmit
npm test
npm run lint
npm run build
```

## Demo script

Capture: “I have my Engineering Mechanics assignment due Monday. I haven't started and it will take about 5 hours.” Review the extracted record, save it, then show the risk/capacity explanation and four short deterministic work sessions. Select **Accept Plan** to persist them.

## Scope and limitations

- Gemini and Firebase persistence require the configured external services; extraction safely falls back to local rules when Gemini is unavailable.
- Calendar connection remains optional and depends on configured Google OAuth credentials.
- The MVP persists accepted sessions as a plan snapshot. Creating native Google Calendar events is an explicit next integration step.

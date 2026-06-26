# DeadlinePilot AI Blueprint

This document is the architectural source of truth for DeadlinePilot AI.

It defines the product, system boundaries, data flow, component model, planner contract, AI contract, and implementation standards for all future work.

The core rule is stable:

- The deterministic planner decides.
- Gemini explains, extracts, summarizes, and reasons over planner output.
- UI presents the decisions clearly.
- Firebase provides identity, persistence, and sync.

No future feature should violate that separation.

---

## 1. Product Vision

### What DeadlinePilot AI is

DeadlinePilot AI is an AI-first productivity operating system for people who manage real deadlines, calendar constraints, study sessions, and changing workloads.

It is not a task list, not a notes app, and not a dashboard of unrelated cards. It is a planning system that:

- captures work from multiple sources,
- interprets deadlines and urgency,
- evaluates calendar capacity,
- computes risk and recovery options,
- recommends what to do next,
- explains why that recommendation was chosen,
- adapts as the user’s schedule changes.

### Target user

The primary user is a student, founder, builder, or knowledge worker who:

- has multiple deadlines,
- works around a calendar,
- needs help prioritizing,
- wants an AI partner that can reason over constraints,
- prefers concise guidance over generic productivity dashboards.

Secondary users include teams and hackathon judges who want to see a polished, production-grade demonstration of Google’s AI ecosystem.

### Core workflow

The product follows a stable loop:

1. Capture work from text, files, calendar context, and future integrations.
2. Understand the work by structuring it into deadlines, estimates, categories, and metadata.
3. Prioritize it using the deterministic planner.
4. Schedule it against real calendar availability.
5. Execute with a clear next action and focus block.
6. Adapt when deadlines shift, calendar changes, or workload grows.
7. Reflect through analytics, planner accuracy, and history.

### How it differs from traditional task managers

Traditional task managers store items and let users sort them manually.

DeadlinePilot AI instead:

- computes urgency and risk automatically,
- understands calendar capacity,
- recommends a daily mission,
- builds a recovery plan when overloaded,
- explains tradeoffs in plain language,
- treats tasks as planning inputs rather than static checklist items,
- supports structured AI extraction without giving up deterministic control.

The UI should never feel like a list of cards. It should feel like a single intelligent planning system.

---

## 2. Complete System Architecture

### Frontend

The frontend is the orchestration layer for the user experience.

Responsibilities:

- authentication state and login flow,
- workspace navigation,
- dashboard composition,
- capture and deadline management UI,
- calendar visibility and approval flows,
- analytics presentation,
- AI assistant presentation,
- accessibility, responsiveness, and interaction design.

Current implementation anchors:

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/dashboard/*`
- `hooks/*`

### Backend

The backend is a small API surface that supports:

- Gemini analysis requests,
- Google Calendar OAuth connect/callback/status/disconnect flows,
- future capture ingestion endpoints,
- future AI extraction and summarization endpoints.

Current implementation anchors:

- `app/api/analyze/route.ts`
- `app/api/google-calendar/*`

### Planner Engine

The planner engine is the deterministic decision core.

It consumes deadlines and calendar events and produces:

- prioritized tasks,
- selected mission,
- study slot suggestions,
- conflict detection,
- recovery plan,
- execution advice,
- planner metrics.

Planner output must remain deterministic and testable.

Current implementation anchors:

- `lib/agent/plannerEngine.ts`
- `lib/agent/priorityEngine.ts`
- `lib/agent/riskEngine.ts`
- `lib/agent/recoveryEngine.ts`
- `lib/agent/executionEngine.ts`
- `lib/agent/scheduleEngine.ts`
- `lib/agent/calendarPlanner.ts`
- `lib/agent/analyticsEngine.ts`

### AI Layer

The AI layer is a reasoning and extraction layer built around Gemini.

Its purpose is to:

- convert unstructured input into structured tasks,
- explain planner outputs,
- summarize planner state,
- analyze images and files,
- answer planner-aware questions,
- generate human-friendly narratives.

It must not choose the plan instead of the planner.

### Firebase

Firebase is the identity and persistence backbone.

Responsibilities:

- user authentication,
- Firestore persistence,
- file storage for uploads,
- future notification delivery,
- support for secure per-user data access.

Current implementation anchors:

- `src/lib/firebase.ts`
- `src/services/auth.ts`
- `src/services/deadlines.ts`

### Firestore

Firestore is the canonical data store for user work, planner state, preferences, caches, and history.

It should remain the source of truth for:

- deadlines/tasks,
- user preferences,
- planner snapshots,
- AI metadata,
- capture history,
- calendar cache snapshots,
- user-visible activity logs.

### Calendar

Google Calendar is the real-world capacity source.

Responsibilities:

- read events, classes, meetings, and busy blocks,
- derive available study windows,
- surface conflicts,
- allow AI-generated study sessions only after user approval,
- never overwrite existing user events.

Current implementation anchors:

- `lib/integrations/googleCalendar.ts`
- `app/api/google-calendar/*`

### Future integrations

The architecture must naturally accept:

- Gmail import,
- Google Drive import,
- Google Tasks sync,
- Firebase Cloud Messaging,
- Speech-to-Text capture,
- Google Docs / Sheets derived workflows.

Every integration should feed the same capture -> normalize -> planner pipeline.

### Interaction model

The canonical interaction stack is:

User data and external sources
-> Firebase / Calendar / future integrations
-> Capture normalization
-> Firestore persistence
-> Planner Engine
-> Context Builder
-> Gemini reasoning or extraction
-> UI explanation
-> User action

The UI never bypasses the planner for operational decisions.

---

## 3. Folder Structure

The finished project should converge toward the following structure:

```text
app/
  api/
  layout.tsx
  page.tsx
  globals.css

components/
  dashboard/
  capture/
  calendar/
  assistant/
  analytics/
  deadlines/
  shared/
  ui/

hooks/
  useAuth.ts
  useDeadlines.ts
  useGoogleCalendar.ts
  useDashboard.ts
  useSidebar.ts
  useAI.ts
  future hooks...

lib/
  agent/
  ai/
  integrations/
  planner/
  calendar/
  utils/

src/
  lib/
  services/

docs/
```

### Why each folder exists

- `app/`: Next.js routes, layouts, and server endpoints.
- `components/dashboard/`: the workspace shell, command center, and dashboard-specific composition.
- `components/capture/`: future intake components for natural language, files, screenshots, and voice.
- `components/calendar/`: calendar views, conflict summaries, and approval UI.
- `components/assistant/`: future planner-aware AI assistant components.
- `components/analytics/`: trend and productivity visualizations.
- `components/deadlines/`: CRUD and management surfaces for tasks.
- `components/shared/`: reusable layout blocks and empty states.
- `components/ui/`: primitives such as buttons, chips, cards, inputs, modals.
- `hooks/`: client orchestration and state derivation.
- `lib/agent/`: deterministic planner logic.
- `lib/ai/`: future Gemini service, context builders, and response parsing.
- `lib/integrations/`: Google-specific integration adapters.
- `lib/planner/`: optional future refactor target if planner modules are split further.
- `lib/calendar/`: calendar-specific domain helpers if needed.
- `lib/utils/`: generic pure utilities.
- `src/lib/`: Firebase initialization and environment wiring.
- `src/services/`: persistence and service-layer functions.
- `docs/`: architecture and product references.

### Structure principles

- Prefer flat, feature-oriented grouping over deep nesting.
- Keep deterministic planner code separate from React code.
- Keep AI code separate from planner code.
- Keep service code separate from UI code.
- Avoid duplicate exports and barrel files that obscure ownership.

---

## 4. Planner Architecture

The planner is the brain. It must remain deterministic.

### `plannerEngine`

Responsibility:

- orchestrate the planner pipeline,
- combine calendar study slots, conflicts, prioritization, and recovery planning,
- produce a single `AgenticDayPlan` snapshot.

Inputs:

- deadlines,
- calendar events,
- current time.

Outputs:

- mission,
- conflicts,
- study slots,
- recovery plan,
- priority ranking,
- decision log.

### `priorityEngine`

Responsibility:

- rank tasks by urgency, deadline proximity, priority, and execution state,
- calculate focus task insights,
- produce an ordered list of work items.

### `riskEngine`

Responsibility:

- classify task risk,
- identify overdue and near-due items,
- explain why a task is high risk.

### `recoveryEngine`

Responsibility:

- detect overload,
- detect deadline conflicts,
- suggest postponements,
- produce recovery advice when the workload exceeds capacity.

### `executionEngine`

Responsibility:

- transform ranked tasks into today’s mission,
- compute the selected mission confidence,
- build the top-level recovery plan from the ranking and study slots.

### `scheduleEngine`

Responsibility:

- estimate workload hours,
- compute completion probability,
- build daily and weekly missions.

### `calendarPlanner`

Responsibility:

- derive study slots from calendar availability,
- detect calendar conflicts,
- build timeline entries that merge events and study blocks,
- estimate available hours around the calendar.

### Planner rules

- The planner never calls Gemini.
- The planner never depends on prompt output.
- Planner outputs must be serializable, deterministic, and easy to test.
- Planner decisions should be explainable by the AI layer later, not replaced by it.

---

## 5. AI Architecture

The AI layer should be future-ready and strictly layered on top of the planner.

### Core modules

#### Context Builder

Builds a structured AI context from:

- planner output,
- deadlines,
- calendar state,
- user preferences,
- capture metadata,
- history and analytics.

Its output should be typed JSON, not ad hoc text.

#### Prompt Builder

Transforms structured context into prompt templates for:

- extraction,
- summarization,
- explanation,
- vision analysis,
- chat responses,
- weekly planning.

Prompt templates should be versioned.

#### Gemini Service

Handles:

- model selection,
- request execution,
- timeout and retry policy,
- request tracing,
- fallback behavior,
- response normalization.

It should support Gemini 2.5 Flash for fast extraction and Gemini Pro for deeper reasoning when needed.

#### Response Parser

Validates Gemini responses and converts them into typed application data.

It must:

- reject malformed outputs,
- enforce schema constraints,
- map responses into safe application models,
- preserve raw response payloads for debugging if needed.

#### Reasoning Layer

This is the bridge between planner output and user-facing explanation.

It should support:

- mission explanation,
- conflict explanation,
- recovery explanation,
- plan regeneration rationale,
- answer generation for the assistant.

#### Vision Layer

Handles image and PDF-like inputs later on.

Responsibilities:

- analyze screenshots,
- analyze uploaded documents,
- extract deadlines, dates, task titles, and context,
- produce normalized capture records for the planner.

### How planner outputs become Gemini prompts

1. The planner produces a deterministic snapshot.
2. The context builder converts the snapshot into typed structured context.
3. The prompt builder creates a task-specific prompt from that context.
4. Gemini returns an explanation or extraction result.
5. The parser validates and normalizes the response.
6. The UI renders the explanation as a human-readable decision support layer.

### Non-negotiable rule

Gemini may explain why a plan exists.
Gemini may help structure unstructured input.
Gemini may summarize or reason over data.

Gemini must never replace planner decisions for scheduling, prioritization, or risk scoring.

---

## 6. Google Technologies

### Gemini

Use cases:

- natural language capture,
- task extraction,
- mission explanation,
- scheduling explanation,
- summarization,
- assistant answers,
- weekly planning narratives.

### Gemini Vision

Use cases:

- screenshot extraction,
- PDF understanding,
- photo-to-task conversion,
- deadline detection from artifacts,
- document summarization.

### Firebase Authentication

Use cases:

- Google sign-in,
- session persistence,
- secure user identity,
- ownership checks for user-specific data.

### Firestore

Use cases:

- canonical deadline/task storage,
- planner state persistence,
- user preferences,
- capture history,
- analytics caches,
- AI metadata,
- audit and activity history.

### Firebase Storage

Use cases:

- PDF uploads,
- screenshot uploads,
- optional audio uploads,
- future Drive-like attachment staging.

### Google Calendar

Use cases:

- read events,
- detect busy blocks,
- derive study availability,
- propose study sessions,
- write only after user approval,
- maintain non-destructive behavior.

### Gmail

Future use cases:

- import deadlines from email,
- detect assignment confirmations,
- extract due dates from message threads,
- surface actionable emails in the capture pipeline.

### Google Drive

Future use cases:

- ingest docs, syllabi, PDFs, project briefs,
- support file-based deadline extraction,
- attach source documents to tasks.

### Firebase Cloud Messaging

Future use cases:

- smart deadline reminders,
- schedule change notifications,
- daily briefing notifications,
- critical risk alerts.

### Speech-to-Text

Future use cases:

- voice capture,
- spoken task creation,
- hands-free quick capture,
- meeting note conversion.

### Expansion principle

Every future Google integration should enter through the same ingestion boundary:

source -> normalize -> enrich -> persist -> plan -> explain -> notify

---

## 7. User Flow

### Dashboard

Purpose:

- present the AI Command Center,
- show the current mission,
- show calendar and risk context,
- allow plan acceptance and explanation requests later.

User flow:

- user lands on the dashboard after login,
- sees today’s mission and schedule context,
- sees top priorities and risk summary,
- navigates to Capture, Deadlines, Calendar, AI Assistant, Analytics, or Settings as needed.

### Capture

Purpose:

- gather new work from natural language and future file inputs.

User flow:

- user enters or uploads work,
- system normalizes it into a structured deadline/task,
- task is stored in Firestore,
- planner updates automatically.

### Deadlines

Purpose:

- manage source-of-truth task records.

User flow:

- search, filter, edit, delete,
- inspect deadline metadata,
- keep tasks organized and accurate.

### Calendar

Purpose:

- expose real calendar context,
- show conflicts and available work windows,
- support proposed study sessions.

User flow:

- user connects Google Calendar,
- system reads events,
- planner derives free time and conflicts,
- AI-generated study sessions can later be approved and written.

### AI Assistant

Purpose:

- answer schedule-aware questions.

User flow:

- user asks about workload, mission, timing, or risk,
- assistant reads planner, deadlines, calendar, and analytics,
- assistant returns context-aware answers.

### Analytics

Purpose:

- show meaningful productivity signals.

User flow:

- user reviews completion trends, workload, risk, study hours, and calendar utilization,
- user uses trends to understand planner accuracy and habits.

### Settings

Purpose:

- manage identity, integrations, preferences, and sign-out.

User flow:

- user checks account and workspace settings,
- toggles future preferences,
- disconnects integrations when needed.

### Navigation model

- Dashboard is the landing experience.
- Sidebar navigation moves between the seven workspaces.
- Each workspace has a single responsibility.
- No workspace should duplicate another workspace’s main information.

---

## 8. Data Flow

### Natural language

1. User types a task or plan.
2. Future capture pipeline normalizes the input.
3. Gemini extraction converts it to structured task data.
4. The task is stored in Firestore.
5. The deterministic planner recalculates the plan.
6. The AI Command Center updates with the new mission and risk context.
7. The user sees the change immediately.

### PDF

1. User uploads a PDF.
2. Firebase Storage stores the file.
3. Gemini Vision or document reasoning extracts dates, tasks, and deadlines.
4. A structured capture result is created.
5. Firestore stores the task and its metadata.
6. Planner refreshes.

### Screenshot

1. User uploads a screenshot.
2. Firebase Storage stores the image.
3. Gemini Vision extracts the relevant deadline or action item.
4. Capture parser normalizes the result.
5. Firestore persists the task.
6. Planner recalculates.

### Calendar

1. App loads Google Calendar events.
2. Calendar integration returns busy blocks and event metadata.
3. Planner computes study slots, conflicts, and available time.
4. AI Command Center shows mission, risk, and capacity context.
5. If a study session is approved later, it is written non-destructively.

### Canonical data loop

User input or external source
-> capture normalization
-> Firestore
-> planner
-> AI explanation layer
-> UI
-> user action

This loop must stay intact.

---

## 9. Feature Roadmap

### Milestone 1: AI Command Center

Purpose:

- establish the homepage as a single intelligent system.

Files involved:

- `app/page.tsx`
- `components/dashboard/AICommandCenter.tsx`
- `components/dashboard/DashboardGrid.tsx`
- `hooks/useDashboard.ts`

Dependencies:

- planner output,
- auth state,
- calendar state.

Risks:

- duplicate information,
- overloading the hero with too many widgets,
- weak separation between planner data and display data.

Testing:

- lint,
- TypeScript,
- production build,
- visual inspection of dashboard hierarchy.

Completion criteria:

- dashboard reads as one command center,
- no duplicate planner widgets,
- no Gemini dependency.

### Milestone 2: Capture Hub

Purpose:

- create structured capture from natural language first.

Files involved:

- `components/capture/*`
- `lib/ai/*`
- `app/api/capture/*`
- `src/services/*`

Dependencies:

- Firestore schema extension,
- Gemini extraction contract,
- upload storage path design.

Risks:

- parsing ambiguity,
- source attribution loss,
- bad task normalization.

Testing:

- parser tests,
- schema validation,
- upload flow tests.

Completion criteria:

- text input creates structured task records,
- source metadata is preserved.

### Milestone 3: Vision Capture

Purpose:

- support PDF and screenshot extraction.

Files involved:

- `components/capture/*`
- `lib/ai/vision/*`
- `src/services/storage/*`

Dependencies:

- Firebase Storage,
- Gemini Vision,
- capture schema.

Risks:

- OCR ambiguity,
- file size handling,
- upload security.

Testing:

- sample file fixtures,
- extraction snapshots,
- storage permission checks.

Completion criteria:

- uploaded files become structured captures with source metadata.

### Milestone 4: AI Assistant

Purpose:

- provide planner-aware questions and explanations.

Files involved:

- `components/assistant/*`
- `lib/ai/chat/*`
- `app/api/assistant/*`

Dependencies:

- context builder,
- planner snapshot,
- response parser.

Risks:

- chatbot drift,
- answering without data,
- mixing opinion with plan output.

Testing:

- context tests,
- prompt tests,
- response schema tests.

Completion criteria:

- assistant answers from actual planner state.

### Milestone 5: Analytics Expansion

Purpose:

- turn analytics into evidence-based planning feedback.

Files involved:

- `components/analytics/*`
- `lib/agent/analyticsEngine.ts`

Dependencies:

- planner history,
- completion tracking,
- session history.

Risks:

- noisy metrics,
- misleading charts.

Testing:

- metric snapshot tests,
- zero-data rendering tests.

Completion criteria:

- analytics explain planner quality and work trends.

### Milestone 6: Notifications and Adaptation

Purpose:

- add FCM-driven reminders and schedule changes.

Files involved:

- `lib/notifications/*`
- `app/api/notifications/*`
- `hooks/*`

Dependencies:

- Firebase Cloud Messaging,
- user preferences,
- planner updates.

Risks:

- notification fatigue,
- stale schedule data.

Testing:

- delivery rules,
- preference gating,
- quiet hours.

Completion criteria:

- notifications are contextual and user-controlled.

---

## 10. Component Architecture

### Dashboard group

- `AICommandCenter`: homepage decision surface.
- `DashboardGrid`: layout wrapper for the dashboard section.
- `Sidebar`: workspace navigation.

### Capture group

- `CaptureWorkspace`: intake and upload entry point.
- Future `NaturalLanguageCapture`: structured text capture.
- Future `UploadCapture`: file intake and preview.
- Future `CaptureSourceBadge`: display source metadata.

### Deadlines group

- `DeadlineWorkspace`: search/filter/edit/delete view.
- `DeadlineFilters`: filter controls.
- `EmptyState`: reusable no-data message.

### Calendar group

- `CalendarSection`: dashboard wrapper for calendar integration.
- `CalendarPanel`: calendar state, event list, conflicts, study slots.
- Future `CalendarApprovalPanel`: approve generated study sessions.

### Assistant group

- `AssistantWorkspace`: context-aware assistant shell.
- Future `AssistantThread`: conversational interaction.
- Future `AssistantAnswer`: structured assistant response rendering.

### Analytics group

- `AnalyticsWorkspace`: analytics shell.
- Future `TrendChart`: planner and completion trend chart.
- Future `RiskDistribution`: risk breakdown.

### Settings group

- `SettingsSection`: account and workspace settings.
- Future `IntegrationSettings`: provider management.

### Shared group

- `SectionContainer`: layout spacing utility.
- `EmptyState`: reusable empty state.
- Future `StatusPill`: consistent state badges.
- Future `PrimaryButton`, `SecondaryButton`, `GhostButton`.

### UI principles for components

- Every component should own a single job.
- Components should receive typed props.
- Presentation and state derivation should remain separated.
- Reusable building blocks should live in `components/shared/` or `components/ui/`.

---

## 11. Hook Architecture

### Existing hooks

#### `useAuth`

Responsibility:

- Firebase auth session,
- login,
- logout,
- auth state messaging.

#### `useDeadlines`

Responsibility:

- Firestore deadline CRUD,
- local form state,
- filtering,
- editing,
- refresh orchestration.

#### `useGoogleCalendar`

Responsibility:

- calendar connection state,
- event loading,
- conflict detection,
- study slot derivation.

#### `useDashboard`

Responsibility:

- combine planner output with dashboard metrics,
- produce a single snapshot for the UI.

#### `useSidebar`

Responsibility:

- workspace navigation,
- active section tracking,
- scroll-based highlighting.

#### `useAI`

Responsibility:

- current deadline analysis request flow,
- local fallback insight generation,
- future Gemini request orchestration.

### Future hooks

#### `useCapture`

Responsibility:

- manage capture input state,
- submit captures,
- track upload/extraction status.

#### `usePlannerContext`

Responsibility:

- prepare planner snapshot for Gemini prompts and assistant responses.

#### `useAssistant`

Responsibility:

- manage assistant chat state,
- route planner-aware questions.

#### `useAnalytics`

Responsibility:

- load and derive product metrics,
- memoize expensive trend calculations.

#### `useNotifications`

Responsibility:

- handle user notification preferences,
- schedule reminder subscriptions.

### Hook rules

- Hooks should never contain UI markup.
- Hooks should return typed state and actions.
- Hooks should not encode planner business logic.
- Expensive derived values should be memoized when needed.

---

## 12. Firestore Schema

The schema should keep `deadlines` as the canonical task collection while adding planner, preference, history, and metadata support.

### `deadlines`

Collection: `deadlines`

Purpose:

- canonical task records.

Recommended fields:

- `userId: string`
- `title: string`
- `dueDate: string`
- `priority: "High" | "Medium" | "Low"`
- `status: "Not Started" | "In Progress" | "Completed"`
- `estimatedHours: number | null`
- `category: string | null`
- `notes: string | null`
- `origin: "manual" | "natural_language" | "pdf" | "screenshot" | "gmail" | "calendar" | "drive" | "voice"`
- `aiMetadata: object`
- `createdAt: timestamp`
- `updatedAt: timestamp`

### `users`

Collection: `users`

Document ID: user uid

Purpose:

- user-scoped preferences and app state.

Fields:

- `displayName`
- `email`
- `timezone`
- `createdAt`
- `lastActiveAt`

### `users/{uid}/preferences/main`

Purpose:

- user settings and planner preferences.

Fields:

- `workingHours`
- `studyHours`
- `notificationPreferences`
- `calendarSyncEnabled`
- `riskTolerance`
- `defaultPriority`
- `theme`

### `users/{uid}/planner/current`

Purpose:

- latest planner snapshot for debugging, caching, and assistant context.

Fields:

- `todayMission`
- `priorityRanking`
- `conflicts`
- `studySlots`
- `decisionLog`
- `generatedAt`

### `users/{uid}/history/{entryId}`

Purpose:

- planner history and completed missions.

Fields:

- `date`
- `mission`
- `confidence`
- `completedTasks`
- `missedTasks`
- `riskSummary`
- `notes`

### `users/{uid}/aiMetadata/{captureId}`

Purpose:

- capture parsing details and model provenance.

Fields:

- `source`
- `inputType`
- `model`
- `extractedEntities`
- `confidence`
- `rawSummary`

### `users/{uid}/calendarCache/main`

Purpose:

- cache latest calendar state for assistant and analytics reads.

Fields:

- `lastSyncedAt`
- `eventCount`
- `busyBlockCount`
- `studyWindowCount`
- `sourceAccount`

### Relationships

- `deadlines` drives the planner.
- `planner/current` is derived from `deadlines` plus calendar events.
- `history` is append-only and derived from planner outcomes.
- `preferences` influence planner and AI context, but not deterministic scheduling rules.
- `aiMetadata` ties external capture sources to task records.
- `calendarCache` supports fast reads and assistant context.

### Schema principles

- Keep writes simple and explicit.
- Avoid duplicating source-of-truth data unless it is a cache.
- Preserve owner scoping on every query and write.
- Do not let AI-generated metadata replace user-authored task data.

---

## 13. Gemini Prompt Strategy

The prompt strategy must be versioned, typed, and task-specific.

### System prompts

System prompts define:

- product identity,
- output format,
- safety constraints,
- planner precedence,
- tone,
- refusal boundaries,
- schema requirements.

### Planner prompts

Purpose:

- explain deterministic planner output.

Inputs:

- planner snapshot,
- task list,
- calendar summary,
- user preferences,
- history.

Output:

- human-readable rationale,
- concise action summary,
- next steps,
- optional structured explanation.

### Vision prompts

Purpose:

- extract dates, deadlines, task names, and contextual clues from images or PDFs.

Output:

- structured extraction JSON,
- source confidence,
- source snippet references if available.

### Chat prompts

Purpose:

- answer user questions about schedule and productivity.

They should reference:

- actual tasks,
- actual calendar availability,
- planner decisions,
- analytics state.

### Extraction prompts

Purpose:

- convert natural language, documents, screenshots, and messages into structured task objects.

Must produce:

- title,
- due date,
- estimate,
- category,
- status,
- notes,
- origin,
- confidence.

### Summarization prompts

Purpose:

- create daily briefs, weekly summaries, mission recaps, and explanation text.

Must remain grounded in planner output and stored data.

### Prompt design rules

- Every prompt should be task-specific.
- Every prompt should have a schema contract.
- Every prompt should avoid raw freeform ambiguity when a structured response is possible.
- Every prompt should preserve planner authority.

---

## 14. Future AI Features

### Natural Language Capture

Integration:

- capture workspace,
- Gemini extraction,
- Firestore tasks,
- planner recalculation.

### PDF Import

Integration:

- Firebase Storage upload,
- Gemini Vision or document extraction,
- task normalization,
- task record creation.

### Screenshot Import

Integration:

- Firebase Storage upload,
- Gemini Vision extraction,
- deadline parsing,
- Firestore write.

### Email Import

Integration:

- Gmail API,
- email parser,
- task suggestion pipeline,
- user approval before persistence.

### Voice Capture

Integration:

- Speech-to-Text,
- natural language parser,
- capture normalization.

### Weekly Planning

Integration:

- planner engine,
- weekly mission generation,
- Gemini summary layer,
- analytics feedback.

### Daily Briefing

Integration:

- planner snapshot,
- calendar overview,
- risk summary,
- concise AI explanation.

### Smart Notifications

Integration:

- Firestore/planner signals,
- Firebase Cloud Messaging,
- user preferences,
- quiet hours.

### Adaptive Scheduling

Integration:

- calendar availability,
- planner recovery plan,
- task urgency,
- approval-based calendar writes.

### Study Recommendations

Integration:

- planner study slots,
- calendar gaps,
- workload estimates,
- risk tolerance,
- user habits.

### Integration principle

Every future AI feature should connect through:

source -> normalization -> Firestore or cache -> deterministic planner -> Gemini explanation or extraction -> UI

---

## 15. Engineering Standards

### TypeScript

- strict typing only,
- no `any`,
- reusable interfaces and types,
- shared types over duplicated ad hoc types,
- narrow unions for statuses and modes.

### Testing

- unit test planner engines,
- unit test parsers and prompt builders,
- test hooks for state transitions,
- test Firestore service contracts,
- test empty states and error states in UI.

### Accessibility

- semantic HTML,
- keyboard navigation,
- visible focus states,
- accessible labels,
- sufficient contrast,
- screen-reader-friendly structure.

### Performance

- memoize expensive derived planner computations,
- avoid unnecessary rerenders,
- lazy load future heavy features,
- keep data transformations pure.

### Responsive design

- desktop-first layout,
- graceful tablet collapse,
- mobile navigation that remains usable,
- no feature hidden behind desktop-only interactions.

### Code style

- prefer small, named pure functions,
- separate presentation from data derivation,
- keep components focused,
- avoid duplicate exports,
- avoid reimplementing shared logic in multiple places.

### Git commits

- use scoped conventional prefixes,
- examples: `feat(ai):`, `feat(capture):`, `refactor(planner):`, `fix(ui):`
- keep commits small and purposeful.

### Documentation

- update the blueprint when architecture changes,
- document new AI prompt contracts,
- document Firestore schema changes,
- document integration boundaries.

---

## 16. Hackathon Strategy

This architecture is designed to win by showing a complete system, not a demo stub.

### What judges should see

- a polished landing experience,
- a command center that feels like an intelligent operating system,
- a deterministic planner making visible choices,
- Google Calendar capacity shaping decisions,
- Firebase-backed identity and persistence,
- a path for Gemini-powered reasoning that does not undermine reliability.

### How it demonstrates Gemini

Gemini is presented as the reasoning and extraction layer:

- it explains mission selection,
- it turns unstructured input into structured tasks,
- it summarizes and clarifies,
- it adds human language around deterministic output.

### How it demonstrates Firebase

Firebase provides:

- secure sign-in,
- durable task storage,
- future file storage,
- future notification infrastructure.

### How it demonstrates Google Calendar

Calendar data is used to:

- derive availability,
- detect conflicts,
- preserve busy blocks,
- plan around real schedule constraints.

### How it demonstrates the Google ecosystem

The product can expand naturally into:

- Gmail import,
- Drive import,
- Tasks sync,
- Notifications,
- Voice capture,
- Vision-based capture.

### Why this is compelling to judges

- It is not just an AI wrapper.
- It has a real deterministic planning core.
- It respects reliability and explainability.
- It is architected for expansion, not a one-off demo.
- It showcases Google’s ecosystem in a credible product shape.

---

## Final Architectural Rules

1. Planner logic stays deterministic.
2. Gemini never replaces the planner.
3. Firebase remains the persistence and auth backbone.
4. Google Calendar remains the schedule source.
5. AI features must be grounded in actual app state.
6. The UI should always present a single intelligent system, not duplicate dashboards.
7. Every new feature must have a place in the blueprint before implementation.

This blueprint is the permanent reference for DeadlinePilot AI.

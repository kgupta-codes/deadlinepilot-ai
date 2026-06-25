export type GoogleIntegrationStatus = "planned" | "configured" | "active";

export type GoogleIntegrationDefinition = {
  id:
    | "firebase-auth"
    | "firestore"
    | "gemini"
    | "google-calendar"
    | "google-oauth"
    | "cloud-run"
    | "firebase-hosting"
    | "vertex-ai";
  label: string;
  status: GoogleIntegrationStatus;
  purpose: string;
};

export const googleIntegrations: GoogleIntegrationDefinition[] = [
  {
    id: "firebase-auth",
    label: "Firebase Authentication",
    status: "active",
    purpose: "Google sign-in and user identity.",
  },
  {
    id: "firestore",
    label: "Firestore",
    status: "active",
    purpose: "Deadline persistence and user-scoped reads.",
  },
  {
    id: "gemini",
    label: "Gemini API",
    status: "configured",
    purpose: "Optional AI analysis with local fallback.",
  },
  {
    id: "google-calendar",
    label: "Google Calendar",
    status: "configured",
    purpose: "OAuth-backed calendar read integration and study-slot planning.",
  },
  {
    id: "google-oauth",
    label: "Google OAuth",
    status: "planned",
    purpose: "Future delegated access for Google Calendar.",
  },
  {
    id: "cloud-run",
    label: "Cloud Run",
    status: "planned",
    purpose: "Future containerized deployment target.",
  },
  {
    id: "firebase-hosting",
    label: "Firebase Hosting",
    status: "planned",
    purpose: "Future web hosting target.",
  },
  {
    id: "vertex-ai",
    label: "Vertex AI",
    status: "planned",
    purpose: "Future managed AI upgrade path.",
  },
];

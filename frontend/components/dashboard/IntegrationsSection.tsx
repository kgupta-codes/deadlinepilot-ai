import { AiSource } from "@/hooks/useAI";
import { googleIntegrations } from "@/lib/integrations/google";

type Props = {
  aiSource: AiSource;
  signedIn: boolean;
};

export default function IntegrationsSection({ aiSource, signedIn }: Props) {
  const integrations = googleIntegrations
    .filter((integration) => integration.id !== "google-oauth")
    .filter((integration) => integration.id !== "vertex-ai")
    .map((integration) => ({
      name: integration.label,
      status:
        integration.id === "firebase-auth"
          ? signedIn
            ? "Connected"
            : "Ready"
          : integration.id === "gemini"
            ? aiSource === "gemini"
              ? "Used"
              : "Optional"
            : integration.status === "configured"
              ? "Configured"
              : integration.status === "active"
                ? "Active"
                : "Planned",
      description: integration.purpose,
    }));

  return (
    <section
      id="integrations"
      className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <h3 className="text-2xl font-bold text-purple-400">Integrations</h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{integration.name}</p>
              <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-300">
                {integration.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-300">
              {integration.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";

import { AgentTask, generateLocalInsight } from "@/lib/agent";
import { type CalendarEvent } from "@/lib/integrations/googleCalendar";

export type AiSource = "local" | "idle";

type AnalyzeResponse = {
  success?: boolean;
  source?: AiSource;
  coachMessage?: string;
  motivation?: string;
  todayMission?: string;
  riskSummary?: string;
  nextAction?: string;
  decisionLog?: string[];
  insight?: string;
};

const formatAnalyzeResponse = (data: AnalyzeResponse) => {
  if (typeof data.coachMessage === "string") {
    return [
      data.coachMessage,
      data.motivation ? `Motivation: ${data.motivation}` : null,
      data.todayMission ? `Today Mission: ${data.todayMission}` : null,
      data.riskSummary ? `Risk Summary: ${data.riskSummary}` : null,
      data.nextAction ? `Next Action: ${data.nextAction}` : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n\n");
  }

  if (typeof data.insight === "string") {
    return data.insight;
  }

  return "";
};

export const useAI = (
  deadlines: AgentTask[],
  calendarEvents: CalendarEvent[] = []
) => {
  const [aiInsight, setAiInsight] = useState("");
  const [aiSource, setAiSource] = useState<AiSource>("idle");
  const [aiLoading, setAiLoading] = useState(false);

  const analyze = async () => {
    setAiLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deadlines,
          calendarEvents,
        }),
      });

      const data = await response.json();
      const analysis = data as AnalyzeResponse;

      if (analysis.success) {
        const formattedInsight = formatAnalyzeResponse(analysis);

        if (formattedInsight) {
          setAiInsight(formattedInsight);
          setAiSource("local");
          return;
        }
      }

      setAiInsight(generateLocalInsight(deadlines));
      setAiSource("local");
    } catch (error) {
      console.error(error);
      setAiInsight(generateLocalInsight(deadlines));
      setAiSource("local");
    } finally {
      setAiLoading(false);
    }
  };

  const resetAI = () => {
    setAiInsight("");
    setAiSource("idle");
  };

  return {
    aiInsight,
    aiLoading,
    aiSource,
    analyze,
    resetAI,
  };
};

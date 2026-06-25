"use client";

import { useState } from "react";

import { AgentTask, generateLocalInsight } from "@/lib/agent";

export type AiSource = "gemini" | "local" | "idle";

export const useAI = (deadlines: AgentTask[]) => {
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
        }),
      });

      const data = await response.json();

      if (data.success && data.insight) {
        setAiInsight(data.insight);
        setAiSource(data.source === "gemini" ? "gemini" : "local");
      } else {
        setAiInsight(generateLocalInsight(deadlines));
        setAiSource("local");
      }
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

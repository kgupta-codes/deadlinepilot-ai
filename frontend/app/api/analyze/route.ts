import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { generateLocalInsight } from "@/lib/agent";

type DeadlineInput = {
  id?: unknown;
  title?: unknown;
  dueDate?: unknown;
  priority?: unknown;
  status?: unknown;
};

const normalizeDeadlines = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 50)
    .map((item, index): DeadlineInput => (item && typeof item === "object" ? item : { id: index }))
    .map((item, index) => ({
      id:
        typeof item.id === "string" && item.id.trim().length > 0
          ? item.id
          : `deadline-${index}`,
      title: typeof item.title === "string" ? item.title : "",
      dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
      priority: typeof item.priority === "string" ? item.priority : "Medium",
      status: typeof item.status === "string" ? item.status : "Not Started",
    }));
};

export async function POST(req: Request) {
  let deadlines: ReturnType<typeof normalizeDeadlines> = [];

  try {
    const body = await req.json().catch(() => ({}));
    deadlines = normalizeDeadlines(body.deadlines);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        source: "local",
        insight: generateLocalInsight(deadlines),
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
You are DeadlinePilot AI, an autonomous productivity agent.

Your goal is to prevent users from missing deadlines.

Analyze these deadlines:

${JSON.stringify(deadlines, null, 2)}

Perform the following:

1. Identify the SINGLE highest-risk task.
2. Explain WHY it is at risk.
3. Rank all tasks in recommended completion order.
4. Create a detailed TODAY'S MISSION.
5. Generate 3 focus blocks for today.
6. Identify deadlines likely to be missed.
7. Suggest recovery actions.
8. Recommend what NOT to work on today.

Format response exactly as:

🚨 HIGHEST RISK TASK
...

🧠 WHY IT IS RISKY
...

🎯 TODAY'S MISSION
1.
2.
3.

⚡ FOCUS BLOCKS
1.
2.
3.

📈 PRIORITY ORDER
1.
2.
3.

🚑 RECOVERY PLAN
...

Keep response under 350 words.
`;

    const result = await model.generateContent(prompt);

    return NextResponse.json({
      success: true,
      source: "gemini",
      insight: result.response.text(),
    });
  } catch (error: unknown) {
    console.error("GEMINI ERROR:", error);

    return NextResponse.json({
      success: true,
      source: "local",
      insight: generateLocalInsight(deadlines),
    });
  }
}

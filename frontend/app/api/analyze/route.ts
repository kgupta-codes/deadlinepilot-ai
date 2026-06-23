import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { deadlines } = await req.json();

console.log(
  "GEMINI KEY:",
  process.env.GEMINI_API_KEY?.slice(0, 10)
);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are an AI productivity coach.

Analyze these deadlines:

${JSON.stringify(deadlines, null, 2)}

Give:
1. Most urgent task
2. Recommended order of completion
3. Tasks at risk
4. Action plan for today

Keep response under 200 words.
`;

    const result = await model.generateContent(prompt);

    return NextResponse.json({
      success: true,
      insight: result.response.text(),
    });
  } 
catch (error: any) {
  console.error("GEMINI ERROR:", error);

  return NextResponse.json({
    success: false,
    insight: error?.message || String(error),
  });
}
}

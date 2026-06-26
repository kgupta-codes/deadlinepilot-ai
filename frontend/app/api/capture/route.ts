import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import {
  buildCapturePrompt,
  CAPTURE_MODEL,
  CAPTURE_PROMPT_VERSION,
  CAPTURE_RESPONSE_SCHEMA,
  type CaptureExtractionRequest,
  validateCaptureExtraction,
} from "@/lib/ai/capture";

type CaptureRequestBody = {
  input?: unknown;
  currentDate?: unknown;
  timeZone?: unknown;
};

const parseCaptureRequest = (body: unknown): CaptureExtractionRequest | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as CaptureRequestBody;

  if (
    typeof candidate.input !== "string" ||
    candidate.input.trim().length === 0 ||
    typeof candidate.currentDate !== "string" ||
    candidate.currentDate.trim().length === 0 ||
    typeof candidate.timeZone !== "string" ||
    candidate.timeZone.trim().length === 0
  ) {
    return null;
  }

  return {
    input: candidate.input.trim(),
    currentDate: candidate.currentDate.trim(),
    timeZone: candidate.timeZone.trim(),
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const captureRequest = parseCaptureRequest(body);

    if (!captureRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a natural-language task description to extract.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gemini is not configured. Add GEMINI_API_KEY to enable capture extraction.",
        },
        { status: 503 }
      );
    }

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: CAPTURE_MODEL,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: CAPTURE_RESPONSE_SCHEMA,
        maxOutputTokens: 512,
      },
      systemInstruction:
        "You are DeadlinePilot AI's capture extraction engine. Return only valid JSON that matches the provided schema.",
    });

    const result = await model.generateContent(
      buildCapturePrompt(captureRequest)
    );

    const text = result.response.text().trim();

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini returned an empty response. Try again.",
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(text) as unknown;
    const extraction = validateCaptureExtraction(parsed);

    if (!extraction) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gemini returned an unexpected format. Please retry with a clearer description.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "gemini",
      promptVersion: CAPTURE_PROMPT_VERSION,
      extraction,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to extract a task from that input.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

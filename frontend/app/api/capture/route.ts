import { NextResponse } from "next/server";

import { extractTask } from "@/src/services/ai";

type CaptureRequestBody = {
  input?: unknown;
};

const parseCaptureRequest = (body: unknown): string | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as CaptureRequestBody;

  if (typeof candidate.input !== "string" || candidate.input.trim().length === 0) {
    return null;
  }

  return candidate.input.trim();
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const input = parseCaptureRequest(body);

    if (!input) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a natural-language task description to extract.",
        },
        { status: 400 }
      );
    }

    const extraction = extractTask(input);

    return NextResponse.json({
      success: true,
      source: extraction.source,
      extraction,
    });
  } catch (error) {
    console.error("Capture Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error,
      },
      { status: 500 }
    );
  }
}

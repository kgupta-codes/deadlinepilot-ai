import { NextResponse } from "next/server";
import { z } from "zod";

import { extractAcademicDeadlines } from "@/lib/ai/captureExtraction";
import { errorResponse } from "@/lib/server/apiResponses";
import { requireFirebaseUser } from "@/lib/server/auth";
import { CAPTURE_MODES } from "@/src/services/ai";

export const runtime = "nodejs";

const captureRequestSchema = z
  .object({
    input: z.string().trim().min(1).max(20_000),
    mode: z.literal("natural_language").default("natural_language"),
    timezone: z.string().trim().max(80).nullable().optional(),
    now: z.string().datetime().optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    await requireFirebaseUser(request);
    const body = await request.json().catch(() => null);
    const input = captureRequestSchema.parse(body);
    const mode = CAPTURE_MODES.find((item) => item.id === input.mode);

    if (!mode?.enabled) {
      return NextResponse.json(
        {
          success: false,
          message: "That capture mode is not supported yet.",
        },
        { status: 400 }
      );
    }

    const now = input.now ? new Date(input.now) : new Date();

    if (Number.isNaN(now.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid current time context.",
        },
        { status: 400 }
      );
    }

    const result = await extractAcademicDeadlines({
      input: input.input,
      timezone: input.timezone ?? null,
      now,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

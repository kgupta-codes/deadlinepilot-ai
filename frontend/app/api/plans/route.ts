import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/server/apiResponses";
import { requireFirebaseUser } from "@/lib/server/auth";
import { acceptPlanForUser, acceptedPlanSchema } from "@/lib/server/planRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const body = await request.json().catch(() => null);
    const input = acceptedPlanSchema.parse(body);
    const plan = await acceptPlanForUser(input, user.uid);

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

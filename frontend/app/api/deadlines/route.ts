import { NextResponse } from "next/server";

import { requireFirebaseUser } from "@/lib/server/auth";
import { errorResponse } from "@/lib/server/apiResponses";
import { deadlineWriteSchema } from "@/lib/server/deadlineValidation";
import {
  createDeadlineForUser,
  listDeadlinesForUser,
} from "@/lib/server/deadlineRepository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const deadlines = await listDeadlinesForUser(user.uid);

    return NextResponse.json({ success: true, deadlines });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const body = await request.json().catch(() => null);
    const input = deadlineWriteSchema.parse(body);
    const deadline = await createDeadlineForUser(input, user.uid);

    return NextResponse.json({ success: true, deadline }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

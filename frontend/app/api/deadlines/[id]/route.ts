import { NextResponse } from "next/server";

import { requireFirebaseUser } from "@/lib/server/auth";
import { errorResponse } from "@/lib/server/apiResponses";
import { deadlineWriteSchema } from "@/lib/server/deadlineValidation";
import {
  deleteDeadlineForUser,
  getDeadlineForUser,
  updateDeadlineForUser,
} from "@/lib/server/deadlineRepository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const getDeadlineId = async (context: RouteContext) => {
  const { id } = await context.params;

  return decodeURIComponent(id);
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireFirebaseUser(request);
    const deadline = await getDeadlineForUser(
      await getDeadlineId(context),
      user.uid
    );

    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireFirebaseUser(request);
    const body = await request.json().catch(() => null);
    const input = deadlineWriteSchema.parse(body);
    const deadline = await updateDeadlineForUser(
      await getDeadlineId(context),
      input,
      user.uid
    );

    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireFirebaseUser(request);

    await deleteDeadlineForUser(await getDeadlineId(context), user.uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

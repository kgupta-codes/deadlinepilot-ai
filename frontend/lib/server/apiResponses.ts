import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiError } from "./auth";

export const validationErrorResponse = (error: ZodError) =>
  NextResponse.json(
    {
      success: false,
      message: "Invalid deadline input.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 }
  );

export const errorResponse = (error: unknown) => {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  console.error("Deadline API Error:", error);

  return NextResponse.json(
    {
      success: false,
      message: "A server error occurred while processing deadlines.",
    },
    { status: 500 }
  );
};

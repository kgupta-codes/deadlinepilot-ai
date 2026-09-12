import "server-only";

import { getAdminAuth } from "./firebaseAdmin";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const requireFirebaseUser = async (request: Request) => {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    throw new ApiError(401, "Authentication is required.");
  }

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (error) {
    console.error(
      "Firebase ID token verification failed:",
      error instanceof Error ? error.message : String(error)
    );
    throw new ApiError(401, "Invalid or expired authentication token.");
  }
};

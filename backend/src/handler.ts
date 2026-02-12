// Single Lambda function handles all API routes. Each route module returns
// null if the path doesn't match, allowing the handler to try the next one.
// This pattern keeps routing simple without a framework dependency.
// Auth is handled per-route (not middleware) because some routes are public.
import type { LambdaEvent, LambdaResponse, CorsHeaders, RouteHandler } from "./types";
import { emptyResponse, getCorsHeaders, jsonResponse } from "./routes/utils";
import { handleProjects } from "./routes/projects";
import { handleSubsystems } from "./routes/subsystems";
import { handleAdmin } from "./routes/admin";
import { handleDrafts } from "./routes/drafts";

const routeModules: RouteHandler[] = [handleProjects, handleSubsystems, handleDrafts, handleAdmin];

// Auth errors throw from verifyAuth(). We detect them by message substring
// to return 401 instead of the default 400. This is intentional — keeping auth
// as a thrown error (not a return value) keeps route handlers clean.
function errorStatus(message: string): number {
  if (
    message.includes("Missing Authorization") ||
    message.includes("Missing Bearer") ||
    message.includes("Invalid token")
  ) {
    return 401;
  }
  return 400;
}

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath;
  const cors: CorsHeaders = getCorsHeaders(event.headers?.origin ?? event.headers?.Origin);

  if (method === "OPTIONS") return emptyResponse(204, cors);

  try {
    for (const handle of routeModules) {
      const response = await handle(method, path, event, cors);
      if (response) return response;
    }
    return jsonResponse(404, { message: "Not found" }, cors);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return jsonResponse(errorStatus(message), { message }, cors);
  }
};

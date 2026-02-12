import type { LambdaEvent, LambdaResponse, CorsHeaders, RouteHandler } from "./types";
import { emptyResponse, getCorsHeaders, jsonResponse } from "./routes/utils";
import { handleProjects } from "./routes/projects";
import { handleSubsystems } from "./routes/subsystems";
import { handleAdmin } from "./routes/admin";
import { handleDrafts } from "./routes/drafts";

const routeModules: RouteHandler[] = [handleProjects, handleSubsystems, handleDrafts, handleAdmin];

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

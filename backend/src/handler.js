import { emptyResponse, getCorsHeaders, jsonResponse } from "./routes/utils.js";
import { handleProjects } from "./routes/projects.js";
import { handleSubsystems } from "./routes/subsystems.js";
import { handleAdmin } from "./routes/admin.js";
import { handleDrafts } from "./routes/drafts.js";

const routeModules = [handleProjects, handleSubsystems, handleDrafts, handleAdmin];

function errorStatus(message) {
  if (
    message.includes("Missing Authorization") ||
    message.includes("Missing Bearer") ||
    message.includes("Invalid token")
  ) {
    return 401;
  }
  return 400;
}

export const handler = async (event) => {
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath;
  const cors = getCorsHeaders(event.headers?.origin ?? event.headers?.Origin);

  if (method === "OPTIONS") return emptyResponse(204, cors);

  try {
    for (const handle of routeModules) {
      const response = await handle(method, path, event, cors);
      if (response) return response;
    }
    return jsonResponse(404, { message: "Not found" }, cors);
  } catch (error) {
    const message = error.message || "Internal error";
    return jsonResponse(errorStatus(message), { message }, cors);
  }
};

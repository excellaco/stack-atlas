import type { CorsHeaders, LambdaEvent, LambdaResponse, User } from "../types";
import { verifyAuth } from "../auth";
import { ensureUserInRegistry } from "../storage";

export const jsonResponse = (
  statusCode: number,
  body: unknown,
  headers: CorsHeaders | Record<string, string> = {}
): LambdaResponse => ({
  statusCode,
  headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", ...headers },
  body: JSON.stringify(body),
});

export const emptyResponse = (
  statusCode: number,
  headers: CorsHeaders | Record<string, string> = {}
): LambdaResponse => ({
  statusCode,
  headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", ...headers },
});

export const getCorsHeaders = (origin: string | undefined): CorsHeaders => {
  const allowList = (process.env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim());
  let allowOrigin = allowList[0] || "*";
  if (allowList.includes("*")) allowOrigin = "*";
  else if (allowList.includes(origin ?? "")) allowOrigin = origin!;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization,content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
};

export const parseBody = (event: LambdaEvent): Record<string, unknown> => {
  if (!event.body) throw new Error("Missing request body");
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  return JSON.parse(raw) as Record<string, unknown>;
};

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

export const authenticate = async (auth: string | undefined): Promise<User> => {
  const user = await verifyAuth(auth);
  ensureUserInRegistry(user).catch(() => {});
  return user;
};

// Authorization checks. Admin status comes from two sources:
// 1. Cognito group membership ("admins" group) — set during user creation
// 2. roles.json in S3 — editable at runtime via the admin panel
// This dual approach lets us bootstrap admins via Cognito (Terraform) while
// allowing runtime role management without redeploying.
import type { User, RoleEntry } from "./types";
import { getRoles } from "./storage";

export const isAdmin = async (user: User): Promise<boolean> => {
  if (user.groups.includes("admins")) return true;
  const roles = await getRoles();
  // roles.json supports both legacy bare-string subs and { sub, email } objects.
  return roles.admins.some(
    (a: string | RoleEntry) => (typeof a === "string" ? a : a.sub) === user.sub
  );
};

export const isEditor = async (user: User, projectId: string): Promise<boolean> => {
  if (await isAdmin(user)) return true;
  const roles = await getRoles();
  const editors = roles.editors[projectId] || [];
  return editors.some((e: string | RoleEntry) => (typeof e === "string" ? e : e.sub) === user.sub);
};

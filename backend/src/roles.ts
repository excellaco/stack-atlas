import type { User, RoleEntry } from "./types";
import { getRoles } from "./storage";

export const isAdmin = async (user: User): Promise<boolean> => {
  if (user.groups.includes("admins")) return true;
  const roles = await getRoles();
  // Support both old format (bare strings) and new format ({ sub, email })
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

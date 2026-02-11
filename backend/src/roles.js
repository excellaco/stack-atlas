import { getRoles } from "./storage.js";

export const isAdmin = async (user) => {
  if (user.groups.includes("admins")) return true;
  const roles = await getRoles();
  // Support both old format (bare strings) and new format ({ sub, email })
  return roles.admins.some((a) => (typeof a === "string" ? a : a.sub) === user.sub);
};

export const isEditor = async (user, projectId) => {
  if (await isAdmin(user)) return true;
  const roles = await getRoles();
  const editors = roles.editors[projectId] || [];
  return editors.some((e) => (typeof e === "string" ? e : e.sub) === user.sub);
};

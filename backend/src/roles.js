import { getRoles } from "./storage.js";

export const isAdmin = async (user) => {
  if (user.groups.includes("admins")) return true;
  const roles = await getRoles();
  return roles.admins.includes(user.sub);
};

export const isEditor = async (user, projectId) => {
  if (await isAdmin(user)) return true;
  const roles = await getRoles();
  return (roles.editors[projectId] || []).includes(user.sub);
};

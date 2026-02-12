import { useEffect, useState } from "react";
import * as api from "../api";

export default function useAdminRoles(token) {
  const [roles, setRoles] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getRoles(token).catch(() => ({ admins: [], editors: {} })),
      api.listUsers(token).catch(() => ({})),
    ])
      .then(([r, u]) => {
        setRoles(r);
        setUsers(u);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (updated) => {
    setSaving(true);
    setError("");
    try {
      setRoles(await api.putRoles(token, updated));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addAdmin = (user) => {
    if (!roles || roles.admins.some((a) => a.sub === user.sub)) return;
    save({ ...roles, admins: [...roles.admins, user] });
  };

  const removeAdmin = (sub) => {
    if (!roles) return;
    save({ ...roles, admins: roles.admins.filter((a) => a.sub !== sub) });
  };

  return { roles, users, loading, error, setError, saving, setSaving, addAdmin, removeAdmin, save };
}

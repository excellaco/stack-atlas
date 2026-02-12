import { useEffect, useState } from "react";
import * as api from "../api";
import type { Roles, RoleEntry } from "../types";

interface UserRecord {
  email: string;
  name?: string;
}

export interface AdminRolesState {
  roles: Roles | null;
  users: Record<string, UserRecord> | null;
  loading: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  addAdmin: (user: RoleEntry) => void;
  removeAdmin: (sub: string) => void;
  save: (updated: Roles) => Promise<void>;
}

export default function useAdminRoles(token: string | null): AdminRolesState {
  const [roles, setRoles] = useState<Roles | null>(null);
  const [users, setUsers] = useState<Record<string, UserRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getRoles(token).catch((): Roles => ({ admins: [], editors: {} })),
      api.listUsers(token).catch((): Record<string, UserRecord> => ({})),
    ])
      .then(([r, u]) => {
        setRoles(r);
        setUsers(u as Record<string, UserRecord>);
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (updated: Roles): Promise<void> => {
    setSaving(true);
    setError("");
    try {
      setRoles(await api.putRoles(token!, updated));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addAdmin = (user: RoleEntry): void => {
    if (!roles || roles.admins.some((a) => a.sub === user.sub)) return;
    void save({ ...roles, admins: [...roles.admins, user] });
  };

  const removeAdmin = (sub: string): void => {
    if (!roles) return;
    void save({ ...roles, admins: roles.admins.filter((a) => a.sub !== sub) });
  };

  return { roles, users, loading, error, setError, saving, setSaving, addAdmin, removeAdmin, save };
}

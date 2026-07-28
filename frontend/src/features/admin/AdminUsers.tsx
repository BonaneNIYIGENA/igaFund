import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldAlert, UserCheck, UserX, Shield } from "lucide-react";
import { toast } from "sonner";
import { endpoints, type Role, type User } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { fadeUp, stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert, Skeleton } from "@/components/ui/Feedback";

const ROLES: { value: string; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "student", label: "Students" },
  { value: "donor", label: "Donors" },
  { value: "ambassador", label: "Ambassadors" },
  { value: "admin", label: "Admins" },
];

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Suspend modal state
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspendNote, setSuspendNote] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  function loadUsers() {
    setLoading(true);
    endpoints
      .adminUsers(roleFilter, search)
      .then((res) => setUsers(res.users ?? []))
      .catch(() => toast.error("Failed to load user accounts"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadUsers();
  }

  async function handleRoleChange(userId: number, newRole: Role) {
    try {
      const res = await endpoints.changeUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: res.user.role } : u)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  }

  async function handleSuspendConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendTarget) return;
    if (suspendNote.trim().length < 5) {
      toast.error("Audit note must be at least 5 characters long.");
      return;
    }

    setSuspendLoading(true);
    try {
      const res = await endpoints.suspendUser(suspendTarget.id, suspendNote.trim());
      const actionStr = res.user.is_suspended ? "suspended" : "reactivated";
      toast.success(`User ${suspendTarget.full_name} has been ${actionStr}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === suspendTarget.id ? { ...u, is_suspended: res.user.is_suspended } : u))
      );
      setSuspendTarget(null);
      setSuspendNote("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update suspension status");
    } finally {
      setSuspendLoading(false);
    }
  }

  return (
    <AppShell
      title="User Management"
      description="View, manage roles, and enforce account suspensions (BR10 compliance)."
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Search & Filter Bar */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRoleFilter(r.value)}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  roleFilter === r.value
                    ? "bg-forest-800 text-white"
                    : "bg-raised text-muted hover:bg-forest-100 hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-64 text-sm"
            />
            <Button type="submit" variant="secondary" size="sm">
              <Search className="size-4" aria-hidden />
              Search
            </Button>
          </form>
        </motion.div>

        {/* Users Table Card */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">No users found matching your query.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
                        <th className="pb-3 pl-2">User</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Joined</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-sunk">
                          <td className="py-3 pl-2">
                            <div className="font-medium text-ink">{u.full_name}</div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </td>
                          <td className="py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                              className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-forest-600"
                            >
                              <option value="student">Student</option>
                              <option value="donor">Donor</option>
                              <option value="ambassador">Ambassador</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3">
                            {u.is_suspended ? (
                              <Badge tone="danger">Deactivated</Badge>
                            ) : (
                              <Badge tone="success">Active</Badge>
                            )}
                          </td>
                          <td className="py-3 text-xs text-muted">
                            {u.created_at ? formatRelative(u.created_at) : "—"}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <Button
                              variant={u.is_suspended ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => {
                                setSuspendTarget(u);
                                setSuspendNote("");
                              }}
                            >
                              {u.is_suspended ? (
                                <>
                                  <UserCheck className="size-3.5 text-accent-ink" aria-hidden />
                                  Reactivate
                                </>
                              ) : (
                                <>
                                  <UserX className="size-3.5 text-clay-600" aria-hidden />
                                  Deactivate
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Deactivate / Reactivate Modal */}
        {suspendTarget && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md space-y-4 rounded-xl border border-line bg-surface p-6 shadow-xl">
              <div className="flex items-center gap-3 text-ink">
                <span className="grid size-10 place-items-center rounded-full bg-clay-100 text-clay-700">
                  <ShieldAlert className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-base">
                    {suspendTarget.is_suspended ? "Reactivate Account" : "Deactivate Account"}
                  </h3>
                  <p className="text-xs text-muted">{suspendTarget.full_name} ({suspendTarget.email})</p>
                </div>
              </div>

              <Alert tone={suspendTarget.is_suspended ? "info" : "warning"} title="BR7 Mandatory Written Audit Note">
                {suspendTarget.is_suspended
                  ? "Reactivating will restore sign-in access for this account."
                  : "Deactivating will immediately block sign-in access and mark the account as inactive."}
              </Alert>

              <form onSubmit={handleSuspendConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Audit Note / Reason *
                  </label>
                  <textarea
                    value={suspendNote}
                    onChange={(e) => setSuspendNote(e.target.value)}
                    required
                    minLength={5}
                    rows={3}
                    placeholder="State the justification for this action (min 5 characters)..."
                    className="w-full rounded-md border border-line p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>

                <div className="flex justify-end gap-2.5">
                  <Button type="button" variant="ghost" onClick={() => setSuspendTarget(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant={suspendTarget.is_suspended ? "secondary" : "danger"}
                    loading={suspendLoading}
                  >
                    Confirm {suspendTarget.is_suspended ? "Reactivation" : "Deactivation"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}

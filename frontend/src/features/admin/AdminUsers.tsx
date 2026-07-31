import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldAlert, UserCheck, UserX, Shield, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { endpoints, type Role, type User } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { fadeUp, stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert, Skeleton } from "@/components/ui/Feedback";

const PAGE_SIZE = 10;

export function AdminUsers() {
  const { t } = useLocale();
  const ROLES: { value: string; label: string }[] = [
    { value: "all", label: t("adminUsers.role.all") },
    { value: "student", label: t("adminUsers.role.student") },
    { value: "donor", label: t("adminUsers.role.donor") },
    { value: "ambassador", label: t("adminUsers.role.ambassador") },
    { value: "admin", label: t("adminUsers.role.admin") },
  ];
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Suspend modal state
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [suspendNote, setSuspendNote] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [promotingId, setPromotingId] = useState<number | null>(null);

  function loadUsers() {
    setLoading(true);
    endpoints
      .adminUsers(roleFilter, search)
      .then((res) => setUsers(res.users ?? []))
      .catch(() => toast.error(t("adminUsers.loadFailed")))
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
      toast.success(t("adminUsers.roleUpdated", { role: newRole }));
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: res.user.role } : u)));
    } catch (err: any) {
      toast.error(err.message || t("adminUsers.roleUpdateFailed"));
    }
  }

  async function handlePromote(u: User) {
    setPromotingId(u.id);
    try {
      const res = await endpoints.promoteAmbassador(u.id);
      toast.success(t("adminUsers.promoteSucceeded", { name: u.full_name }));
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role: res.user.role } : p)));
    } catch (err: any) {
      toast.error(err.message || t("adminUsers.promoteFailed"));
    } finally {
      setPromotingId(null);
    }
  }

  async function handleSuspendConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendTarget) return;
    if (suspendNote.trim().length < 5) {
      toast.error(t("adminUsers.noteTooShort"));
      return;
    }

    setSuspendLoading(true);
    try {
      const res = await endpoints.suspendUser(suspendTarget.id, suspendNote.trim());
      const actionStr = res.user.is_suspended ? t("adminUsers.actionSuspended") : t("adminUsers.actionReactivated");
      toast.success(t("adminUsers.userSuspended", { name: suspendTarget.full_name, action: actionStr }));
      setUsers((prev) =>
        prev.map((u) => (u.id === suspendTarget.id ? { ...u, is_suspended: res.user.is_suspended } : u))
      );
      setSuspendTarget(null);
      setSuspendNote("");
    } catch (err: any) {
      toast.error(err.message || t("adminUsers.suspendUpdateFailed"));
    } finally {
      setSuspendLoading(false);
    }
  }

  return (
    <AppShell
      title={t("page.adminUsers.title")}
      description={t("page.adminUsers.description")}
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
                    : "bg-raised text-muted hover:bg-forest-100 hover:text-forest-900"
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
              placeholder={t("adminUsers.searchPlaceholder")}
              className="w-64 text-sm"
            />
            <Button type="submit" variant="secondary" size="sm">
              <Search className="size-4" aria-hidden />
              {t("adminUsers.search")}
            </Button>
          </form>
        </motion.div>

        {/* Users Table Card */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("adminUsers.registeredUsers", { count: String(users.length) })}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">{t("adminUsers.noneFound")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
                        <th className="pb-3 pl-2">{t("adminUsers.table.user")}</th>
                        <th className="pb-3">{t("adminUsers.table.role")}</th>
                        <th className="pb-3">{t("adminUsers.table.status")}</th>
                        <th className="pb-3">{t("adminUsers.table.joined")}</th>
                        <th className="pb-3 pr-2 text-right">{t("adminUsers.table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {users.slice(0, page * PAGE_SIZE).map((u) => (
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
                              <option value="student">{t("adminUsers.roleOption.student")}</option>
                              <option value="donor">{t("adminUsers.roleOption.donor")}</option>
                              <option value="ambassador">{t("adminUsers.roleOption.ambassador")}</option>
                              <option value="admin">{t("adminUsers.roleOption.admin")}</option>
                            </select>
                          </td>
                          <td className="py-3">
                            {u.is_suspended ? (
                              <Badge tone="danger">{t("adminUsers.status.deactivated")}</Badge>
                            ) : (
                              <Badge tone="success">{t("adminUsers.status.active")}</Badge>
                            )}
                          </td>
                          <td className="py-3 text-xs text-muted">
                            {u.created_at ? formatRelative(u.created_at) : "—"}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <div className="flex justify-end gap-2">
                              {u.role === "student" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  loading={promotingId === u.id}
                                  onClick={() => handlePromote(u)}
                                >
                                  <ArrowUpCircle className="size-3.5 text-accent-ink" aria-hidden />
                                  {t("adminUsers.action.promote")}
                                </Button>
                              )}
                              <Button
                                variant={u.is_suspended ? "secondary" : "dangerSoft"}
                                size="sm"
                                onClick={() => {
                                  setSuspendTarget(u);
                                  setSuspendNote("");
                                }}
                              >
                                {u.is_suspended ? (
                                  <>
                                    <UserCheck className="size-3.5 text-accent-ink" aria-hidden />
                                    {t("adminUsers.action.reactivate")}
                                  </>
                                ) : (
                                  <>
                                    <UserX className="size-3.5" aria-hidden />
                                    {t("adminUsers.action.deactivate")}
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Load more */}
              {users.length > page * PAGE_SIZE && (
                <div className="flex justify-center pt-4">
                  <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>
                    {t("adminUsers.loadMore", { count: String(users.length - page * PAGE_SIZE) })}
                  </Button>
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
                    {suspendTarget.is_suspended ? t("adminUsers.modal.reactivateTitle") : t("adminUsers.modal.deactivateTitle")}
                  </h3>
                  <p className="text-xs text-muted">{suspendTarget.full_name} ({suspendTarget.email})</p>
                </div>
              </div>

              <Alert tone={suspendTarget.is_suspended ? "info" : "warning"} title={t("adminUsers.modal.auditNoteTitle")}>
                {suspendTarget.is_suspended
                  ? t("adminUsers.modal.reactivateBody")
                  : t("adminUsers.modal.deactivateBody")}
              </Alert>

              <form onSubmit={handleSuspendConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    {t("adminUsers.modal.noteLabel")}
                  </label>
                  <textarea
                    value={suspendNote}
                    onChange={(e) => setSuspendNote(e.target.value)}
                    required
                    minLength={5}
                    rows={3}
                    placeholder={t("adminUsers.modal.notePlaceholder")}
                    className="w-full rounded-md border border-line p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>

                <div className="flex justify-end gap-2.5">
                  <Button type="button" variant="ghost" onClick={() => setSuspendTarget(null)}>
                    {t("adminUsers.modal.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant={suspendTarget.is_suspended ? "secondary" : "danger"}
                    loading={suspendLoading}
                  >
                    {suspendTarget.is_suspended ? t("adminUsers.modal.confirmReactivation") : t("adminUsers.modal.confirmDeactivation")}
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

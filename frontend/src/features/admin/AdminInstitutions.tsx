import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Building2, HeartHandshake, MapPin, Plus, Users } from "lucide-react";
import { ApiError, endpoints, type Institution } from "@/lib/api";

type InstitutionRow = Institution & {
  applicants: number;
  approved: number;
  funded_students: number;
  total_routed: number;
};
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, NativeSelect } from "@/components/ui/Field";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { InstitutionPanel } from "./InstitutionPanel";
import { formatMoney } from "@/lib/format";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

const PAGE_SIZE = 10;

export function AdminInstitutions() {
  const { t } = useLocale();
  const TYPES = [
    { value: "secondary", label: t("adminInstitutions.type.secondary") },
    { value: "university", label: t("adminInstitutions.type.university") },
    { value: "tvet", label: t("adminInstitutions.type.tvet") },
  ];
  const TYPE_LABEL: Record<string, string> = {
    secondary: t("adminInstitutions.typeShort.secondary"),
    university: t("adminInstitutions.typeShort.university"),
    tvet: t("adminInstitutions.typeShort.tvet"),
  };
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("secondary");
  const [bankReference, setBankReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.institutions();
      setInstitutions(res.institutions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminInstitutions.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("adminInstitutions.validation.name");
    if (!location.trim()) next.location = t("adminInstitutions.validation.location");
    if (!bankReference.trim())
      next.bankReference = t("adminInstitutions.validation.bankReference");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError("");
    try {
      await endpoints.createInstitution({
        name: name.trim(),
        location: location.trim(),
        type,
        bank_reference: bankReference.trim(),
      });
      toast.success(t("adminInstitutions.toast.added"), {
        description: t("adminInstitutions.toast.addedDescription", { name: name.trim() }),
      });
      setOpen(false);
      setName("");
      setLocation("");
      setBankReference("");
      setType("secondary");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("adminInstitutions.toast.addFailedGeneric"));
    } finally {
      setSaving(false);
    }
  }

  // Derived stats
  const totalCount = institutions.length;
  const secondaryCount = institutions.filter((i) => i.type === "secondary").length;
  const tvetCount = institutions.filter((i) => i.type === "tvet").length;
  const universityCount = institutions.filter((i) => i.type === "university").length;
  const topInstitution = institutions.reduce(
    (best, i) => (i.applicants > (best?.applicants ?? -1) ? i : best),
    null as InstitutionRow | null,
  );

  const visibleInstitutions = institutions.slice(0, page * PAGE_SIZE);
  const hasMore = visibleInstitutions.length < institutions.length;

  return (
    <AppShell
      title={t("page.adminInstitutions.title")}
      description={t("page.adminInstitutions.description")}
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden />
          {t("adminInstitutions.action.add")}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Stats cards — shown whenever data is loaded */}
        {!loading && !error && institutions.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: t("adminInstitutions.stat.total"), value: totalCount, icon: Building2 },
              { label: t("adminInstitutions.stat.secondary"), value: secondaryCount, icon: Building2 },
              { label: t("adminInstitutions.stat.tvet"), value: tvetCount, icon: Building2 },
              { label: t("adminInstitutions.stat.university"), value: universityCount, icon: Building2 },
              {
                label: t("adminInstitutions.stat.mostApplications"),
                value: topInstitution ? topInstitution.applicants : 0,
                sub: topInstitution?.name,
                icon: Users,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-line bg-surface p-4"
              >
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-ink figure">{stat.value}</p>
                {stat.sub && (
                  <p className="mt-0.5 truncate text-xs text-muted">{stat.sub}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {error ? (
          <ErrorState description={error} onRetry={load} />
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t("adminInstitutions.empty.title")}
            description={t("adminInstitutions.empty.description")}
            action={<Button onClick={() => setOpen(true)}>{t("adminInstitutions.empty.action")}</Button>}
          />
        ) : (
          <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {visibleInstitutions.map((inst) => (
              <li key={inst.id}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-5 pt-5 sm:p-5 sm:pt-5">
                    <button
                      type="button"
                      onClick={() => setViewing(inst.id)}
                      className="group w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-700"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-forest-50 text-forest-700">
                          <Building2 className="size-[18px]" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold leading-snug text-ink">{inst.name}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                            <MapPin className="size-4 shrink-0" aria-hidden />
                            {inst.location}
                          </p>
                          <Badge tone="neutral" className="mt-2.5">
                            {TYPE_LABEL[inst.type] ?? inst.type}
                          </Badge>
                        </div>
                      </div>

                      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
                        <div>
                          <dt className="flex items-center gap-1 text-xs text-muted">
                            <Users className="size-3" aria-hidden />
                            {t("adminInstitutions.applied")}
                          </dt>
                          <dd className="figure mt-0.5 font-semibold text-ink">
                            {inst.applicants}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted">{t("adminInstitutions.verified")}</dt>
                          <dd className="figure mt-0.5 font-semibold text-ink">
                            {inst.approved}
                          </dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-xs text-muted">
                            <HeartHandshake className="size-3" aria-hidden />
                            {t("adminInstitutions.routed")}
                          </dt>
                          <dd className="figure mt-0.5 font-semibold text-amber-700">
                            {formatMoney(inst.total_routed)}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent-ink group-hover:underline">
                        {t("adminInstitutions.seeStudentsAndPayments")}
                        <ArrowRight className="size-4" aria-hidden />
                      </p>
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                {t("adminInstitutions.loadMore", { count: String(institutions.length - visibleInstitutions.length) })}
              </Button>
            </div>
          )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <form onSubmit={create} className="contents" noValidate>
            <DialogHeader>
              <DialogTitle>{t("adminInstitutions.dialog.title")}</DialogTitle>
              <DialogDescription>
                {t("adminInstitutions.dialog.description")}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-5 pb-6">
              {formError && (
                <Alert tone="danger" title={t("adminInstitutions.dialog.addFailedTitle")}>
                  {formError}
                </Alert>
              )}

              <Field label={t("adminInstitutions.field.name")} required error={errors.name}>
                {(props) => (
                  <Input
                    {...props}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Groupe Scolaire Nyamata"
                  />
                )}
              </Field>

              <Field label={t("adminInstitutions.field.location")} required error={errors.location}>
                {(props) => (
                  <Input
                    {...props}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bugesera"
                  />
                )}
              </Field>

              <Field label={t("adminInstitutions.field.type")} required>
                {(props) => (
                  <NativeSelect {...props} value={type} onChange={(e) => setType(e.target.value)}>
                    {TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>

              <Field
                label={t("adminInstitutions.field.bankReference")}
                required
                error={errors.bankReference}
                hint={t("adminInstitutions.field.bankReferenceHint")}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    className="figure"
                    placeholder="BK-1234567890"
                  />
                )}
              </Field>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t("adminInstitutions.dialog.cancel")}
              </Button>
              <Button type="submit" loading={saving}>
                {t("adminInstitutions.action.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <InstitutionPanel
        institutionId={viewing}
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
      />
    </AppShell>
  );
}

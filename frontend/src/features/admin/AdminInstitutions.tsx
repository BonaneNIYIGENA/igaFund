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

const TYPES = [
  { value: "secondary", label: "Secondary school" },
  { value: "university", label: "University" },
  { value: "tvet", label: "TVET / vocational" },
];

const TYPE_LABEL: Record<string, string> = {
  secondary: "Secondary",
  university: "University",
  tvet: "TVET",
};

export function AdminInstitutions() {
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

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
      setError(e instanceof Error ? e.message : "We couldn't load the institutions.");
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
    if (!name.trim()) next.name = "Enter the institution's registered name.";
    if (!location.trim()) next.location = "Enter the district or city.";
    if (!bankReference.trim())
      next.bankReference = "Without a routing reference, no funds can be sent here.";
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
      toast.success("Institution added", { description: `${name.trim()} can now receive funds.` });
      setOpen(false);
      setName("");
      setLocation("");
      setBankReference("");
      setType("secondary");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "We couldn't add this institution.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Institutions"
      description="The registered schools that can receive donor funds. Nothing routes anywhere else."
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden />
          Add institution
        </Button>
      }
    >
      <div className="space-y-5">
        <Alert tone="info" title="This list is the routing allow-list">
          A contribution can only be paid to an institution registered here. A student who hasn't
          chosen one cannot receive funds at all.
        </Alert>

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
            title="No institutions registered"
            description="Add the first school or university. Until one exists, students can't complete their profile and no funds can be routed."
            action={<Button onClick={() => setOpen(true)}>Add the first institution</Button>}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {institutions.map((inst) => (
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
                            Applied
                          </dt>
                          <dd className="figure mt-0.5 font-semibold text-ink">
                            {inst.applicants}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted">Verified</dt>
                          <dd className="figure mt-0.5 font-semibold text-ink">
                            {inst.approved}
                          </dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-xs text-muted">
                            <HeartHandshake className="size-3" aria-hidden />
                            Routed
                          </dt>
                          <dd className="figure mt-0.5 font-semibold text-amber-700">
                            {formatMoney(inst.total_routed)}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent-ink group-hover:underline">
                        See students and payments
                        <ArrowRight className="size-4" aria-hidden />
                      </p>
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <form onSubmit={create} className="contents" noValidate>
            <DialogHeader>
              <DialogTitle>Add an institution</DialogTitle>
              <DialogDescription>
                Only add schools whose account details you have confirmed. This list decides where
                money can go.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-5 pb-6">
              {formError && (
                <Alert tone="danger" title="Couldn't add it">
                  {formError}
                </Alert>
              )}

              <Field label="Registered name" required error={errors.name}>
                {(props) => (
                  <Input
                    {...props}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Groupe Scolaire Nyamata"
                  />
                )}
              </Field>

              <Field label="District or city" required error={errors.location}>
                {(props) => (
                  <Input
                    {...props}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bugesera"
                  />
                )}
              </Field>

              <Field label="Type" required>
                {(props) => (
                  <NativeSelect {...props} value={type} onChange={(e) => setType(e.target.value)}>
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>

              <Field
                label="Routing reference"
                required
                error={errors.bankReference}
                hint="The institution's account reference. Payments are recorded against it."
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
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Add institution
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

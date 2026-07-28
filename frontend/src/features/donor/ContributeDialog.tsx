import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  FileUp,
  HeartHandshake,
  Receipt,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { ApiError, api, endpoints, type ContributionItem, type Profile } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { sanitizeText, validateAmount } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from "@/components/ui/SidePanel";

const PRESETS = [10_000, 25_000, 50_000, 100_000];
const MINIMUM = 1_000;

/** Funding flow: choose an amount, attach the payment slip, read back the route. */
export function ContributeDialog({
  profile,
  open,
  onOpenChange,
  onSuccess,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState("25000");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofName, setProofName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [proofError, setProofError] = useState("");
  const [receipt, setReceipt] = useState<ContributionItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, (profile.funding_goal ?? 0) - (profile.funded_amount ?? 0));
  const numericAmount = Number(amount) || 0;

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setReceipt(null);
      setError("");
      setAmountError("");
      setProofError("");
      setMessage("");
      setAnonymous(false);
      setProofUrl("");
      setProofName("");
      setAmount("25000");
    }, 240);
    return () => clearTimeout(t);
  }, [open]);

  async function uploadProof(file: File) {
    setProofError("");
    if (file.size > 10 * 1024 * 1024) {
      setProofError("That file is over 10 MB. Use a smaller photo or a compressed PDF.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) {
      setProofError("Upload a PDF, PNG or JPG of your transfer confirmation.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api("/contributions/proof", { method: "POST", body: form });
      setProofUrl(res.url);
      setProofName(file.name);
    } catch (err) {
      setProofError(err instanceof ApiError ? err.message : "The upload didn't finish. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amountProblem = validateAmount(amount, { min: MINIMUM, label: "amount" });
    setAmountError(amountProblem);
    if (!proofUrl) setProofError("Attach your payment slip before confirming.");
    if (amountProblem || !proofUrl) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await endpoints.contribute({
        profile_id: profile.id,
        amount: numericAmount,
        message: sanitizeText(message, 500).trim(),
        is_anonymous: anonymous,
        proof_image_url: proofUrl,
      });
      setReceipt(res.contribution);
      toast.success("Contribution routed", {
        description: `${formatMoney(numericAmount)} is on its way to ${
          profile.institution?.name ?? "the institution"
        }.`,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The contribution did not go through.");
    } finally {
      setSubmitting(false);
    }
  }

  const receiptRail: RailStep[] = receipt
    ? [
        { key: "given", label: `You gave ${formatMoney(receipt.amount)}`, icon: HeartHandshake, state: "done" },
        { key: "verified", label: "Routing details confirmed", icon: ShieldCheck, state: "done" },
        { key: "wallet", label: "A personal wallet", detail: "Not used", icon: Wallet, state: "bypassed" },
        {
          key: "school",
          label: `Paid to ${receipt.institution?.name ?? profile.institution?.name ?? "the institution"}`,
          detail: receipt.institution?.location ?? undefined,
          icon: Building2,
          state: "done",
        },
        {
          key: "receipt",
          label: "Receipt issued",
          detail: receipt.receipt_ref ? `Reference ${receipt.receipt_ref}` : undefined,
          icon: Receipt,
          state: "done",
        },
      ]
    : [];

  return (
    <SidePanel open={open} onOpenChange={onOpenChange}>
      <SidePanelContent aria-describedby={undefined}>
        {receipt ? (
          <>
            <SidePanelHeader>
              <span className="mb-3 grid size-12 place-items-center rounded-full bg-success-soft text-forest-700">
                <CheckCircle2 className="size-6" aria-hidden />
              </span>
              <SidePanelTitle>Your contribution is routed</SidePanelTitle>
              <SidePanelDescription>
                {formatMoney(receipt.amount)} recorded against{" "}
                {profile.full_name ?? "this student"}'s fees.
              </SidePanelDescription>
            </SidePanelHeader>

            <SidePanelBody>
              <RoutingRail steps={receiptRail} />

              {receipt.ticket_number && (
                <div className="mt-6 rounded-md border border-line bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Transaction ticket
                  </p>
                  <p className="figure mt-1 text-lg font-semibold text-forest-900">
                    {receipt.ticket_number}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Keep this reference. It also appears in your receipts.
                  </p>
                </div>
              )}
            </SidePanelBody>

            <SidePanelFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button asChild>
                <a href="/donor/receipts">View my receipts</a>
              </Button>
            </SidePanelFooter>
          </>
        ) : (
          <form onSubmit={submit} className="contents" noValidate>
            <SidePanelHeader>
              <SidePanelTitle>Fund {profile.full_name ?? "this student"}</SidePanelTitle>
              <SidePanelDescription>
                {profile.institution
                  ? `Paid straight to ${profile.institution.name}. It never passes through a personal account.`
                  : "Paid straight to the student's registered institution."}
              </SidePanelDescription>
            </SidePanelHeader>

            <SidePanelBody className="space-y-6">
              {error && (
                <Alert tone="danger" title="That didn't go through">
                  {error}
                </Alert>
              )}

              <div>
                <p className="text-sm font-medium text-forest-900">Choose an amount</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(String(preset));
                        setAmountError("");
                      }}
                      aria-pressed={numericAmount === preset}
                      className={`figure min-h-11 cursor-pointer rounded-sm border px-3 text-sm font-semibold transition-colors ${
                        numericAmount === preset
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-line-strong bg-white text-forest-900 hover:border-forest-300 hover:bg-forest-50"
                      }`}
                    >
                      {preset.toLocaleString("en-RW")}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Amount in RWF"
                required
                error={amountError}
                hint={
                  remaining > 0
                    ? `${formatMoney(remaining)} still needed to reach the goal.`
                    : `Minimum ${formatMoney(MINIMUM)}.`
                }
              >
                {(props) => (
                  <Input
                    {...props}
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setAmountError("");
                    }}
                    className="figure text-lg font-semibold"
                  />
                )}
              </Field>

              {/* Proof of payment is required — the record is the whole promise. */}
              <div>
                <p className="text-sm font-medium text-forest-900">
                  Payment slip <span className="text-clay-500">*</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  Attach the confirmation from your bank or mobile money transfer.
                </p>

                {proofUrl ? (
                  <div className="mt-2.5 flex items-center gap-3 rounded-md border border-forest-200 bg-forest-50 p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-forest-100 text-forest-700">
                      <CheckCircle2 className="size-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-forest-900">{proofName}</p>
                      <p className="text-xs text-muted">Attached</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="iconSm"
                      className="text-clay-600 hover:bg-clay-100"
                      onClick={() => {
                        setProofUrl("");
                        setProofName("");
                      }}
                      aria-label="Remove payment slip"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`mt-2.5 rounded-md border-2 border-dashed p-6 text-center ${
                      proofError ? "border-clay-500 bg-danger-soft" : "border-line-strong bg-raised"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      capture="environment"
                      className="sr-only-focusable"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadProof(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      <FileUp aria-hidden />
                      {uploading ? "Uploading…" : "Attach payment slip"}
                    </Button>
                    <p className="mt-2.5 text-xs text-muted">PDF, PNG or JPG, up to 10 MB.</p>
                  </div>
                )}

                {proofError && (
                  <p role="alert" className="mt-1.5 text-sm text-clay-600">
                    {proofError}
                  </p>
                )}
              </div>

              <Field
                label="Message to the student"
                hint="Optional. They will read this on their dashboard."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    rows={3}
                    maxLength={400}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Keep going — your work matters."
                  />
                )}
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-white p-4">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[var(--color-forest-700)]"
                />
                <span className="text-sm">
                  <span className="font-medium text-forest-900">Give anonymously</span>
                  <span className="mt-0.5 block text-muted">
                    Your name is hidden from the student and the public page. It stays on the
                    receipt and in the audit trail.
                  </span>
                </span>
              </label>
            </SidePanelBody>

            <SidePanelFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="fund" loading={submitting}>
                Give {formatMoney(numericAmount)}
              </Button>
            </SidePanelFooter>
          </form>
        )}
      </SidePanelContent>
    </SidePanel>
  );
}

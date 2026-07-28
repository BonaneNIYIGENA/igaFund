import { AppShell } from "@/app/shell/AppShell";
import { TicketsView } from "@/components/TicketsView";

export function DonorReceipts() {
  return (
    <AppShell
      title="Receipts"
      description="A numbered, timestamped ticket for every payment you've routed through igaFund."
    >
      <div>
        <TicketsView emptyHint="When you fund a student, the receipt for that payment appears here with the institution it went to." />
      </div>
    </AppShell>
  );
}

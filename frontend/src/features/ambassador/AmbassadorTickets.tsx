import { AppShell } from "@/app/shell/AppShell";
import { TicketsView } from "@/components/TicketsView";

export function AmbassadorTickets() {
  return (
    <AppShell
      title="Tickets"
      description="The official record of every milestone on your account."
    >
      <div>
        <TicketsView emptyHint="Tickets appear when a student you enrolled is verified or funded." />
      </div>
    </AppShell>
  );
}

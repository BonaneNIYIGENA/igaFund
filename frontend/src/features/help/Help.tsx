import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import {
  Building2,
  ChevronDown,
  HeartHandshake,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RoutingFlow, type RailStep } from "@/components/ui/RoutingRail";
import { fadeUp } from "@/lib/motion";

const MONEY_PATH: RailStep[] = [
  { key: "donor", label: "A donor gives", icon: HeartHandshake, state: "done" },
  { key: "igafund", label: "igaFund verifies", icon: ShieldCheck, state: "done" },
  { key: "school", label: "The school is paid", icon: Building2, state: "done" },
  { key: "receipt", label: "Receipts issued", icon: Receipt, state: "done" },
];

const FAQS = [
  {
    q: "How does it work as a student?",
    a: "Create your account, then write your profile — your story, your school, and how much you need for the year. Upload your transcript and ID (a clear phone photo is fine), then send it for review; a reviewer usually responds within a few days. Once approved, donors can fund your fees directly — the money goes to your school, never to you.",
  },
  {
    q: "Why can't I edit my profile after it's approved?",
    a: "Donors decide based on what they read, so an approved profile is locked. If something genuinely changes — a new school, a different goal — use 'Request a change'. Your profile pauses from the donor pool and goes back to a reviewer, then returns once they approve it.",
  },
  {
    q: "I'm under 18. What's different for me?",
    a: "Rwandan law requires a guardian's written consent before we can publish your profile. You'll enter your guardian's name and phone, and upload their signed consent form. Your legal name and photograph stay hidden from donors — you appear as 'Verified Student'.",
  },
  {
    q: "A reviewer asked for changes. What now?",
    a: "Their note explains exactly what to fix. Open your profile, make the change, and send it back. There's no limit on resubmissions.",
  },
  {
    q: "Does the money come to me?",
    a: "No, and it can't. Contributions are paid to your registered institution's account. This is enforced in the system itself, not just the interface — there is no way to route funds to a personal account.",
  },
  {
    q: "Who can see my documents?",
    a: "Only you and igaFund reviewers. Documents are served through a checked, private route — they never get a public link, and donors never see them.",
  },
  {
    q: "Which schools can I study at?",
    a: "Any institution igaFund has verified and added to our registered list. If your school isn't listed yet, ask an administrator to add it — only registered institutions can receive routed funds.",
  },
  {
    q: "How does it work as a donor?",
    a: "Browse verified students — every profile shown has already passed review — and read their story: their studies, their school, and how far along their goal is. Give what you can, any amount from 1,000 RWF. The school is paid and recorded against the institution's account, and you keep a numbered receipt naming the school.",
  },
  {
    q: "How do I know a student is real?",
    a: "An igaFund administrator reads their transcript, their ID and — for minors — a signed guardian consent form before the profile becomes visible. Nothing unverified is ever browsable, and pending profiles are hidden from search entirely.",
  },
  {
    q: "How do I know the money reached the school?",
    a: "Every contribution issues a numbered receipt naming the institution it was paid to, and writes a permanent entry to the audit trail. You'll find yours under My Giving.",
  },
  {
    q: "Can I give anonymously?",
    a: "Yes. Tick 'Give anonymously' and your name is hidden from the student and the public page. It still appears on your own receipt and in the audit record, because financial records must stay traceable.",
  },
  {
    q: "Why can't I see a student's full name or contact details?",
    a: "Students under 18 are protected under Rwanda's data protection law — their legal name and photograph are withheld. Confidential records aren't available to donors for any student.",
  },
  {
    q: "What happens if a student reaches their goal?",
    a: "Their profile shows the goal as reached and stops asking for money. The record of who gave what stays available to them and to you.",
  },
  {
    q: "How do I know an institution is legitimate?",
    a: "Every institution is manually added by an igaFund administrator only after their bank account details are confirmed. That registered list is the only place a contribution can ever be routed to — there's no way to send funds anywhere else.",
  },
  {
    q: "Can I become an ambassador?",
    a: "Ambassadors are promoted by igaFund from students who've already been verified on the platform, based on how carefully they manage their own profile and documents — you can't sign up for the role directly, whether you're a student or a donor. Promotion only ever leads to the ambassador role, never administrator; ambassadors enroll and manage students in their own community, they don't review or approve profiles.",
  },
];

export function Help() {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-canvas">
      <PublicHeader />

      <main className="mx-auto max-w-360 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">How igaFund works</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            One rule explains most of this product: money is paid to schools, never to people. Every
            other rule exists to make that one believable.
          </p>
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-base">Where a contribution goes</CardTitle>
          </CardHeader>
          <CardContent>
            <RoutingFlow steps={MONEY_PATH} />
          </CardContent>
        </Card>

        <section className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">Frequently Asked Questions</h2>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-6">
            <Accordion.Root type="single" collapsible className="space-y-2.5">
              {FAQS.map((faq, i) => (
                <Accordion.Item
                  key={faq.q}
                  value={`item-${i}`}
                  className="overflow-hidden rounded-md border border-line bg-surface"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-sunk focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest-700">
                      <span className="font-medium text-ink">{faq.q}</span>
                      <ChevronDown
                        className="size-[18px] shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
                        aria-hidden
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden">
                    <p className="border-t border-line px-5 py-4 leading-relaxed text-body">
                      {faq.a}
                    </p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </motion.div>
        </section>

        <Card tone="ink" className="mt-12">
          <CardContent className="p-7 pt-7 sm:p-9 sm:pt-9">
            <h2 className="font-display text-2xl tracking-tight text-white">Still stuck?</h2>
            <p className="mt-3 max-w-lg leading-relaxed text-forest-200">
              If something here doesn't answer your question, an administrator can help. Students and
              ambassadors can also ask the reviewer who handled their profile — their note is on your
              progress page.
            </p>
            <Button variant="fund" className="mt-6" asChild>
              <Link to={user ? HOME_FOR_ROLE[user.role] : "/register"}>
                {user ? "Back to my dashboard" : "Create an account"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}

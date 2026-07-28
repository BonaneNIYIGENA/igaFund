import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  FileText,
  GraduationCap,
  HeartHandshake,
  Mail,
  Receipt,
  Send,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RoutingFlow, RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import { UnderlineTabs } from "@/components/ui/Tabs";
import { fadeUp, stagger } from "@/lib/motion";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
  WhatsAppIcon,
  SOCIAL_LINKS,
} from "@/lib/contact";

const MONEY_PATH: RailStep[] = [
  { key: "donor", label: "A donor gives", icon: HeartHandshake, state: "done" },
  { key: "igafund", label: "igaFund verifies", icon: ShieldCheck, state: "done" },
  { key: "wallet", label: "A personal wallet", detail: "Never touched", icon: Wallet, state: "bypassed" },
  { key: "school", label: "The school is paid", icon: Building2, state: "done" },
  { key: "receipt", label: "Receipts issued", icon: Receipt, state: "done" },
];

const GUIDES = {
  student: {
    label: "I'm a student",
    icon: GraduationCap,
    intro:
      "You create one funding profile. A reviewer checks it, and once it's approved donors can fund your fees directly at your school.",
    steps: [
      { key: "s1", label: "Create your account", detail: "Sign up as a student with your email.", icon: UserRound, state: "done" as const },
      { key: "s2", label: "Write your profile", detail: "Your story, your school, and how much you need for the year.", icon: FileText, state: "done" as const },
      { key: "s3", label: "Upload your documents", detail: "Transcript and ID. A clear phone photo is fine.", icon: FileText, state: "done" as const },
      { key: "s4", label: "Send it for review", detail: "A reviewer usually responds within a few days.", icon: Send, state: "done" as const },
      { key: "s5", label: "Donors fund your fees", detail: "Money goes to your school, never to you.", icon: HeartHandshake, state: "done" as const },
    ],
    faqs: [
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
    ],
  },
  donor: {
    label: "I'm a donor",
    icon: HeartHandshake,
    intro:
      "You browse profiles that an administrator has already verified, and your contribution is paid straight to the student's school.",
    steps: [
      { key: "d1", label: "Browse verified students", detail: "Every profile shown has passed review.", icon: Users, state: "done" as const },
      { key: "d2", label: "Read their story", detail: "Their studies, their school, and how far along their goal is.", icon: FileText, state: "done" as const },
      { key: "d3", label: "Give what you can", detail: "Any amount from 1,000 RWF.", icon: HeartHandshake, state: "done" as const },
      { key: "d4", label: "The school is paid", detail: "Recorded against the institution's account.", icon: Building2, state: "done" as const },
      { key: "d5", label: "Keep your receipt", detail: "A numbered ticket naming the school.", icon: Receipt, state: "done" as const },
    ],
    faqs: [
      {
        q: "How do I know a student is real?",
        a: "An igaFund administrator reads their transcript, their ID and — for minors — a signed guardian consent form before the profile becomes visible. Nothing unverified is ever browsable, and pending profiles are hidden from search entirely.",
      },
      {
        q: "How do I know the money reached the school?",
        a: "Every contribution issues a numbered receipt naming the institution it was paid to, and writes a permanent entry to the audit trail. You'll find yours under Receipts.",
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
    ],
  },
  ambassador: {
    label: "I'm an ambassador",
    icon: UserPlus,
    intro:
      "You enroll students in your own community — including where there's no reliable connection — and manage the profiles you created.",
    steps: [
      { key: "a1", label: "Enroll a student", detail: "Capture their details in three short steps.", icon: UserPlus, state: "done" as const },
      { key: "a2", label: "Photograph their documents", detail: "Transcript, ID, and consent form if they're a minor.", icon: FileText, state: "done" as const },
      { key: "a3", label: "Send them for review", detail: "You submit on their behalf.", icon: Send, state: "done" as const },
      { key: "a4", label: "Follow their progress", detail: "You'll be notified of the decision.", icon: ShieldCheck, state: "done" as const },
    ],
    faqs: [
      {
        q: "What happens if I lose signal mid-enrolment?",
        a: "Keep going. Everything you type is stored on your device and uploads itself the moment you're back online. You'll see a banner telling you what's queued.",
      },
      {
        q: "Can I see other ambassadors' students?",
        a: "No. You see only the students you personally enrolled. This is enforced by the system, not just hidden in the interface.",
      },
      {
        q: "The student has no email address.",
        a: "Use an address you can pass on to them — a relative's, or one you set up together. The account is created for them so they can sign in later and follow their own funding.",
      },
      {
        q: "How do I become an ambassador?",
        a: "Ambassadors are promoted by igaFund from students who have already been verified through the platform. You can't sign up for the role directly.",
      },
    ],
  },
  admin: {
    label: "I'm an administrator",
    icon: ShieldCheck,
    intro:
      "You are the gate. Nothing reaches the donor pool without your approval, and every decision you make is recorded permanently.",
    steps: [
      { key: "m1", label: "Open the review queue", detail: "Submitted applications waiting on a decision.", icon: ShieldCheck, state: "done" as const },
      { key: "m2", label: "Read every document", detail: "Open each file and mark it verified.", icon: FileText, state: "done" as const },
      { key: "m3", label: "Record a decision with a note", detail: "The note is mandatory and the student reads it.", icon: Send, state: "done" as const },
      { key: "m4", label: "The audit trail records it", detail: "Append-only, with your account and a timestamp.", icon: Receipt, state: "done" as const },
    ],
    faqs: [
      {
        q: "Why is the approve button disabled for some students?",
        a: "That student is a minor and their guardian consent isn't complete. You need consent confirmed on the profile, the signed form uploaded, and that form marked verified. The rule is enforced by the API too — approval will be refused even if the interface let you click.",
      },
      {
        q: "Can I edit or delete an audit entry?",
        a: "No. The audit trail is append-only by design, which is what makes it worth anything as a compliance record.",
      },
      {
        q: "What does 'change request' mean on a profile?",
        a: "An approved student asked to reopen their profile and gave a reason. It's paused from the donor pool until you approve or reject the change.",
      },
      {
        q: "How do institutions get added?",
        a: "Under Institutions. Only add a school whose account details you've confirmed — that list is the allow-list deciding where money can be sent.",
      },
    ],
  },
};

type GuideKey = keyof typeof GUIDES;

export function Help() {
  const { user } = useAuth();
  const [tab, setTab] = useState<GuideKey>((user?.role as GuideKey) ?? "student");
  const guide = GUIDES[tab];

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
          <h2 className="font-display text-2xl tracking-tight">Guides by role</h2>

          <UnderlineTabs
            className="mt-5"
            value={tab}
            onValueChange={(v) => setTab(v as GuideKey)}
            layoutId="help-tab"
            tabs={(Object.keys(GUIDES) as GuideKey[]).map((key) => ({
              value: key,
              label: GUIDES[key].label,
            }))}
          />

          <motion.div
            key={tab}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mt-6 space-y-5"
          >
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <guide.icon className="size-[18px] text-accent-ink" aria-hidden />
                    {guide.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-6 leading-relaxed text-body">{guide.intro}</p>
                  <RoutingRail steps={guide.steps} animate={false} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <h3 className="font-display text-xl tracking-tight">Common questions</h3>
              <Accordion.Root type="single" collapsible className="mt-4 space-y-2.5">
                {guide.faqs.map((faq, i) => (
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Contact us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-3 rounded-md border border-line bg-raised p-4 transition-colors hover:bg-sunk"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-forest-100 text-forest-700">
                  <Mail className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-faint">Email</p>
                  <p className="truncate font-medium text-ink">{CONTACT_EMAIL}</p>
                </div>
              </a>

              <a
                href={CONTACT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-line bg-raised p-4 transition-colors hover:bg-sunk"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-forest-100 text-forest-700">
                  <WhatsAppIcon className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                    WhatsApp &amp; phone
                  </p>
                  <p className="truncate font-medium text-ink">{CONTACT_PHONE_DISPLAY}</p>
                </div>
              </a>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">Follow us</p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {SOCIAL_LINKS.map((s) => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3.5 py-2 text-sm text-muted"
                  >
                    <s.icon className="size-4" aria-hidden />
                    {s.label}
                    <span className="text-xs text-faint">· Coming soon</span>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

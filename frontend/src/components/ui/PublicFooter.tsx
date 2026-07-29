import { Logo } from "@/components/ui/Logo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
  WhatsAppIcon,
  SOCIAL_LINKS,
} from "@/lib/contact";

/** Unified footer across Landing, Help, and Browse Students — every public page. */
export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-360 flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo size="lg" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Verified educational funding for underprivileged youth in Sub-Saharan Africa.
            Piloting in Rwanda.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <p className="font-semibold text-ink">Contact us</p>
          <p>
            Email:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-ink hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            WhatsApp &amp; phone:{" "}
            <a
              href={CONTACT_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent-ink hover:underline"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
          <p>Location: Kigali, Rwanda</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-ink">Follow us</p>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={CONTACT_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="grid size-9 place-items-center rounded-full border border-line bg-raised text-muted transition-colors hover:bg-sunk hover:text-accent-ink"
            >
              <WhatsAppIcon className="size-4" aria-hidden />
            </a>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="grid size-9 place-items-center rounded-full border border-line bg-raised text-muted transition-colors hover:bg-sunk hover:text-accent-ink"
              >
                <s.icon className="size-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-360 text-center text-xs text-faint">
        © {new Date().getFullYear()} igaFund. Let's make an impact together.
      </p>
    </footer>
  );
}

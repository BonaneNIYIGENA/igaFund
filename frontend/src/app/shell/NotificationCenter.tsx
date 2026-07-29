import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, CheckCheck, CircleAlert, Info, PartyPopper } from "lucide-react";
import { endpoints, type NotificationItem } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Menu";

const TONE = {
  success: { icon: PartyPopper, class: "bg-success-soft text-accent-ink" },
  warning: { icon: CircleAlert, class: "bg-warning-soft text-warning-ink" },
  action: { icon: Bell, class: "bg-amber-100 text-amber-700" },
  info: { icon: Info, class: "bg-forest-100 text-forest-700" },
} as const;

function toneFor(type: string) {
  return TONE[type as keyof typeof TONE] ?? TONE.info;
}

/** The notification centre, present in every role's header. */
export function NotificationCenter() {
  const { t } = useLocale();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await endpoints.notifications();
      setItems(res.notifications ?? []);
    } catch {
      // A failed poll must never interrupt what the user is doing.
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const unread = items.filter((n) => !n.read).length;

  async function openItem(item: NotificationItem) {
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    endpoints.markNotificationRead(item.id).catch(() => undefined);
    if (item.link) {
      setOpen(false);
      navigate(item.link);
    }
  }

  async function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    endpoints.markAllNotificationsRead().catch(() => undefined);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid size-11 cursor-pointer place-items-center rounded-sm text-accent-ink transition-colors hover:bg-forest-100 hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
          aria-label={unread > 0 ? t("notificationCenter.ariaUnread", { count: String(unread) }) : t("notificationCenter.ariaNoUnread")}
        >
          <Bell className="size-[19px]" aria-hidden />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="figure absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-forest-950"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t("notificationCenter.title")}</h2>
          {unread > 0 && (
            <Button variant="link" size="sm" onClick={markAll} className="text-sm">
              <CheckCheck aria-hidden />
              {t("notificationCenter.markAllRead")}
            </Button>
          )}
        </div>

        <div className="max-h-[min(26rem,60dvh)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-forest-50 text-forest-600">
                <Bell className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium text-ink">{t("notificationCenter.empty.title")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("notificationCenter.empty.description")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const { icon: Icon, class: toneClass } = toneFor(item.type);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={cn(
                        "flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sunk",
                        // A solid theme-aware highlight, not a fixed light tint —
                        // this row's text is adaptive and must stay readable on it.
                        !item.read && "bg-highlight",
                      )}
                    >
                      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", toneClass)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug text-body">{item.message}</span>
                        <span className="mt-1 block text-xs text-faint">
                          {formatRelative(item.created_at)}
                        </span>
                      </span>
                      {!item.read && (
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-500" aria-label={t("notificationCenter.unreadAria")} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && unread === 0 && (
          <p className="flex items-center justify-center gap-1.5 border-t border-line bg-raised py-2.5 text-xs text-muted">
            <Check className="size-3.5" aria-hidden />
            {t("notificationCenter.everythingRead")}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

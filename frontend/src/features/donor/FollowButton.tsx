import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { useWatchlist } from "./WatchlistContext";
import { cn } from "@/lib/cn";

/** A heart toggle for donors to keep a student on their radar. Hidden for everyone else. */
export function FollowButton({
  profileId,
  size = "md",
  className,
}: {
  profileId: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const { user } = useAuth();
  const watchlist = useWatchlist();
  const [busy, setBusy] = useState(false);

  if (user?.role !== "donor" || !watchlist) return null;

  const watching = watchlist.isWatching(profileId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      await watchlist!.toggle(profileId);
      toast.success(watching ? "Removed from following" : "Added to following", {
        description: watching
          ? undefined
          : "You'll see them in your Following list on My giving.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={watching}
      aria-label={watching ? "Stop following this student" : "Follow this student"}
      className={cn(
        "grid shrink-0 cursor-pointer place-items-center rounded-full border transition-colors duration-200 disabled:cursor-wait",
        size === "sm" ? "size-8" : "size-10",
        watching
          ? "border-clay-300 bg-clay-100 text-clay-600 hover:bg-clay-200"
          : "border-line-strong bg-surface text-muted hover:border-clay-300 hover:text-clay-500",
        className,
      )}
    >
      <Heart className={size === "sm" ? "size-4" : "size-[18px]"} fill={watching ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}

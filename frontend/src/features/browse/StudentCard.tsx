import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, GraduationCap, ShieldCheck } from "lucide-react";
import type { Profile } from "@/lib/api";
import { fadeUp } from "@/lib/motion";
import { fundingPercent } from "@/lib/format";
import { FundingProgress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Menu";
import { FollowButton } from "@/features/donor/FollowButton";
import { cn } from "@/lib/cn";

/** A verified student in the donor pool. */
export function StudentCard({
  profile,
  to,
  onOpen,
  className,
}: {
  profile: Profile;
  to: string;
  onOpen?: (id: number) => void;
  className?: string;
}) {
  const percent = fundingPercent(profile.funded_amount, profile.funding_goal);
  const fullyFunded = percent >= 100;
  const anonymous = profile.full_name === "Verified Student";

  return (
    <motion.article variants={fadeUp} className={cn("h-full", className)}>
      <Link
        to={to}
        onClick={onOpen ? (e) => { e.preventDefault(); onOpen(profile.id); } : undefined}
        className="group flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-sm transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
      >
        <div className="flex items-start gap-3.5">
          <Avatar name={anonymous ? "?" : (profile.full_name ?? "?")} src={profile.photo_url} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight text-ink">
              {profile.full_name ?? "Verified Student"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <GraduationCap className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                {profile.academic_level ?? "Student"}
                {profile.field_of_study ? ` · ${profile.field_of_study}` : ""}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <FollowButton profileId={profile.id} size="sm" />
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700"
              title="Verified by igaFund"
            >
              <ShieldCheck className="size-4" aria-hidden />
              <span className="sr-only-focusable">Verified by igaFund</span>
            </span>
          </div>
        </div>

        {profile.institution && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
            <Building2 className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{profile.institution.name}</span>
          </p>
        )}

        {profile.bio && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-body">{profile.bio}</p>
        )}

        <div className="mt-auto pt-5">
          <FundingProgress funded={profile.funded_amount} goal={profile.funding_goal} />
        </div>

        <p
          className={cn(
            "mt-4 text-sm font-medium",
            fullyFunded ? "text-forest-700" : "text-forest-700 group-hover:underline",
          )}
        >
          {fullyFunded ? "Goal reached — see the record" : "View profile and fund"}
        </p>
      </Link>
    </motion.article>
  );
}

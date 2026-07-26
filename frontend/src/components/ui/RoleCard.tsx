import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  desc: string;
  active: boolean;
  onSelect: () => void;
};

export function RoleCard({ icon: Icon, title, desc, active, onSelect }: Props) {
  return (
    <button
      type="button"
      className={`rolecard${active ? " rolecard--active" : ""}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className="rolecard__icon">
        <Icon size={20} />
      </span>
      <span>
        <span className="rolecard__title">{title}</span>
        <span className="rolecard__desc">{desc}</span>
      </span>
    </button>
  );
}

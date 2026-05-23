import { LayoutDashboard, LineChart, ListChecks, Trophy, Bell, Settings } from "lucide-react";

// Left icon rail — collapses at <1024px per DASHBOARD-BRIEF.md §4. For now
// it's always the desktop width; reflow comes when we wire breakpoints in.

const items = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: LineChart, label: "Vault", href: "/vault/AAPL" },
  { icon: ListChecks, label: "Activity", href: "#" },
  { icon: Trophy, label: "Compete", href: "#" },
  { icon: Bell, label: "Alerts", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex w-16 shrink-0 flex-col items-center gap-1 py-6 border-r border-subtle"
    >
      {items.map(({ icon: Icon, label, href }) => (
        <a
          key={label}
          href={href}
          title={label}
          className="grid place-items-center w-10 h-10 rounded-lg text-content-secondary hover:bg-surface-elevated hover:text-content-primary focus-on-bloom"
        >
          <Icon size={18} aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </a>
      ))}
    </nav>
  );
}

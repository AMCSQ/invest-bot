import { Globe, Sun, Wallet, Beaker } from "lucide-react";

// Top bar. Mirrors the Voltrex layout: brand → primary nav → broker chip
// → lang/theme → faucet pill. See DASHBOARD-BRIEF.md §4.

const nav = [
  { label: "Trade", href: "/" },
  { label: "Vault", href: "/vault/AAPL" },
  { label: "Compete", href: "#" },
  { label: "Activity", href: "#" },
  { label: "Referrals", href: "#" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-bg/70 border-b border-subtle">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between px-8 h-14">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 focus-on-bloom rounded-md px-1">
            <span
              aria-hidden="true"
              className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-300 to-accent-500"
            />
            <span className="font-semibold tracking-tight">Voltrex</span>
          </a>
          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-1 text-sm">
              {nav.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="px-3 py-1.5 rounded-md text-content-secondary hover:text-content-primary hover:bg-surface-elevated focus-on-bloom"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-surface-elevated border border-subtle text-content-secondary focus-on-bloom"
          >
            <Wallet size={14} aria-hidden="true" />
            <span>Synthetic · paper</span>
          </button>
          <button
            type="button"
            aria-label="Change language"
            className="p-2 rounded-md text-content-secondary hover:bg-surface-elevated focus-on-bloom"
          >
            <Globe size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Toggle theme"
            className="p-2 rounded-md text-content-secondary hover:bg-surface-elevated focus-on-bloom"
          >
            <Sun size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-warning/15 text-warning border border-warning/30 focus-on-bloom"
          >
            <Beaker size={12} aria-hidden="true" />
            <span>Faucet</span>
          </button>
        </div>
      </div>
    </header>
  );
}

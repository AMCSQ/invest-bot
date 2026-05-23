# Long-Term Profile — Design Container

UI brief for the **long-term buy-and-hold** profile. This dashboard exists to surface allocation drift, project the glide-path to retirement, and stay out of the user's way for the other 51 weeks of the year. The interaction model is monthly, the data is daily-close at the fastest, and the persona-bound rule is: **boring is good — the dashboard surfaces drift, it does not generate decisions.** It is a deliberate inversion of the day-trading flavored brief at [`../EQUITIES-DASHBOARD.md`](../EQUITIES-DASHBOARD.md): no candlesticks, no order ticket, no live anything, no tilt-guard pill.

## Files

| File | Lines | Purpose |
|---|---|---|
| [`UI-SPEC.md`](./UI-SPEC.md) | ~340 | Full UI specification: layout, components, interaction surface, data shape, mobile, a11y, performance budget, non-features, deploy targets, anti-patterns |
| [`code/`](./code/) | (stub) | Profile-specific component implementations. Seeded with `.gitkeep`; populated when a contributor scaffolds `AllocationBar`, `HoldingsTable`, `GlidePathChart`, `RebalancePanel`, or a long-term variant of `KpiTile`. |

## Cross-references

- **Shared foundations:** [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md) — design tokens, type scale, motion, charting library picks, a11y / perf / i18n checklists.
- **Design tokens (re-used as-is):** [`../code/tokens.ts`](../code/tokens.ts), [`../code/tokens.css`](../code/tokens.css). The violet bloom from `DASHBOARD-BRIEF.md §1` is **not** used in this profile (see `UI-SPEC.md §4`).
- **Reference components:** `KpiTile` pattern from [`../code/`](../code/) is reused with a `variant="long-term"` MoM-delta tweak. `LeaderCard`, `LockSlider`, `TVEmbed` are explicitly **not** reused — they belong to crypto and active-trading flavors.
- **Pixel-level anti-pattern catalog:** [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md). The long-term dashboard inherits its anti-patterns plus its own (see `UI-SPEC.md §13`).
- **Profile context (read before contributing):**
  - [`../../profiles/long-term/README.md`](../../profiles/long-term/README.md) — who this is for, default skills, excluded skills, data locations.
  - [`../../profiles/long-term/CLAUDE.md`](../../profiles/long-term/CLAUDE.md) — LLM persona, behavioral defaults, safety rules.
  - [`../../profiles/long-term/PLAYBOOK.md`](../../profiles/long-term/PLAYBOOK.md) — the monthly / quarterly / annual / event-driven routines this dashboard supports.

## Where this lives in the build

Two recommended deploy targets, each documented in `UI-SPEC.md §11`:

1. **Streamlit (default, fastest to ship).** Scaffold via the `dashboard-build` skill. Reads `data/positions/holdings.yaml` and `reports/annual-review/YYYY/retire-fire/output.json`, writes the two YAML mutations ("mark rebalanced" / "log dividend received") natively. Open locally once a month; no hosting cost.
2. **Static Next.js with SSG.** If the user already runs the `web/` app, build the long-term route as a fully static page (`export const dynamic = 'force-static'`) under `web/app/long-term/page.tsx`. Reads YAML at build time, ships zero client JS for data fetching. The two writes become small server actions that mutate YAML and trigger a static rebuild.
3. **Observable notebook for the glide-path** (complementary, not standalone). Lives in `reports/annual-review/YYYY/glide-path.ipynb`; the user opens it during the A2 retire-fire routine for interactive parameter knobs.

The day-trading sibling at [`../EQUITIES-DASHBOARD.md`](../EQUITIES-DASHBOARD.md) targets the `web/` Next.js app exclusively (it needs the live WebSocket, broker SDK, and TradingView embed). This profile does not — Streamlit is the right default for a once-a-month surface.

## What this container intentionally does NOT spec

See `UI-SPEC.md §10` for the full list. The headline omissions: no candlesticks, no order ticket, no tilt-guard pill, no WebSocket, no TradingView Charting Library, no leaderboard, no `chart-render` skill, no "today's movers," no animated count-up tween. If a future contributor proposes any of these, route the proposal back through `../../profiles/long-term/CLAUDE.md`'s behavioral defaults first.

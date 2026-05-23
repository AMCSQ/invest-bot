# Swing dashboard — design container

Per-profile design notes for the **swing trader** persona (`profiles/swing/`). Holding horizon 2–20 days, decision cadence 3–10 trades/week, trader has a day job and cannot watch the tape midday.

This directory is the *swing-specific* layer on top of the shared design system. Read in this order:

1. [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md) — shared visual grammar (tokens, type scale, motion, a11y). Everything here inherits unless explicitly overridden.
2. [`../EQUITIES-DASHBOARD.md`](../EQUITIES-DASHBOARD.md) — equities adaptation. Some content is reusable (KPI shapes, calendar lane), much is day-trading-leaning (order ticket, live PDT countdown, live tape) — see UI-SPEC for which pieces we keep and which we drop.
3. [`./UI-SPEC.md`](./UI-SPEC.md) — **the swing UX contract.** Three-mode shell (Weekend Prep / Low-Touch / EOD), component anatomy, data shape, anti-patterns. This is the build target.
4. [`../../profiles/swing/PLAYBOOK.md`](../../profiles/swing/PLAYBOOK.md) — the workflow the UI mirrors. If a workflow isn't here, it shouldn't be in the UI.
5. [`../../profiles/swing/CLAUDE.md`](../../profiles/swing/CLAUDE.md) — LLM persona + tone. Informs default copy and routing chips.

## File index

| Path | Purpose |
|---|---|
| [`UI-SPEC.md`](./UI-SPEC.md) | The build contract. ~350 lines. Layout, components, data shape, mobile, a11y, perf, anti-patterns. |
| [`README.md`](./README.md) | This file. Index + cross-refs. |
| [`code/`](./code/) | Per-profile component prototypes (`ScreenerResultsPane.tsx`, `DecisionCardComposer.tsx`, etc.) — seeded empty, populated as components are scaffolded. |

## The single most important UX rule

**Default to weekend mode on Sat/Sun; default to EOD mode after 16:00 ET; default to pre-market mode 07:00–09:25 ET; otherwise show a low-touch read-only "Open positions" surface — never default to a live tape, because doing so tempts midday interventions the playbook forbids.**

The mode-selection logic is the single most load-bearing decision in this UI. Get it wrong and the trader installs a day-job-distraction machine.

## What this profile inherits vs overrides vs drops

**Inherits** from `../DASHBOARD-BRIEF.md`:
- All color tokens, the violet bloom (at 40% opacity), Inter + JetBrains Mono, motion tokens, the a11y/perf/i18n 24-item checklist.

**Overrides** from `../EQUITIES-DASHBOARD.md`:
- Body type scale 14 → 15 (laptop reading distance).
- Day P&L rendered at tertiary opacity, no animation (vs day-trading's hero treatment).
- No live HeroChart — daily candles only, refreshed on demand.
- KPI strip replaced with **mode chip + regime pill + account equity + adherence** — not the day-trader's 5-tile dollar cockpit.

**Drops entirely**:
- Live order ticket panel (orders are placed in the broker, not here).
- PDT countdown (swing horizon doesn't engage the rule).
- Live news ticker (only daily news strip in Low-Touch mode).
- tilt-guard PreToolUse hook (cadence too slow for reliable rolling features).
- Copy-trade leader cards (swing trader is their own leader).
- 0DTE-style countdown timers anywhere.

## Cross-profile

- [`../day-trading/`](../day-trading/) — if you also (or instead) trade intraday. That UI has a live HeroChart, an order ticket, a Watchlist with WebSocket prices, and the tilt-guard hook wired in.
- [`../long-term/`](../long-term/) — if you want the dashboard for the core retirement sleeve. Swing here is the satellite sleeve.
- [`../options/`](../options/) — if you replace equity exposure with calls / debit spreads. Decision cards there should link back to the swing parent thesis.

## When to extract this into its own repo

Read [`../../profiles/swing/EXTRACT.md`](../../profiles/swing/EXTRACT.md). Default recommendation: yes, when ≥60% of trading attention lives here.

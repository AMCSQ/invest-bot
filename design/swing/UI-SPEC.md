# Swing Dashboard — UI Specification

Companion to [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md) and [`../EQUITIES-DASHBOARD.md`](../EQUITIES-DASHBOARD.md). This file is the per-profile UX contract for the **swing trader** persona (`profiles/swing/`). It overrides the equities adaptation wherever swing cadence demands; everything not overridden inherits.

Read [`../../profiles/swing/PLAYBOOK.md`](../../profiles/swing/PLAYBOOK.md) before this file. The UI is a faithful mirror of that playbook — if a workflow isn't in the playbook, it shouldn't be in the UI; if it's in the playbook, the UI must make it the easiest action.

---

## §0. Persona-bound UX premise

The swing trader has a **day job**. They are not at the screen during RTH. Every UX decision flows from three constraints:

1. **The trader cannot watch the tape midday.** The dashboard must therefore *discourage* midday interventions, not invite them. No live ticker by default. No flashing P&L. No countdown timers on watchlist rows. A live mode exists but is opt-in and is never the default landing surface.
2. **The weekend is the highest-leverage hour of the month.** Sunday-evening prep — screener + decision cards + watchlist — is where edges are built or lost. The UI dedicates its full real estate to this on Saturday/Sunday.
3. **Decisions are made at three known times: weekend prep, pre-market, EOD.** The dashboard ships **three explicit modes** corresponding to those windows, auto-selected by clock + day-of-week (overridable).

The single most important UX rule: **default to weekend mode on Sat/Sun; default to EOD mode after 16:00 ET on weekdays; default to pre-market mode 07:00–09:25 ET; otherwise show a low-touch read-only "Open positions" surface — never default to a live tape, because doing so tempts midday interventions that the playbook forbids.**

Visual density: **medium**. Daily candles default. Weekly review dominates Saturdays. Type scale shifts one notch up vs day-trading (body 14 → 15) because the trader is reading from a laptop on the kitchen table, not three 27" monitors.

---

## §1. Top-level layout — three modes

The shell is a `<ModeShell>` component that selects one of three layouts based on `now()` + `dayOfWeek` + an explicit user override stored in `localStorage.swing.mode`. The mode is shown as a chip in the top bar, clickable to override (overrides expire on next mode-change trigger).

### Mode A — Weekend prep (Sat/Sun, all hours)

Tailwind grid: `grid-cols-12 gap-6`

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar: brand · mode chip [WEEKEND PREP] · regime pill · account│
├──────────────────────────────────────────┬─────────────────────┤
│ ScreenerResultsPane (col-span-8)        │ DecisionCardComposer│
│  - saved-filter chips                    │  (col-span-4, sticky│
│  - results table, expandable rows        │   right rail)       │
│  - "add to decision card" per row        │  - 6-field form     │
│  - drag to reorder shortlist             │  - shortlist preview│
│                                          │  - watchlist export │
├──────────────────────────────────────────┴─────────────────────┤
│ RecentJournalStrip (col-span-12) — last 7 days, scrollable     │
│   thumbnails of closed trades for context while building plan  │
└────────────────────────────────────────────────────────────────┘
```

No chart in this mode — research is done via `/chart-render` skill side calls into PNG/HTML that the screener row expands inline.

### Mode B — Weekday / low-touch (Mon-Fri, 09:30–16:00 ET)

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar: brand · mode chip [LOW-TOUCH] · day P&L (muted) · acct │
├────────────────────────────────────────────────────────────────┤
│ OpenPositionsTable (col-span-12) — primary surface             │
│   columns: symbol, entry, current(stale-tinted), R-multiple,   │
│   days_held, stop, target, decision-card link, falsifiers chip │
├────────────────────────────────────────────────────────────────┤
│ WatchlistCondensed (col-span-8) │ TodayNewsStrip (col-span-4)  │
│  - one-line per name             │  - headlines for shortlist  │
│  - trigger status (armed/missed) │  - sentiment glyph per name │
│  - no live spark, last close only│  - sourced from /sentiment  │
└────────────────────────────────────────────────────────────────┘
```

The day-P&L number is rendered at `contentTertiary` opacity (65%) deliberately — visible if scanned, but not eye-catching. No animation on tick. The trader should not be checking this anyway; the playbook says so.

### Mode C — EOD (Mon-Fri, 16:00–20:00 ET)

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar: brand · mode chip [EOD] · today's R · expectancy delta │
├──────────────────────────────────────────┬─────────────────────┤
│ ClosedTradesToday (col-span-8)           │ ExpectancyWidget    │
│  - one card per fill                     │  (col-span-4, sticky│
│  - each expands into a JournalEntryForm  │   right rail)       │
│  - pre-fills R from entry/exit/stop      │  - rolling 30-trade │
│  - "deviation" chip set                  │   win%/avg-R chart  │
│                                          │  - this-week tally  │
├──────────────────────────────────────────┴─────────────────────┤
│ TomorrowTriggersStrip (col-span-12)                            │
│   shortlist names with armed triggers — pre-set reminders      │
└────────────────────────────────────────────────────────────────┘
```

Saturday morning gets a fourth pseudo-mode: **Weekly Review** (rendered before Mode A switches in). It's the `WeeklyTearsheetView` taking the full grid, with a "Done — proceed to Weekend Prep" CTA.

---

## §2. Component anatomy

Each component below ships as a single file under `web/components/swing/<Name>.tsx`. The shared primitives (`Card`, `Table`, `Tabs`, `Sheet`) come from shadcn.

### §2.1 `ScreenerResultsPane`

**Purpose:** primary surface during weekend prep. Lets the trader run the four canonical filter packs (`gap-and-go`, `52w-high-breakout`, `oversold-bounce`, `base-break`) and triage 25-100 candidates down to a 5-10 name shortlist.

**Anatomy:**
- **Header row** — saved-filter chips (`<FilterChip>`), each rendering one of the YAML packs in `data/screeners/`. Click toggles active. `+ New filter` opens an inline form. Active chip count badge ("3 filters · 47 results").
- **Toolbar** — sort (Symbol / Rel.Vol / Distance from 52w / ATR%), column toggles, "Save current as filter pack" button (writes to `data/screeners/<name>.yaml` via the screener skill).
- **Results table** — virtualized (react-virtuoso), 80 rows comfortable. Columns: checkbox · symbol · setup-tags · last · day Δ% · RVOL · ATR% · dist-52wH · earnings-days · spark-30d.
- **Row expansion** — clicking a row's chevron expands into a 320px panel below it with a `/chart-render`-produced PNG (daily candles, 6mo), the row's full ta-indicator table, and an "Add to decision card" button that prefills `DecisionCardComposer` with symbol + last + a draft entry/stop based on ATR.
- **Multi-select bar** — appears when ≥1 row checked: "Add N to shortlist · Export · Bulk decision cards (modal walks each)".
- **Empty state** — "No filter active. Pick a saved pack or click + New." with thumbnails of the four canonical packs.

**Skill chain:** reads `/equities-screener --filter-pack X --limit N`; writes to a transient client-side shortlist; on submit, calls `/decision-card new` per shortlist item.

**Keyboard:** `/` focus search, `j`/`k` row nav, `Enter` expand, `Space` toggle select, `Shift+A` add-to-card, `Shift+S` save filter.

### §2.2 `DecisionCardComposer`

**Purpose:** the Annie-Duke pre-mortem captured in 90 seconds per shortlist name. This is the central discipline lever — no trade goes on without a card.

**Anatomy:** 6-field form, vertical stack, generous touch targets (44px min):

| Field | Type | Validation | Notes |
|---|---|---|---|
| Thesis | textarea, 1 line | 1-160 chars | Counter visible; over-limit = soft warning, not blocked |
| Falsifier 1 | text | required, contains a number or date | "stop at $X breaks before $Y prints" |
| Falsifier 2 | text | required, must differ from #1 | Concrete + observable |
| Falsifier 3 | text | required, must differ from #1/#2 | Concrete + observable |
| Probability thesis | slider 0-100 | required, step 5 | Visual: arc gauge |
| Expected R | number | required, must equal `(target - entry) / (entry - stop)` within 0.1 | Auto-computed from the entry/stop/target you set in the row above; if mismatched, red-tint and refuse save |
| Bias most at risk | select | required | enum: FOMO, recency, anchoring, sunk-cost, confirmation, overconfidence |

**Tab order:** Thesis → F1 → F2 → F3 → Probability (arrow keys adjust) → Expected R → Bias → Save. Fully keyboard-driven; mouse never required.

**Auto-save:** debounced 800ms after last keystroke to `data/decisions/<order_id>.md` as YAML frontmatter + markdown body. Order ID is generated on first save (`ULID`). A "Saved 3s ago" pill under the Save button.

**Side panel:** below the form, a 200px-tall "Today's shortlist" list showing all cards composed this session — click any to load it back into the form for edits. Each row shows symbol, expected R, and a "completed/draft" pill.

**Export action:** "Write watchlist to `data/journal/YYYY-Www-watchlist.md`" button — assembles every completed card into the week's watchlist markdown per the playbook step 9.

**Skill chain:** `/decision-card new` to scaffold, `/decision-card save` to persist; consumed later by `/trade-journal` (matches order_id) and `/mistake-miner` (clusters by `bias_at_risk`).

### §2.3 `WeeklyTearsheetView`

**Purpose:** Saturday-morning review. Mirror of the `/quant-tearsheet` skill output, rendered as a tab strip rather than an HTML drop.

**Anatomy:** four tabs along the top, content area below.

| Tab | Content |
|---|---|
| **Returns** | NAV line chart (Lightweight Charts, line series, amber `#F0B429` for NAV vs `#A78BFA40` for SPY benchmark, both normalized to 100 at week start). KPI strip below: weekly return, vs SPY, Sharpe (annualized), Sortino. |
| **Drawdown** | Underwater plot. Max DD highlighted with a horizontal guide. Numeric: current DD, max DD this week, max DD trailing 30. |
| **Heatmap** | Day-of-week × week-of-month grid, colored by daily R. Hover for trade list of that day. |
| **Trades** | Table of every closed trade this week: symbol, side, entry, exit, R-realized, R-predicted (from decision card), deviation tag, lessons one-liner. Click symbol → opens that trade's journal file. |

**Header row:** "Week of YYYY-MM-DD" + "Export HTML" button (writes to `reports/tearsheet/YYYY-Www/index.html` via the skill). Adherence ribbon — "Adherence: 87%" — green if ≥80%, amber 60-80, red <60.

**Empty state:** if zero trades closed this week, render: "Quiet week. Use Weekend Prep mode to plan next week's setups." with a CTA to switch modes.

**Skill chain:** triggers `/quant-tearsheet --start <Mon> --end <Fri>` on first load; cached for 1 hour.

### §2.4 `JournalEntryForm`

**Purpose:** the EOD discipline tool — one form per fill (open or close) that writes a YAML-frontmatter MD per the schema in `/trade-journal`.

**Anatomy:** a card with two visual states.

**Open block** (when fill is an entry):
- Symbol (read-only, from fill)
- Side (read-only)
- Entry price, qty (read-only, from fill)
- Stop, target (editable, prefilled from decision card if linked)
- Setup tag (select: gap-and-go / 52w-breakout / oversold-bounce / base-break / other)
- Notes (textarea, 280 chars)
- "Link decision card" — autocomplete by recent decision cards, matches on symbol + draft order_id

**Close block** (when fill is an exit):
- Exit price, qty, exit timestamp (read-only)
- **R realized** — auto-computed `(exit - entry) / (entry - stop)`; rendered large + colored by sign
- **R predicted** — pulled from linked decision card; comparison delta shown ("predicted 2.0R, realized 1.3R → -0.7R deviation")
- Exit reason (select: target-hit / stop-hit / time-stop / falsifier-fired / discretionary-cut / discretionary-add)
- Deviation tags (multi-check): moved-stop, partial-unplanned, added-to-loser, held-past-target, exit-before-stop-or-target
- Lessons (textarea, 1 line "what I'd do differently")

**Save behavior:** writes/appends to `data/journal/YYYY-MM-DD/<order_id>.md`; recomputes `data/journal/expectancy.json` on close-block save (background job, expectancy widget polls).

**Validation gate:** can't save a close block without an exit reason. Can't save without at least one of (R realized matches predicted) OR (deviation tag set) — the trader cannot silently "just exit" without acknowledging the deviation.

**Skill chain:** `/trade-journal --action open|close ...`.

### §2.5 `OpenPositionsTable`

**Purpose:** weekday low-touch read-only view of what you currently hold. The simpler, calmer cousin of the day-trading `Watchlist`.

**Anatomy:** a sortable table, default sort by `days_held` descending.

| Col | Width | Render |
|---|---|---|
| Symbol | 80px | mono, click → opens decision card drawer |
| Entry | 80px | tnum |
| Current | 80px | tnum; **dim-tinted (`opacity: 0.65`) by default** — only refreshed on focus or page reload (no WebSocket), so it's clear this isn't a live ticker |
| R-multiple | 90px | colored, signed (▲/▼ glyph paired); no animation |
| Days held | 70px | `7d` etc.; amber tint if > 14d (approaching hold-horizon cap) |
| Stop | 80px | tnum; click → opens broker order ticket to edit |
| Target | 80px | tnum |
| Falsifiers | 100px | a small dot per falsifier from the decision card — green if not fired, amber if "watch", red if fired today |
| Card | 32px | document glyph → opens decision card in a side sheet |

**Stale-data badge:** at the top of the table, "Last refreshed 14:32 ET (3h ago)" — explicit, never hidden. A manual refresh button rather than auto-poll. The whole table is read-only by design in low-touch mode (clicking Stop or Target opens the broker UI in a new tab — we never embed an order ticket in low-touch mode).

**No live spark column.** No live P&L total at the bottom. If the trader needs the dollar number, it's in the broker.

### §2.6 `MistakeMinerSummary`

**Purpose:** the monthly retrospective. Only rendered on the first Saturday of the month, or on demand from the Review menu.

**Anatomy:** a single card, 600px max-width, centered.

- Header: "Month-end review · YYYY-MM"
- Top-5 leaks list — each row:
  - Rank badge (1–5)
  - Cluster label ("oversized after winner", "held loser past stop", "FOMO breakout chase", ...)
  - Trade count and dollar cost ("8 trades · -$1,240 · -3.4R")
  - "Sample trades" chip → opens drawer with the cluster's member trades
- "Drill for next month" textarea — the trader writes one concrete, violable rule. Validation: must contain a number ("no position > 1.0× baseline for 3 trades after any winner > 2R"). Saves to `data/tilt_rules.md`.
- Expectancy delta vs prior month — small KPI row (win%, avg-R, expectancy).
- "Email me this on the 1st of next month" toggle.

**Skill chain:** `/mistake-miner run --since <first-of-last-month> --top 5` on first load.

### §2.7 `BacktestExplorer`

**Purpose:** quarterly setup recalibration. The user picks a strategy file from `strategies/<name>/`, picks a basket + lookback, runs, and reviews.

**Anatomy:** two-column inside a `<Sheet>` triggered from the Review menu.

- **Left:** strategy picker (dropdown of `strategies/*/`), symbol basket input (multi-line tickers or "S&P 500 large-cap" preset), lookback (90d / 365d / max), timeframe (1d default), commission/slippage inputs (defaulted from `data/state.yaml`).
- **Right:** results panel — Sharpe / Sortino / Calmar / max DD / win rate / profit factor / # trades / avg R. Equity curve plot (Lightweight Charts line). "Open full report" → opens the Bokeh plot from `reports/backtest/<setup>/<ts>/` in a new tab.
- **Footer:** drift gate banner — compares to last recorded run for this strategy: "Sharpe drift -0.42 vs Q1 baseline → recalibrate". Green = drift ≤ 0.3, amber 0.3-0.5, red > 0.5.
- **"Promote to live"** — rarely used; opens a confirmation modal listing the gate checks (Sharpe ≥ 0.5, ≥ 30 trades in backtest, drift acknowledged). Only enabled if all gates pass.

**Skill chain:** `/backtest-runner --strategy X --symbol <basket> --timeframe 1d --years N`.

---

## §3. Type and color

Reference [`../code/tokens.ts`](../code/tokens.ts). Swing-specific tweaks:

- **Body size:** 15px (not 14) — laptop reading distance, less density needed.
- **Eyebrow / caption:** keep 11/10px — used sparingly.
- **R-multiple coloring:** green/red allowed but **muted** — use `success` / `danger` at `opacity: 0.85`, never with motion. No flash on tick. No glow.
- **Stale tint:** any "current" / "live" number that hasn't refreshed in > 60s renders at `contentTertiary` (65%) with a small clock glyph. This is a swing-specific token, name it `--swing-stale-fg`.
- **Mode chip colors:**
  - Weekend Prep — violet `accent.300`
  - Low-Touch — neutral grey `contentSecondary` (deliberately boring)
  - EOD — amber `warning`
  - Weekly Review — violet `accent.400`

The violet bloom from the parent brief is **kept** but reduced to 40% opacity — calmer surface, less "live terminal" energy.

---

## §4. Interaction surface

Swing UX is **form-first, tab-heavy**. The two highest-friction surfaces — DecisionCardComposer and JournalEntryForm — are designed for a Tuesday-evening laptop session with one hand on the trackpad.

Global shortcuts:
- `g w` → Weekend Prep mode
- `g l` → Low-touch mode
- `g e` → EOD mode
- `g r` → Weekly Review
- `n d` → new decision card
- `n j` → new journal entry (most recent fill)
- `?` → keyboard shortcut sheet

No drag-and-drop required for any core workflow. Drag-to-reorder shortlist is a nice-to-have.

---

## §5. Data shape

Reads (all paths relative to repo root, all written by skills):

- `data/quotes/<symbol>.parquet` — daily OHLCV; `market-data` skill output.
- `data/journal/YYYY-MM-DD/<order_id>.md` — per-fill journal.
- `data/journal/expectancy.json` — rolling expectancy.
- `data/journal/YYYY-Www-watchlist.md` — weekly watchlist.
- `data/journal/YYYY-Www-review.md` — weekly review.
- `data/decisions/<order_id>.md` — decision cards.
- `data/screeners/<name>.yaml` — saved filter packs.
- `data/state.yaml` — pre-trade checklist output.
- `data/tilt_rules.md` — drill rules from monthly review.
- `reports/screener/<UTC-ts>/` — weekend scan results.
- `reports/reviews/YYYY-MM.md` — mistake-miner output.
- `reports/tearsheet/YYYY-Www/` — quantstats tearsheet HTML.
- `reports/backtest/<setup>/<UTC-ts>/` — backtest runs.
- `strategies/<name>/` — backtest scaffolds.

Writes (UI → disk, via skill or direct):
- `data/decisions/<order_id>.md` (DecisionCardComposer auto-save)
- `data/journal/YYYY-MM-DD/<order_id>.md` (JournalEntryForm)
- `data/screeners/<name>.yaml` (ScreenerResultsPane save-pack)
- `data/tilt_rules.md` (MistakeMinerSummary drill)
- `localStorage.swing.mode` (mode override)
- `localStorage.swing.shortlist` (transient shortlist between weekend-prep sessions)

No direct broker writes from this UI in v1. The order ticket lives in the broker; the dashboard tracks but does not place.

---

## §6. Mobile

Swing trading is one of the few profiles where **mobile is genuinely useful** — the trader is on their phone at lunch, can log a thesis from a coffee shop, can check open positions before bed.

**Bottom nav (4 tabs, fixed):**

| Tab | Surface |
|---|---|
| Positions | OpenPositionsTable, simplified to symbol + R + days_held + falsifiers |
| Watchlist | Weekend-prep shortlist, read-only — entry/stop/target visible |
| Journal | Today's fills + "Open new entry" CTA — JournalEntryForm renders as a full-screen modal |
| Review | This-week tearsheet snippets + month leaks if mid-month |

**DecisionCardComposer on mobile:** full-screen modal, one field per screen with a progress dot row (1/6 · 2/6 · ...), Next/Back at the bottom. Field-per-screen prevents thumb-fumble and respects the 90-second budget — you cannot bail halfway through and end up with a half-card.

**No live data on mobile.** Same rule as desktop low-touch mode. The phone is the most tempting tap-target during the workday; the design refuses to reward it.

---

## §7. Accessibility

- **Form labels associated** via `htmlFor` / `id` on every input in DecisionCardComposer and JournalEntryForm — required for screen reader walkthrough.
- **DecisionCardComposer accepts a keyboard-only flow** end-to-end: Tab progresses fields, arrow keys adjust the probability slider, Enter submits. No focus traps that require a mouse to escape.
- **R-realized** in JournalEntryForm announced via `aria-live="polite"` so SR users hear the computed value when entry/exit/stop are filled.
- **OpenPositionsTable** rows are `role="row"` with explicit `aria-label="AAPL · +1.4R · held 7 days"`.
- **Stale data** announced with "last updated N minutes ago" in an `aria-describedby` rather than visual-only dimming.
- **Color encoding** for R-multiples is paired with `▲`/`▼` glyphs always.
- All 24 items from the parent brief's checklist (`../DASHBOARD-BRIEF.md` §12) still apply.

---

## §8. Performance budget

- **Route JS ≤ 150KB gzip** (tighter than the parent's 180KB — swing has no live tape, no candlestick library required in low-touch mode).
- **Lightweight Charts loaded only in WeeklyTearsheetView and BacktestExplorer** via `dynamic(() => import(...), { ssr: false })`.
- **No WebSocket connection by default.** Even in EOD mode, data is fetched once on mode entry, then on user-triggered refresh. The trader is not paying for streaming; the broker is.
- **LCP < 2.0s** target on Low-Touch landing (the most-visited surface during the workweek).
- **No motion in Low-Touch mode** — `prefers-reduced-motion: reduce` is forced via `data-mode="low-touch"` attribute on the root. Calm by design.

---

## §9. What this profile does NOT have

- **No live HeroChart.** Daily candle refresh is sufficient. There is no real-time candle on the swing dashboard. Even Weekly Review uses cached daily bars.
- **No order ticket on weekends.** Decision cards are not orders. Orders are placed pre-market Monday via the broker's UI. The dashboard never embeds a live order form in Weekend Prep mode.
- **No `tilt-guard` PreToolUse hook.** Swing cadence (3-10 trades/week) doesn't generate the rolling features tilt-guard needs to be reliable. The MistakeMinerSummary drill + monthly playbook discipline is the substitute. The persona's CLAUDE.md confirms tilt-guard is "kept available but not default-loaded" — the UI honors that.
- **No 0DTE-style countdown timers.** Holds are days, not minutes. Showing a "time to close" ticker invites the wrong cadence.
- **No live P&L flashing during work hours.** The dollar number is rendered at tertiary opacity, no motion, no animation. The trader checks it on EOD, not at lunch.
- **No FOMO ticker / "top gainers" widget.** The screener picks setups by playbook rule, not by leaderboard.
- **No multi-pane CEX-style 4-up.** The screen is single-purpose at any given moment (one of the three modes).
- **No copy-trade leader cards.** The swing trader is the leader of their own book. Borrowing setups from strangers is an anti-pattern for this persona.

---

## §10. Skill chains the UI surfaces

Every component above maps to one or more skills from `.claude/skills/`. The UI is essentially a GUI front-end to:

| UI surface | Skill chain |
|---|---|
| ScreenerResultsPane | `/equities-screener`, `/ta-indicators`, `/chart-render` |
| DecisionCardComposer | `/decision-card new`, `/decision-card save` |
| Pre-market triggers (Mode B header) | `/session-warmup`, `/pre-trade-checklist` |
| OpenPositionsTable (link → cards) | `/decision-card show` |
| JournalEntryForm | `/trade-journal --action open\|close` |
| Expectancy widget | reads `data/journal/expectancy.json` (written by `/trade-journal`) |
| WeeklyTearsheetView | `/quant-tearsheet` |
| MistakeMinerSummary | `/mistake-miner run` |
| BacktestExplorer | `/backtest-runner`, `/pine-new`, `/pine-to-python` |
| Watchlist news strip | `/sentiment-scan`, `/market-data` |
| Regime pill (top bar) | `/regime-detect --symbol SPY` |

The UI never duplicates skill logic — it surfaces, schedules, and renders. Every persisted artifact is a file the skill could have produced from the CLI.

---

## §11. Anti-patterns avoided

1. **No FOMO ticker** — the dashboard does not surface "top gainers", "most active", or "what's moving now". Setups come from the playbook's filter packs, not from a leaderboard.
2. **No live P&L flashing during work hours** — Low-Touch mode mutes the day P&L and refuses any motion on it. The trader will lose focus on their day job if a green number flashes on a forgotten tab.
3. **No countdown timers on watchlist rows** — holds are days, not minutes. A countdown invites a different (wrong) cadence.
4. **No "one-click trade" from the dashboard** — every trade requires a decision card. The UI structurally enforces this: there's no order button on the OpenPositionsTable or Watchlist.
5. **No silent stop-moves** — the journal form refuses to save a close without explicitly tagging the deviation (moved stop, added to loser, etc.).
6. **No mode-mixing** — you cannot accidentally compose a decision card while staring at a live P&L. Modes are exclusive by design.
7. **No streaming WebSocket** — the entire dashboard runs on file reads + on-demand REST fetches. Less infra, less temptation.

---

## §12. Open questions / next iteration

- **Should EOD mode auto-trigger a `/mistake-miner` warm cache** at month-end so the first-Saturday review loads instantly? Probably yes.
- **Decision-card mobile flow** — should we accept voice input for the thesis field? (90s budget, hands often busy.) Investigate Web Speech API.
- **Watchlist trigger-armed notifications** — opt-in push notification on Monday morning if the user explicitly enabled it during weekend prep, sent at 09:25 ET. Out of scope for v1, flagged for v2.
- **Cross-profile bridge** — if the user opens an options replacement of a swing thesis, where does the decision card live? Probably in `../options/` with a `parent_thesis` link back to the swing card. Coordinate when the options profile UI ships.

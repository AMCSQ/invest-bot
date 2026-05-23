# Long-Term Profile — UI Specification

Companion to [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md). This file is the **long-term buy-and-hold** UI brief — a deliberate inversion of the day-trading flavored sibling at [`../EQUITIES-DASHBOARD.md`](../EQUITIES-DASHBOARD.md). Read the persona at [`../../profiles/long-term/CLAUDE.md`](../../profiles/long-term/CLAUDE.md) and the routines at [`../../profiles/long-term/PLAYBOOK.md`](../../profiles/long-term/PLAYBOOK.md) before touching this UI.

---

## §0. Persona-bound UX premise

> Boring is good. The dashboard's job is to **surface drift**, not generate decisions.

The long-term user opens this dashboard **once a month** (per the M1 routine in `PLAYBOOK.md`) and **once a quarter** for the factor-tilt audit. Annually they do the IPS review, retire-fire refresh, and tax-loss harvest sweep. That is the entire interaction surface — under 20 visits a year.

Design consequences:

- **No live anything.** Quotes refresh on page load. Maybe once an hour via a stale-while-revalidate hook. There is no WebSocket, no 10Hz tick, no animated count-up of P&L.
- **Default time-bucket is the month, not the day.** Day-level P&L is anti-information at this horizon; staring at daily noise erodes the very discipline this profile exists to support.
- **No order ticket. No broker. No tilt-guard pill.** This profile is **read-only**. The only writes a user makes from the UI are "mark rebalanced" and "log dividend received" — both annotations on YAML files, not orders.
- **No green/red dopamine cues on holdings.** A holding being down 3% YTD does not need to be screaming red — that triggers a sell impulse that is the exact behavior we are paid to prevent. PnL coloring is **muted** and confined to the YTD KPI tile.
- **No FOMO.** No "next earnings in 2d 14h" countdown timers. No "you missed X% gain since signal" framing. We surface **drift versus plan**, not market-relative performance.

The aesthetic vocabulary inherited from `DASHBOARD-BRIEF.md` (Inter, JetBrains Mono for numerics, tabular-nums, the surface/elevated card pattern, motion tokens) carries over. The **violet bloom is removed** — it is a casino flourish that does not belong in a 30-year planning tool.

---

## §1. Visual density and tone

Low. Generously sized type, broad whitespace, large hit targets. Refactoring UI rule of thumb: **fewer-but-bigger-numbers** beats dashboard-soup.

| Property | Day-trading (`EQUITIES-DASHBOARD.md`) | Long-term (this doc) |
|---|---|---|
| Default time-bucket | 1m / 5m / 1D candles | Monthly close, annual rollups |
| Cards per fold | 8–12 (KPI strip + chart + ticket + watchlist) | 4–5 (KPIs + one chart + holdings) |
| Hero accent color | Violet bloom + amber chart line | **None.** Surface neutrals only. |
| Animated number tween | Yes (`AnimatedNumber.tsx`) | **No.** Set-final-value, no count-up. |
| Chart type | Candles + overlays + crosshair | Single line, percentile cone, 5y x-ticks |
| Update cadence | Live WebSocket | On page load + SWR every 60 min |
| Sound on event | Optional fill chime | Never |

The accent color **is reused from `code/tokens.ts`** (`accent.300` `#8B5CF6`) but only as a **focus ring + selected-row marker** — not as a brand element splashed across the page. Long-term users find vivid accent colors anxiety-inducing when applied to portfolio surfaces; the design intent is "a banker's spreadsheet, not a fintech app."

---

## §2. Top-level layout

12-column grid, 1280 max-width (narrower than the day-trading 1440 — there is less content to spread). Tailwind sketch:

```jsx
<main className="mx-auto max-w-[1280px] px-6 py-8 space-y-8">
  {/* Hero KPI strip — 5 tiles, equal columns */}
  <section
    aria-label="Portfolio snapshot"
    className="grid grid-cols-2 md:grid-cols-5 gap-4"
  >
    <KpiTile label="Net Worth"          variant="long-term" />
    <KpiTile label="Allocation Drift"   variant="long-term" />
    <KpiTile label="YTD Realized PnL"   variant="long-term" />
    <KpiTile label="Next Rebalance"     variant="long-term" />
    <KpiTile label="Years to Goal"      variant="long-term" />
  </section>

  {/* Allocation visualization — stacked bar (recommended) */}
  <section aria-label="Asset allocation vs target"
           className="rounded-xl bg-surface p-6">
    <AllocationBar />
  </section>

  {/* Holdings table */}
  <section aria-label="Holdings"
           className="rounded-xl bg-surface p-6">
    <HoldingsTable />
  </section>

  {/* Glide-path projection */}
  <section aria-label="Glide path to retirement"
           className="rounded-xl bg-surface p-6">
    <GlidePathChart />
  </section>

  {/* Rebalance + dividend panel (small, sticky on desktop) */}
  <section aria-label="Maintenance actions"
           className="rounded-xl bg-surface p-6">
    <RebalancePanel />
  </section>
</main>
```

There is **no aside, no sticky right panel**. The day-trading layout uses an 8/4 split because the order ticket must always be visible; here there is no ticket, so the page reads as a single column of equal-priority cards.

### Eye path

Hero KPIs → Allocation bar → Holdings table → Glide-path chart → Rebalance panel. Linear top-to-bottom; the user scans for "any tile red?", then scrolls if a deeper look is warranted. **Most months they will see no red and close the tab.** That is the success state.

---

## §3. Component anatomy

### 3.1 `KpiTile` (long-term variant)

Reused from `../code/` — same shell as the day-trading version, but with three behavioral differences:

1. **Delta is month-over-month**, not day-over-day. Eyebrow reads `MoM` not `1D`.
2. **No live updates.** The animated count-up is suppressed (`prefers-reduced-motion: reduce` is the equivalent path; here we always treat it as reduced).
3. **PnL coloring is muted.** Use `contentSecondary` for the delta text and a thin colored underline (1px, 30% opacity) rather than a filled chip.

Five tiles, in order:

| Tile | Source | Value format | Delta semantics |
|---|---|---|---|
| **Net Worth** | sum(positions × close) + cash | `$1.24M` (compact) | MoM change in dollars |
| **Allocation Drift** | max(\|current% − target%\|) across sleeves | `4.2pp` (percentage points) | Color: green ≤3pp, amber 3–5pp, red >5pp |
| **YTD Realized PnL** | sum(closed-trade pnl this calendar year) | `$8,420` | Subtitle: "(tax-relevant)" |
| **Next Rebalance** | scheduled date (from `data/positions/holdings.yaml` `rebalance_cadence`) | `Jan 2027` or `In 8 months` | If drift >5pp, append "(triggered now)" badge |
| **Years to Goal** | from `retire-fire` last cached run | `14.3 y` | Subtitle: "to $X at Y% spend" |

Allocation Drift is the **single most important number on the page**, because it is the one input the user actually acts on. It gets the same visual weight as Net Worth.

### 3.2 `AllocationBar` — horizontal stacked bar

**Recommendation: stacked bar, not pie.** Per Refactoring UI / Cleveland 1985, humans compare lengths along a common scale better than they compare angles. A horizontal stacked bar lets the user read both *current weights* and *target weights* by stacking two bars vertically:

```
Current:  [████ US Equity ████][██ Intl ██][█ Bond █][REIT][C]
Target:   [███ US Equity ███][██ Intl ██][█ Bond █][REIT][C]
          0%                                                100%
```

Drift bands are encoded via a thin **delta strip** above the current bar:

- ≤2pp drift: no marker (in-band).
- 2–5pp drift: amber tick.
- >5pp drift: red tick + a tooltip "Rebalance now: VTI is 6.4pp over target."

Implementation: **visx** (`@visx/shape` `BarStackHorizontal`). No need for Recharts here — single static render, sub-1KB once tree-shaken. Lightweight Charts is overkill (it is a time-series engine).

Asset-class sleeves are the rows of `data/positions/holdings.yaml`'s `target_allocation` block — typically 4–7 sleeves (US equity, international equity, bonds, REITs, cash, optional factor tilt).

### 3.3 `HoldingsTable`

Virtualized table (TanStack Table + `react-virtual`) for users with 200+ tax lots across multiple accounts. Group-by-account by default, drift-sort as the secondary default.

Columns:

| Col | Width | Notes |
|---|---|---|
| Ticker | 80px | mono, `tnum` |
| Account | 120px | "401k · Fidelity", "Roth IRA · Vanguard", "Taxable · Schwab" |
| Shares | 90px | mono, `tnum`, `slashed-zero` |
| Cost Basis | 100px | mono, compact `$12.4k` |
| Market Value | 110px | mono, compact |
| Weight | 80px | `12.4%` |
| Target Weight | 80px | `10.0%` |
| Drift | 80px | `+2.4pp`, color-tinted underline only |
| YTD Yield | 80px | dividend yield from `data/contributions/YYYY.yaml` |

Default sort: **drift desc** so the user sees what needs attention first. Secondary sort: account, then weight.

`aria-sort` on every sortable header. Row keyboard navigation via arrow keys (no vim bindings — long-term users are not Bloomberg-trained, plain arrow keys plus Enter to expand a row are sufficient).

Row click → expands inline to show:
- Lot-by-lot cost basis (relevant for tax-loss harvest sweep).
- Last 4 dividend distributions (from `data/contributions/`).
- "Notes" textarea bound to the holding's free-form note in YAML.

### 3.4 `GlidePathChart`

Single line — **projected real-dollar portfolio value to retirement age** — with a Monte Carlo percentile cone overlay (10th / 25th / 75th / 90th).

- **Library:** visx `LinePath` + `AreaClosed` for the cone. **Not** Lightweight Charts — it is built for OHLC time series and its time scale wants market data. visx gives full control of a 30-year x-axis.
- **X-axis:** 5-year ticks (e.g. `2030, 2035, 2040, …, 2060`).
- **Y-axis:** **log scale** above the median retirement-asset crossover. Linear below it. The crossover label reads "Retirement: $1.5M in 2055."
- **Center line:** median Monte Carlo outcome from the cached `retire-fire` run. Color: `contentSecondary`, not accent — this is informational, not promotional.
- **Cone fill:** `accent.300` at 8% opacity for 25–75th, 4% opacity for 10–90th.
- **Annotations:** vertical guide at "today," vertical guide at user's chosen retirement age, horizontal guide at "spending floor."
- **Source:** `reports/annual-review/YYYY/retire-fire/output.json`. If older than 365 days, the chart shows a "Refresh — last run 14 months ago" CTA that triggers the `retire-fire` skill via a slash-command link, not an in-app run.

### 3.5 `RebalancePanel`

Two-row card at the bottom of the page. Read-only by default; the two writes are:

1. **"Mark rebalanced"** button — appends a dated entry to `data/positions/holdings.yaml`'s `rebalance_log:` list. Disabled if no drift is >2pp.
2. **"Log dividend received"** mini-form — symbol + amount + date → appends to `data/contributions/YYYY.yaml`'s `dividends:` array (per M2 in `PLAYBOOK.md`).

Above the buttons, two facts:

- "Next scheduled rebalance: **Jan 1, 2027** (in 8 months)."
- "Drift threshold: rebalance when any sleeve exceeds **±5pp** from target."

Both pull from the `rebalance_rules:` block of `holdings.yaml`. If drift exceeds the threshold, the panel surfaces a subtle amber border and the lead sentence flips to: "Drift exceeds threshold. Consider deploying the next contribution to **VXUS** (4.2pp under target)." — this is the rebalance-by-contribution heuristic from `PLAYBOOK.md` E1.

There is **no "Place trade" button.** Acting on the suggestion requires opening the user's brokerage in a new tab. By design.

---

## §4. Type and color

Reference the shared tokens at [`../code/tokens.ts`](../code/tokens.ts). Long-term overrides:

- **Body type:** Inter 14px / 1.5 line height. Hero KPI numbers at 32px (not 40px — slightly smaller than the day-trading hero; long-term reading is calmer, less of a "wall of numbers" feel).
- **Mono everywhere on numerics:** `font-variant-numeric: tabular-nums slashed-zero;` is non-negotiable. A table of 80 holdings with non-tabular figures is unreadable.
- **Accent color usage:** `accent.300` for focus rings, selected row left-border (3px), and the Monte Carlo cone fill. **Nowhere else.** No accent-colored buttons, no accent KPI tile borders.
- **PnL coloring:** `success` / `danger` from tokens, but applied at **40% opacity as a 1px underline** rather than as filled text. This is the "tone-down" the brief asks for — long-term users find vivid PnL flashes anxiety-inducing.
- **Surface elevation:** flat. One card depth (`surface`). No `surfaceElevated`. There is nothing to layer.

The violet bloom from `DASHBOARD-BRIEF.md §1` is **deleted from this profile**. Replace with a flat `bg` (`#0B0B12`) or, for the Streamlit deployment, the default light theme — long-term users frequently view this dashboard on a desktop in daylight (monthly cadence, not after-hours), and the dark-only assumption from the trading dashboards does not survive contact with that use pattern.

---

## §5. Interaction surface

The full inventory of UI affordances on this dashboard:

| Affordance | Effect | Writes? |
|---|---|---|
| Sort a `HoldingsTable` column | Local state | No |
| Expand a holding row | Reveal lot detail + notes | No |
| Edit a holding note | Inline `<textarea>` debounced 1.5s | Yes → `data/positions/holdings.yaml` |
| Switch glide-path mode (Historical / Monte Carlo) | Re-render from cached JSON | No |
| "Mark rebalanced" | Append `rebalance_log` entry | Yes → YAML |
| "Log dividend received" | Append `dividends` entry | Yes → YAML |
| "Refresh glide path" | Deep-link to `/retire-fire` slash command | No (skill runs separately) |
| Keyboard `/` | Focus the holdings filter input | No |
| Keyboard `?` | Open the help overlay | No |

Nine affordances total. The day-trading dashboard has 40+. This is intentional.

---

## §6. Data shape

### Read from `data/positions/holdings.yaml`

```yaml
target_allocation:
  us_equity:      0.45
  intl_equity:    0.20
  bonds:          0.25
  reit:           0.05
  cash:           0.05

rebalance_rules:
  band_pp:        5
  cadence_months: 12

holdings:
  - symbol:   VTI
    account:  "Taxable · Schwab"
    sleeve:   us_equity
    shares:   412.18
    cost_basis_total: 78_400.00
    notes:    "Core US equity sleeve."
    lots:
      - {date: 2018-03-12, shares: 100, cost: 18_400}
      - {date: 2020-04-08, shares: 200, cost: 32_000}
      - {date: 2023-11-22, shares: 112.18, cost: 28_000}

rebalance_log:
  - {date: 2025-01-04, kind: "annual", note: "trimmed VTI, bought BND"}
```

### Read from broker

**Nothing.** This profile is read-only — `CLAUDE.md` says "Default broker: NONE."

### Read from `market-data` (yfinance)

- Daily close per holding, last 30 days (for the holdings table's market-value column).
- Daily close per holding, last 5 years (only if the user expands the glide-path "actuals overlay" — opt-in).
- Trailing 12-month dividend per holding (for the YTD yield column, cross-checked against `data/contributions/YYYY.yaml` `dividends:`).

Cached aggressively. SWR with a 60-minute revalidate window. yfinance is rate-limited; we never poll.

### Read from `data/contributions/YYYY.yaml`

- `dividends:` array — feeds the holdings table's YTD yield column and the Net Worth tile's MoM delta.
- `contributions:` array — feeds the "next contribution lands" hint in `RebalancePanel`.

### Read from `reports/annual-review/YYYY/retire-fire/output.json`

- `success_rate_historical` and `success_rate_monte_carlo`.
- `percentile_paths` (10 / 25 / 50 / 75 / 90).
- `safe_withdrawal_rate`.

If the file is missing or older than 365 days, the glide-path card renders a "Run the `retire-fire` skill — this projection is stale" placeholder instead of a chart.

---

## §7. Mobile

Bottom-nav, four tabs. Default landing: **Allocation**.

| Tab | Renders |
|---|---|
| Allocation | KPI strip (2-column on mobile) + `AllocationBar` |
| Holdings | `HoldingsTable` (account grouping; column count drops to Ticker / Weight / Drift) |
| Glide Path | `GlidePathChart` (re-renders smaller; cone simplified to 25/75 only) |
| Reviews | Index of `reports/monthly/`, `reports/quarterly-review/`, `reports/annual-review/` |

No bottom sheet for actions (the day-trading dashboard uses one for the order ticket — irrelevant here). The "Mark rebalanced" and "Log dividend received" actions are pushed to the bottom of the Allocation tab, not lifted into a persistent FAB.

There is no live data on mobile because there is no live data on desktop. The mobile experience is "check on the plan on the train, not trade from a phone."

---

## §8. Accessibility

Inherit the 24-item checklist from `DASHBOARD-BRIEF.md §12`. The long-term-specific items:

1. **All numbers expose full precision via `aria-label`.** Display `$1.24M`, but `aria-label="One million two hundred forty thousand dollars"`. Compact notation is for the eye, not the screen reader.
2. **Sortable tables expose `aria-sort`** on every header (`ascending` / `descending` / `none`).
3. **`GlidePathChart` has a data-table fallback.** A `<details><summary>` adjacent to the chart, expanding into a year-by-year table of (Year, 10th, 25th, 50th, 75th, 90th). Screen-reader users get the full data without ASCII art interpretation of a canvas.
4. **No color-only meaning.** Drift bands always pair with text ("+4.2pp over target") or a glyph (▲▼▬), never the color alone.
5. **No live regions at all.** There is no streaming data to announce; `aria-live` is unset on every numeric. Screen readers should never be spammed by this dashboard.
6. **Keyboard focus is fully linear.** Tab through KPI tiles → Allocation bar tooltips → Holdings table rows → Glide-path detail → Rebalance buttons. No focus traps, no chord shortcuts.
7. **Contrast ≥ 7:1 for body text** (AAA, not just AA). This dashboard is read at-rest in daylight; AA is the floor for product surfaces, AAA the right target for planning surfaces read carefully.

---

## §9. Performance budget

| Resource | Budget | Notes |
|---|---|---|
| Route JS (gzipped) | **< 100 KB** | The simplest profile in the repo. No charting library bundle, no broker SDK, no WebSocket client. |
| LCP | < 1.8 s | Faster target than the trading dashboards because there is no live data dependency. |
| INP | < 100 ms | Only interactions are table sort and tab switch. |
| CLS | 0 | Every card reserves its block-size. KPI tiles use `min-block-size` to prevent number-jitter shift. |
| Fonts | One weight Inter + JetBrains Mono mono numerals subset | `font-display: swap`, preload. |

If the deployment is **Streamlit**, the JS budget is irrelevant; Streamlit's runtime is ~2MB out-of-the-box, but the project's overhead is constant rather than per-page. For Streamlit, the budget reframes as: page renders < 2s on a cold cache, < 500ms on a warm one.

The `web/` Next.js path applies the 100KB budget. Lightweight Charts is **not** in the bundle (we use visx for the two static charts). framer-motion is **not** in the bundle (no animated count-ups). wagmi / viem / RainbowKit are **not** in the bundle (no wallet).

---

## §10. What this profile does NOT have

Explicit non-features. If a future contributor proposes any of these, point them at this section and the persona doc:

- **No candlesticks.** Anywhere. The hero chart is a line; the holdings table has no per-row sparkline (sparklines invite daily-noise comparison).
- **No `chart-render` skill invocation.** The chart-render skill produces annotated candlestick PNGs — useful for swing/day-trading review, irrelevant at decade horizon. If the user asks for one, redirect to `../swing/`.
- **No order ticket.** No buy/sell button. No quantity input. No "preview order." The dashboard cannot place trades. Period.
- **No tilt-guard pill.** The tilt-guard hook is a `PreToolUse` interceptor on broker MCP tool calls. There are no broker MCP tool calls in this profile. The pill would be measuring something that cannot happen.
- **No live WebSocket.** No `usePriceStream` hook. The `DataAdapter`'s `subscribe` method is never called. Quotes are pulled on page load and stale-while-revalidated hourly.
- **No TradingView Charting Library.** The TV embed is in `../code/TVEmbed.tsx` — for swing and day-trading. The long-term dashboard does not import it.
- **No real-time alerts.** No webhook receiver. No "ping me when VTI drops 5%."
- **No options chain, no Greeks, no IV surface.**
- **No SMC patterns, FVGs, order blocks, BOS.** Decade-horizon SMC is a contradiction in terms.
- **No leaderboard / copy-trading cards.** That is for an entirely different profile (and is not in this repo at all).
- **No favorited-star animation, no count-up tween.** Both are dopamine UX patterns. Inappropriate here.
- **No daily P&L tile.** The KPI strip's `YTD Realized PnL` is the smallest time-bucket exposed. There is no `Day P&L` because the day is the wrong unit.

---

## §11. Recommended deploy targets

In order of fastest-to-ship to most-polished:

### 11.1 Streamlit (default; recommended)

The `dashboard-build` skill scaffolds this for the user. Pros:

- Allocation pie/bar, holdings table, and glide-path chart are 30 lines each with `st.altair_chart` or `plotly_express`.
- YAML round-trip (read `holdings.yaml`, write `rebalance_log`) is native Python.
- Deploy via Streamlit Community Cloud or `streamlit run app.py` locally — the user opens it once a month, no hosting cost.
- Theme: light by default for daytime readability; the user toggles `~/.streamlit/config.toml` if they want dark.

This is the right default for the long-term user because they don't need cross-device live access; they need a tool that opens locally, computes drift, and closes.

### 11.2 Static Next.js with SSG

If the user already runs the `web/` app and wants a unified UI: build the long-term route as a fully static page (`export const dynamic = 'force-static'`). The page reads `holdings.yaml` and `retire-fire/output.json` at build time, ships zero client JS for data fetching.

- No API routes needed.
- The two writes ("Mark rebalanced" / "Log dividend received") become small `<form>` POSTs to a tiny server action that mutates the YAML and triggers a static rebuild.
- Deploys to Vercel / Cloudflare Pages / GitHub Pages cleanly.

### 11.3 Observable notebook for the glide-path

The glide-path chart in particular suits an Observable notebook — interactive parameter knobs (retirement age, spending rate, equity %) without a build step. Recommend Observable as a **complement** to Streamlit, not a replacement: the notebook lives in `reports/annual-review/YYYY/glide-path.ipynb` (or as a hosted Observable doc) and is opened during the A2 retire-fire routine.

---

## §12. Skill chains the UI surfaces

The dashboard is a **read surface for skill outputs**. The skills that produce its data:

| UI element | Skill that feeds it | Output path read |
|---|---|---|
| `KpiTile · Net Worth` | `market-data` (price), local YAML (shares) | `data/positions/holdings.yaml` |
| `KpiTile · Allocation Drift` | computed in-page from `holdings.yaml` | (none) |
| `KpiTile · YTD Realized PnL` | local YAML | `data/contributions/YYYY.yaml` |
| `KpiTile · Years to Goal` | `retire-fire fire-historical` | `reports/annual-review/YYYY/retire-fire/output.json` |
| `AllocationBar` | computed in-page | `data/positions/holdings.yaml` |
| `HoldingsTable · Drift` | computed in-page | `holdings.yaml` |
| `HoldingsTable · YTD Yield` | local YAML | `data/contributions/YYYY.yaml` |
| `GlidePathChart` | `retire-fire fire-monte-carlo` | `reports/annual-review/YYYY/retire-fire/percentile_paths.csv` |
| `RebalancePanel · suggested target` | `portfolio-optimize hrp` (optional, last-cached) | `reports/quarterly-review/YYYY-Qn/optimize.json` |
| Holdings expand row · "Overlap with VTI?" | `etf-analyzer overlap` (link out) | (CLI invocation) |
| Holdings row marked at a loss | `tax-loss-harvest scan` (link out) | (CLI invocation) |
| Sidebar "Debts" link | `debt-payoff avalanche` | `reports/annual-review/YYYY/debt-payoff.md` |

Slash-commands the UI exposes as deep-links (not in-page runs):

- `/portfolio-optimize` — re-optimize target weights with HRP or min-vol.
- `/etf-analyzer overlap VTI SCHD` — quarterly overlap audit (Q2 routine).
- `/retire-fire fire-historical` — annual refresh (A2 routine).
- `/tax-loss-harvest scan` — December sweep (A3 routine).
- `/debt-payoff avalanche` — windfall decision-tree (E2 routine).

These slash-commands open in the user's terminal `claude` session inside `profiles/long-term/`, not as an in-page modal. The dashboard is a **read** surface; skill invocation stays in the LLM-driven CLI.

---

## §13. Anti-patterns this profile must NOT exhibit

Tracked in the spirit of `../VISUAL-AUDIT.md` — pixel-level callouts of things that go wrong if a contributor forgets the persona:

1. **No live price flashes.** Numbers do not change while the user looks at them. (Day-trading dashboards do this; here it triggers reactive selling.)
2. **No green/red on individual holdings.** A holding's row stays neutral regardless of YTD direction. Drift coloring is allowed (because drift is actionable); PnL coloring on a 10-year holding is not (because PnL on a 10-year holding is not the decision unit).
3. **No FOMO countdown timers.** "Earnings in 2d 14h" is irrelevant to a Boglehead; "Next rebalance in 8 months" is the only countdown that belongs.
4. **No "since signal" framing.** No "Up 12% since the screener flagged this." There is no screener and there are no signals in this profile.
5. **No "today's movers" widget.** Top gainers/losers is anti-information at decade horizon and a tempting trigger to tinker.
6. **No social proof.** No "1,240 investors hold this," no leaderboard, no copy-trading. Other people's allocations are noise.
7. **No upsell to a faster cadence.** "Want intraday data? Upgrade." is exactly the dark pattern this profile exists to defend against.
8. **No "AI suggested trade" surface.** The LLM advises in the CLI, never in the dashboard. The dashboard does not generate suggestions; it surfaces facts.
9. **No bloom, no neon, no glassmorphism.** The aesthetic is a flat banker's spreadsheet, not a fintech app.
10. **No theming-as-personality.** No dark-mode toggle in the header chrome. The OS preference wins, full stop.

---

## §14. Cross-references

- Shared visual foundation: [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md)
- Day-trading sibling (what this profile is **not**): [`../EQUITIES-DASHBOARD.md`](../EQUITIES-DASHBOARD.md)
- Pixel-level anti-pattern catalog: [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md)
- Design tokens (re-used): [`../code/tokens.ts`](../code/tokens.ts), [`../code/tokens.css`](../code/tokens.css)
- Reusable component: [`../code/`](../code/) (KpiTile pattern; `LeaderCard`, `LockSlider`, `TVEmbed` are explicitly **not** reused)
- Profile context: [`../../profiles/long-term/README.md`](../../profiles/long-term/README.md)
- LLM persona: [`../../profiles/long-term/CLAUDE.md`](../../profiles/long-term/CLAUDE.md)
- Operating routines: [`../../profiles/long-term/PLAYBOOK.md`](../../profiles/long-term/PLAYBOOK.md)
- Skills referenced: `etf-analyzer`, `portfolio-optimize`, `retire-fire`, `tax-loss-harvest`, `debt-payoff`, `risk-var`, `quant-tearsheet`, `market-data`, `dashboard-build`

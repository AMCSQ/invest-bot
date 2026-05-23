# Crypto profile — UI spec (SECONDARY, kept deliberately short)

> **Read this first.** This UI is for crypto as a **SIDE-POCKET** (< 20% of activity). If crypto is your main game, follow [`../../profiles/crypto/EXTRACT.md`](../../profiles/crypto/EXTRACT.md) and build a crypto-native UI in the new repo — [FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) ([`FAVOURITE-REPOS.md` §1](../../FAVOURITE-REPOS.md)) is a stronger reference than this when you do. The length of this file (~200 lines vs the equity profiles' 400+) is a deliberate signal: this profile gets less attention because it should get less attention.

---

## 1. Persona-bound UX premise

The user opens this dashboard to answer **three questions only**, in this order:

1. **What's my crypto allocation right now?** (BTC vs ETH vs SOL vs stables vs other — weights drifted off target?)
2. **If I'm in perps, what is funding doing to me?** (paying or receiving, next funding window, est. cost over 8h)
3. **What did the last 30 days look like P&L-wise?** (sleeve-level, not per-trade)

The dashboard does **NOT** try to be a full DEX terminal. No orderbook, no MEV viewer, no on-chain forensics, no NFT browser. Those are out of scope — see §10.

## 2. Visual density

**Medium-low.** Voltrex-style aesthetic ([`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md)) but trimmed. Three panels above the fold, one table below. Fewer KPIs than the equity profiles because the persona's relationship to crypto is *passive monitoring + occasional swing*, not active scanning.

## 3. Top-level layout (Tailwind grid, 1440px default)

### Top bar

- **WalletChip** — truncated address (`0x1234…abcd`), copy icon, ENS resolution if the chain supports it
- **Network selector** — Ethereum / Solana / Base; **single chain at a time** (multi-chain is an extracted-repo feature)
- **24/7 indicator** — green dot + label "Markets open 24/7" (no `Market closes in X:XX` because there is no close); replaces the equity profiles' session clock
- **Faucet pill** — only renders on testnet networks

### KPI strip (4 tiles only — keep it lean)

| Tile | Source | Notes |
|---|---|---|
| Total crypto value (USD) | sum of spot balances × marks | tabular-nums |
| 30-day PnL | from `data/journal/` aggregated | green/red with ▲/▼ glyph |
| BTC dominance | CoinGecko global | context tile, not actionable |
| ETH/BTC ratio | ccxt | context tile; useful for the alt-vs-major rotation decision |

(The equity profiles ship 5–7 KPIs. Four is on purpose here.)

### Main grid

```
┌─────────────────────────┬─────────────────────────┐
│ Allocation panel        │ Funding rates panel     │  col-span-6 each
│ (stacked bar)           │ (table, only if perps)  │
├─────────────────────────┴─────────────────────────┤
│ Holdings + open positions table                   │  full width
├───────────────────────────────────────────────────┤
│ (Optional) Vault depositor card                   │  full width, conditional
└───────────────────────────────────────────────────┘
```

- **Allocation panel (col-span-6)** — stacked bar (preferred over pie — see component anatomy) of BTC / ETH / SOL / stables / other. Reads target weights from `data/playbook.md` and shows drift vs target.
- **Funding rates panel (col-span-6)** — table of current funding for active perp positions: `symbol · side · funding rate · next funding in N min · est. cost over 8h`. Empty-state copy when no perps open: "No perp exposure. Funding view shows up here when you open one."
- **Holdings + open positions table (full width)** — columns: `symbol · exchange/wallet · qty · value_usd · cost_basis · unrealized_pnl · % of crypto allocation`. Sortable on every column. No buy/sell buttons (read-only — see §6).
- **Vault depositor card (full width, conditional)** — **only rendered if the user has a Hyperliquid/Drift/Yearn-style vault deposit detected**. This is where the Voltrex visual brief lands hardest — it is the one element on this dashboard that genuinely justifies the violet-bloom + amber-line treatment. Modeled directly on the Voltrex Dribbble reference; see [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md) for the pixel-level critique that drives the implementation. If no vault deposit exists, this card simply does not mount.

## 4. Component anatomy

### `WalletChip`

- Truncate as `0x` + first 4 + `…` (U+2026) + last 4
- Copy icon swaps to a checkmark for 1.5s on copy (matches the pattern in `../DASHBOARD-BRIEF.md` §7)
- ENS resolution if available (Ethereum / Base); displays `vitalik.eth` with the truncated hex as tooltip
- Network badge (small colored dot + chain name) sits to the left of the address
- **Critical:** full hex address exposed via `aria-label` (the Voltrex shot's `0xBwqw…1248` had an invalid `w` — validate the hex client-side; see [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md) §1.3)

### `FundingRateTable`

- Renders **only if** the user has at least one open perp position
- Columns: `symbol · side · current funding rate (bps) · next funding in N:NN (8h cycle on most exchanges) · cumulative paid/received over last 30d`
- Funding rate color-coded: positive = amber (you're paying as long), negative = green (you're being paid as long); swap signs for short side
- Next-funding countdown is a relative timer (`02:14:38`) — refresh per minute, not per second (battery)
- Empty-state: hide the panel; do not render an empty table

### `CryptoAllocationChart`

- **Stacked bar over pie.** Pie charts encode share by angle, which the eye reads ~25% less accurately than length. With 5 categories the stacked bar wins.
- Legend below the bar with weight % and absolute USD
- Drift indicator: a thin vertical line at the target weight for each segment; if current is > 5pp from target, the segment border turns amber (matches the W1 routine in [`../../profiles/crypto/PLAYBOOK.md`](../../profiles/crypto/PLAYBOOK.md))

### `VaultDepositorCard`

- **Only mounts if the user has a vault deposit** (Hyperliquid HLP, Drift insurance fund, Yearn vault, etc.)
- Full Voltrex reference: lock-period slider (0d / 7d / 14d / 30d / 90d), boost % derived from lock, "You Will Receive" line that updates live, Deposit / Withdraw CTA
- Lock-period slider uses Radix `Slider` with `aria-valuetext="7 days, 3% boost"` (not `"1"` — see [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md) §7)
- Sibling `<output aria-live="polite">` announces the derived "You Will Receive" so SR users hear the consequence of each arrow press
- Early-unlock penalty disclosed inline ("Early-unlock penalty: forfeit 5% of accrued boost") — Voltrex's reference omits this; do not omit it here
- This is **the** component where the violet-bloom + amber-chart-line aesthetic earns its place — see [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md) §3 for the micro-craft moves to keep

### `OnChainBadge` (optional, de-emphasized)

- Small chip under the WalletChip showing: last tx timestamp, total gas spent this month, NFT count
- **Greyscale only.** This is informational decoration, not a decision surface. If on-chain analytics matter to your trading, that is a strong signal to extract — use [FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) (or Arkham / Nansen) as a deeper reference and stop here.

## 5. Type and color

- **Inter** for UI, **JetBrains Mono** for addresses and raw numerics (with `tnum` + `zero` for slashed zero — disambiguates `O` from `0` in addresses)
- **Voltrex-style violet bloom is permitted here** — this is the profile where it fits aesthetically. The equity profiles tone it down; crypto leans in.
- **Amber (`#F0B429`)** for the chart line in the Vault card (sidesteps the green/red PnL convention so the vault chart reads as "strategy narrative" rather than "live PnL" — see [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md) §3 "smartest single move")
- **Green (`#22C55E`)** reserved for the Deposit CTA only — hierarchy via hue
- All numerics through one `Intl.NumberFormat(locale)` instance — never hand-rolled. The Voltrex shot shipped a mixed-locale bug (`$34.081.818` next to `$20,040.57`); do not inherit it.

## 6. Interaction surface

**Mostly read-only.** The only writes from this dashboard are:

- Vault deposit / withdraw (when the Vault card is mounted)
- Copy wallet address

Everything else — order placement, balance transfers, swaps — happens **outside** this UI, in the exchange's own interface or via ccxt scripts. This repo does not ship a crypto `BrokerAdapter` ([`../../profiles/crypto/README.md`](../../profiles/crypto/README.md) §Skills excluded), so attempting to expose an order entry surface here would be misleading.

## 7. Data shape

- **Quotes**: `data.realtime.streamQuotes` via the ccxt adapter path (`--source ccxt --exchange binance|bybit|kraken`)
- **Balances**: per-exchange position pulls (one-off ledger; no continuous sync)
- **On-chain (optional)**: `data/onchain/<network>/<dataset>.parquet` — read-only; not written from this UI
- **Funding history**: `data/funding/<exchange>/<symbol>.parquet`
- **Vault state**: pulled from the vault contract's view methods (read-only); deposit/withdraw goes through the user's connected wallet, never through a server-held key

## 8. Mobile

**Yes — crypto trades happen on phones often** (perp funding flips at 3am don't wait for the user to get to a laptop). Single-column stack. The Vault card collapses to a sticky **bottom-sheet** triggered by a FAB (same pattern as `../DASHBOARD-BRIEF.md` §4 breakpoint collapse). Funding rate countdown switches from per-minute to per-5-minute updates on mobile to save battery.

## 9. Accessibility

- Wallet address has `aria-label` with the **full hex** (truncated form is visual-only)
- Funding countdown is announced via `aria-live="polite"` **on hour boundary only** — not every second, or it spams SR users (matches the realtime-throttling rule in `../DASHBOARD-BRIEF.md` §11)
- Allocation chart segments have `role="img"` with summary; `<details>` fallback exposes the data as a table
- Color-encoded funding signs always paired with a ▲/▼ glyph + sign (CVD)
- Focus ring: 2px violet with 1px white inner — same as `../DASHBOARD-BRIEF.md` tokens

## 10. Performance budget

**JS < 150KB gzip** for the crypto route (tighter than the equity profiles' 180KB — fewer components, no orderbook, no chain engine). Lightweight Charts only mounts inside the Vault card (lazy via `dynamic()`). wagmi connectors lazy-loaded.

## 11. What this profile borrows that the others don't

- **Violet bloom** — the Voltrex aesthetic native to a crypto-vault context
- **Vault depositor card** — only relevant here; the equity profiles have no analog
- **WalletChip** — equity brokers don't expose addresses
- **24/7 indicator** — equity profiles have a market-hours clock instead

Everything else (KPI strip pattern, holdings table, type scale, motion tokens) is shared with the equity profiles via [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md).

## 12. Skill chains the UI surfaces

- `/market-data --source ccxt --exchange binance` → backs the KPI strip + allocation panel
- `/smc-scan --symbol BTCUSDT --timeframe 1h` → linked from the holdings table (per-symbol "scan zones" link)
- `/sentiment-scan` → linked from the top bar ("news pulse" pill)
- `/quant-tearsheet` → 30-day PnL KPI links to the monthly tearsheet report
- `/trade-journal` → row-level link on the holdings table when a position closes

## 13. Anti-patterns explicitly avoided

- **No DEX MEV viewer / sandwich-protection panel** — out of scope; use [FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) or dedicated tooling
- **No on-chain forensics deep dive** (address clustering, fund-flow tracing) — same; route to Arkham / Nansen
- **No perp orderbook visualizer** — needs colocated infra, not a research UI
- **No NFT browser** — wrong product
- **No multi-chain aggregation** — single chain at a time; if you need cross-chain, extract
- **No tax accounting / Form 8949 surface** — US wash-sale treatment for crypto is a moving target post-2025; do not generate tax forms from this profile (see [`../../profiles/crypto/CLAUDE.md`](../../profiles/crypto/CLAUDE.md))

## 14. Closing reminder

**If you're spending more than 30 min/week in this profile's UI, it's time to extract.** The repo's primary orientation is US equities — adding crypto-specific machinery here will rot every equity feature it touches. Read [`../../profiles/crypto/EXTRACT.md`](../../profiles/crypto/EXTRACT.md) and copy this profile into a dedicated repo where wallet management, on-chain analytics, perp funding tracking, and vault depositor UX can be built out properly without competing with the equities-first conventions of the parent.

This file stays short on purpose.

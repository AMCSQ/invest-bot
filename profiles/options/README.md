# Options profile

A focused subset of Financial-Planner tuned for the **US-equity / index options trader** running an income book, a directional book, or both. Vol-first, structure-driven, theta-and-vega aware.

## Who this is for

Two concrete personas, both supported by this profile:

- **Income (theta seller).** You sell weekly SPY put credit spreads when IV rank is above 50, you exit at 50% of max profit or 21 DTE — whichever comes first — and you roll the tested side if your short strike gets breached. You hold positions days to a few weeks. You make 5-20 decisions per week across SPX / SPY / QQQ / IWM and a handful of liquid single names.
- **Directional (vol buyer).** You buy ATM calls on NVDA the week before earnings *only* when IV rank is under 30 (so you are not paying inflated premium into the print), and you exit on IV crush the morning after — regardless of direction. You hold positions minutes to a few days. You make 1-5 directional tickets per week.

Most users run both modes side-by-side on different underlyings. If neither of those sentences sounds like you — you only trade equities, or you only invest passively — this is the wrong profile. See **Cross-profile** below.

## Options-approval tier — required reading

Reg-T classifies every option strategy into one of four tiers. Your broker assigns you a tier based on the application you filled in; **strategies above your tier are blocked at the broker, not negotiable.** This profile (and the `options-strategy-builder` skill specifically) refuses to scaffold a strategy your tier does not authorize.

| Tier | Strategies unlocked |
|---|---|
| 1 | Covered call, cash-secured put, long call, long put |
| 2 | Vertical debit/credit spreads, collars |
| 3 | Iron condor, iron butterfly, calendar, diagonal, straddle, strangle |
| 4 | Naked short calls / puts (rare, high net-worth requirement) |

If you are tier 2 and most of this PLAYBOOK reads as "request a tier upgrade from your broker first," that is correct. Iron condors and calendars — the bread and butter of an income book — start at tier 3.

## Default skills

| Skill | Use it for |
|---|---|
| `iv-surface` | Pre-trade — is vol cheap or rich? IV rank, IV percentile, term-structure slope, 25-delta skew. The single biggest input to "debit or credit?". |
| `options-chain` | Pull / filter the actual strikes — moneyness, DTE, OI, bid-ask spread. |
| `options-strategy-builder` | Scaffold the legs — verticals, iron condor, calendar, collar, straddle. Computes max P/L, breakevens, POP at expiration, Reg-T margin, OCC symbols. Includes the tier gate. |
| `greeks-monitor` | Live portfolio greeks — net Δ, Γ, Θ, ν with threshold alerts. Bucketed by DTE so 0DTE does not dominate. |
| `vol-forecast` | GARCH/EGARCH conditional vol for sizing and for the "should I buy or sell premium" question when IV rank alone is ambiguous. |
| `risk-var` | Historical / parametric / GARCH VaR + CVaR on the whole options book. |
| `portfolio-optimize` | Position-sizing across an options book (treating each ticket's max-loss as the risk unit). |
| `tax-loss-harvest` | Year-end wash-sale sweep — assignment-aware (assigned puts become long shares with different basis math) and §1091 covers options-on-same-underlying. |
| `trade-journal` | YAML-frontmatter MD per fill — TradeNote-compatible, computes per-trade R and rolling expectancy. |
| `decision-card` | 90-second Annie-Duke pre-mortem per ticket — thesis, falsifiers, exit triggers. |
| `pre-trade-checklist` | Pre-market go/no-go; writes `data/state.yaml`. |
| `mistake-miner` | Monthly clustering of options-specific failure modes (assignment surprise, IV-crush gone wrong, naked-short blow-up). |
| `market-data` | Underlying OHLCV via the active data adapter. |
| `broker-connect` | Wire Tradier (free options API) or Tastytrade (best UX for options-heavy) — paper first. |

## Skills excluded from this profile

- `smc-scan`, `chart-render`, `ta-indicators`, `pine-new`, `pine-to-python` — chart-heavy day-trade tooling; relevant for the underlying setup, not for vol selection. Use the swing or day-trading profile if you want them.
- `equities-screener` — finds stocks; we filter by **vol regime** (IV rank), not price action. Keep available for picking earnings names but do not load by default.
- `etf-analyzer`, `retire-fire`, `debt-payoff` — wrong horizon and wrong asset class.
- `regime-detect`, `sentiment-scan`, `statarb-scan` — limited signal for an options book; vol regime is the regime that matters here.
- `daily-routine` — built around the intraday equities tape; the options analog lives in this profile's `PLAYBOOK.md`.
- `tilt-guard` — kept available but not default-loaded; options cadence is uneven (a quiet week then 20 tickets into a vol spike) so the rolling features are noisy. Re-enable if you blow up an account.

## Where the data lives

- `data/iv/<symbol>/atm_iv.parquet` — persistent ATM IV history, appended on every `iv-surface` run.
- `data/greeks/state.json` — latest portfolio greeks snapshot (the dashboard tile reads this).
- `data/greeks/history.jsonl` + `data/greeks/alerts.jsonl` — minute-by-minute replay and threshold breaches.
- `data/journal/YYYY-MM-DD/<order_id>.md` — one MD per fill (per leg or per spread, your choice).
- `data/decisions/<order_id>.md` — pre-mortem cards keyed to the order.
- `data/state.yaml` — pre-trade-checklist go/no-go output.
- `data/tax/wash-sale-ledger.csv` — assignment-aware wash-sale ledger.
- `reports/iv-surface/<symbol>/<ts>/` — rank/term/skew/surface output.
- `reports/options-strategy/<symbol>/<ts>/` — scaffolded legs + payoff + order preview.
- `reports/options-chain/<symbol>/<ts>/` — raw chain pulls.

## The critical decision chain

Every non-trivial ticket walks the same five-step chain. Skipping a step is how income traders blow up.

```
/iv-surface rank   →   is vol cheap or rich?
       │
       ├─ rich (IV rank > 50)   →   sell premium → /options-strategy-builder iron-condor or credit vertical
       ├─ cheap (IV rank < 30)  →   buy premium  → /options-strategy-builder debit vertical or long call/put
       └─ middle (30-50)        →   wait, or pick a calendar if term is backwardated
                                                │
/options-chain                                  │   pick strikes — verify bid-ask spread, OI, IV per strike
       │                                        │
       ▼                                        ▼
/options-strategy-builder (with tier gate)  →   payoff curve, POP at expiration, Reg-T margin, OCC symbols
       │
       ▼
broker (Tradier / Tastytrade)  →   submit the multi-leg ticket
       │
       ▼
/greeks-monitor   →   watch portfolio Δ Γ Θ ν, alert on threshold breach
       │
       ▼
close / roll      →   50% profit-take, 21 DTE rule, defensive roll if tested
```

## Cross-profile

- `../long-term/` for the **core sleeve** — index funds, retirement, year-end tax sweep on long-term stock holdings.
- `../swing/` for **equity swing setups** (2-20 day holds) when you want stock exposure, not option exposure.
- `../day-trading/` for **intraday equities**.

If the user asks for a stock-only setup with no options leg, redirect to `../swing/` or `../day-trading/`. If they ask for FIRE math or rebalancing, redirect to `../long-term/`. Each profile owns its own LLM persona so they do not bleed into each other.

If you ever want to spin this profile out into a standalone repo, see [`EXTRACT.md`](./EXTRACT.md).

## Quick start

```bash
cd profiles/options && claude
```

The profile-local `.claude/settings.json` and `.claude/CLAUDE.md` are read automatically by Claude Code from cwd upward, so the options persona loads before any sibling profile's instructions.

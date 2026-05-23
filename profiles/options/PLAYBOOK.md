# Options playbook

The recurring routine for an options book. Faster cadence than the long-term profile, slower than the day-trading profile — but **lumpy**: a quiet week followed by 20 tickets into a vol spike is normal.

Each routine has the same shape: **trigger** (what kicks it off), **steps** (what you actually do), **output** (where the result lands), and **what good looks like** (so you know when to stop).

---

# Weekly

## W1 — Sunday vol scan

- **Trigger:** Sunday afternoon, before futures open.
- **Steps:**
  1. `/iv-surface watch --symbols SPY,QQQ,IWM,DIA,VIX --rank-threshold 60` — log IV rank / percentile / term-structure slope / 25-delta skew for the index complex.
  2. Run the same `watch` on your single-name watchlist (top 10 liquid names, plus anything with earnings inside 14 days).
  3. For any symbol whose IV rank **crossed** above 60 since last Sunday → flag as a **premium-selling candidate**. For any that crossed below 30 → flag as a **premium-buying candidate**. For symbols where term went **backwardated** → flag as a **calendar candidate**.
  4. Cross-reference flagged names against an earnings calendar — short premium into a print is a different trade than short premium in a quiet tape.
- **Output:** `reports/iv-surface/_weekly/YYYY-Www/summary.md` — table of symbol, rank, percentile, term slope, skew, flag.
- **What good looks like:** 2-5 actionable candidates a week. Zero candidates means the vol surface is asleep — do nothing, do not force a trade.

## W2 — Open-position review

- **Trigger:** Sunday, after W1.
- **Steps:** for every open position, check:
  - **DTE.** Any short premium inside 21 DTE → tag for close or roll this week (see P1).
  - **Profit %.** Any credit spread at ≥ 50% of max profit → tag for close (see P2).
  - **Tested side.** Any spread where the underlying is within one strike width of the short strike → tag for defensive roll (see P3).
  - **Ex-dividend dates.** Any short ITM call on a dividend name within 5 days of ex-div → tag for early-assignment watch (see P4).
- **Output:** `reports/options-positions/YYYY-Www/triage.md` — one row per position with a column for each tag.
- **What good looks like:** every position has a written disposition before the week starts. Surprises during the week mean the Sunday review was sloppy.

---

# Pre-trade (per ticket)

## T1 — Vol assessment

- `/iv-surface rank --symbol <sym>` — IV rank + IV percentile, both numbers, never just one.
- `/iv-surface term --symbol <sym>` — term-structure slope. Backwardation = event premium up front.
- `/iv-surface skew --symbol <sym> --dte 30` — 25-delta skew. Steep negative skew + high rank = put-credit spread territory.

## T2 — Structure selection

Decision matrix — these are starting points, not rules:

| Vol regime | Term | Skew | Default structure |
|---|---|---|---|
| IV rank > 50 (rich) | contango | symmetric | Iron condor (sell both wings) |
| IV rank > 50 (rich) | contango | steep neg | Put credit spread (sell the rich side) |
| IV rank > 50 (rich) | **backwardated** | any | Calendar spread (sell front, buy back) — the term gives you the edge, not the rank |
| IV rank < 30 (cheap) | contango | symmetric | Debit vertical (buy the direction you have a thesis on) |
| IV rank < 30 (cheap) | contango | any | Long call/put if you have strong directional conviction |
| IV rank 30-50 (middle) | any | any | Usually no trade — wait for the regime to commit |

## T3 — Strike selection

- `/options-strategy-builder --underlying <sym> --strategy <picked above> --expiration <date> --strikes ... --quantity ...`
  - For verticals: prefer `--delta 0.30` on the short strike and a `--width` you can afford to lose in full.
  - For iron condors: target the short strikes around `|Δ| = 0.15-0.20` (≈ 70-85% POP at expiration).
  - For calendars: same strike, sell front, buy back 30-45 DTE further out.
- The skill checks `account.optionsTier` against the strategy's required tier and **refuses to scaffold** if you are under-authorized. That is a feature.
- `/options-chain --underlying <sym> --expirations <date> --moneyness 0.10 --min-oi 100 --max-spread 0.10` — verify the strikes the builder picked have real liquidity. Reject any leg with bid-ask spread > 10% of mid.

## T4 — Decision card + checklist

- `/decision-card --order-id <preview-id>` — write the thesis (vol regime + directional view), three falsifiers, expected R, max loss tolerance, and explicit exit triggers (profit %, DTE, breached strike).
- `/pre-trade-checklist` — go/no-go gate. Refuse to submit if `data/state.yaml` is not green.
- Submit through the broker. Confirm fills match the order preview (multi-leg combos sometimes leg out at unfavorable prices on illiquid names).

---

# Daily (during open positions)

## D1 — Greeks monitor

- **Trigger:** market open until close, every trading day a position is open.
- **Steps:** `/greeks-monitor start --interval 30s --alert-delta-pct 25 --alert-theta-min -250 --alert-vega-pct 15`.
- **Output:** `data/greeks/state.json` (live), `data/greeks/alerts.jsonl` (breaches).
- **What good looks like:** zero breaches on a quiet day. A vega-breach on a vol-spike day is the alarm working as intended — that is your cue to delta-hedge or close.

## D2 — Tested-side check

- **Trigger:** any time the underlying moves > 1% intraday.
- **Steps:** for every short premium position, ask: is my short strike still safe? If the underlying crossed inside the short strike, walk straight to P3 (defensive roll) — do not "let it work."
- **What good looks like:** you decide before the bell, not after.

---

# Position management (per position)

## P1 — 21-DTE rule

- **Trigger:** any short premium position hitting 21 days to expiration.
- **Rule:** **close or roll** — do not hold short premium into the gamma-ramp-up zone (< 21 DTE). Theta decay accelerates but so does gamma, and the risk/reward inverts.
- **Exception:** if the position is already at ≥ 50% max profit, just close (P2).

## P2 — 50% profit-take on credit spreads

- **Trigger:** credit spread at ≥ 50% of max profit.
- **Rule:** close. The remaining 50% takes the same time to earn but carries the full assignment / gamma risk. Annualized return is dramatically better.
- **Exception:** if you are inside 7 DTE and the underlying is far from both strikes, you can take the last 25-30% — but recognize you are gambling for nickels.

## P3 — Defensive roll on a tested spread

- **Trigger:** underlying breaches the short strike of a credit spread.
- **Rule:** roll the spread out in time **for a credit** (never a debit — paying to fix a loser is throwing good money after bad) and optionally down/up in strike. If you cannot roll for a credit at any reasonable expiration, close the position and book the loss.
- **Pitfall:** rolling 3+ times means the thesis is wrong; close and reassess.

## P4 — Early-assignment monitoring

- **Trigger:** any short ITM leg approaching an ex-dividend date (calls) or expiration (puts).
- **Rule for short ITM calls before ex-div:** the holder of the long call optimally exercises if the extrinsic value < the dividend. Close the short call the day before ex-div if it is ITM and extrinsic is thin (< 0.10).
- **Rule for short ITM puts pre-expiry:** assignment delivers long shares at the strike. If you do not want the shares, close the put before expiration regardless of extrinsic value.
- **Caveat:** no skill in this repo currently watches the ex-dividend calendar — this is a manual check until that gap is filled (see EXTRACT.md / the suggested addition).

---

# Monthly

## M1 — Options-only tearsheet

- **Trigger:** first weekend of the month.
- **Steps:** `/quant-tearsheet --returns reports/journal/options-only-returns.csv --benchmark SPY` — **options P&L only**, kept separate from any underlying stock P&L. Sharpe, Sortino, max drawdown, monthly heatmap.
- **Output:** `reports/tearsheet/YYYY-MM/options-tearsheet.html`.
- **What good looks like:** Sharpe > 1.0, max DD < 20%, expectancy positive across the trailing 6 months. If any of those break, walk through M2.

## M2 — Mistake-miner clustering

- **Trigger:** first weekend of the month, after M1.
- **Steps:** `/mistake-miner --window 90d` — cluster the trade journal for options-specific failure modes. Watch for these named clusters:
  - **Assignment surprise** — closed at a loss because an ITM short leg was assigned and the user did not have margin to hold the underlying.
  - **IV crush gone wrong** — bought premium into earnings, IV crushed as expected, but direction also went against = double-loss.
  - **Naked short blow-up** — short leg of a spread blew through both strikes; max-loss realized because the long wing was too far OTM.
  - **Tested-roll loop** — same position rolled 3+ times, finally closed for a bigger loss than just taking the first one.
  - **Liquidity trap** — small-name option entered at mid, exit fill was 30% worse because nobody quoted the spread.
- **Output:** `reports/reviews/YYYY-MM-options.md` with the top 5 clusters and dollar-cost ranking.
- **What good looks like:** the same cluster does not top the chart two months in a row. If it does, you have a process problem, not a market problem.

---

# Year-end

## Y1 — Tax-loss harvest sweep (options-aware)

- **Trigger:** December 1 through December 28.
- **Steps:** `/tax-loss-harvest scan` — then `/tax-loss-harvest plan --candidates <list> --replacement-mode strict`.
- **Options-specific traps:**
  - **§1091 applies to options on the same underlying.** Closing a stock for a loss and buying a call (or selling a put) on the same name inside the 30-day window triggers a wash sale. The reverse is also true.
  - **Assigned puts → long shares.** When a short put is assigned, the cost basis of the resulting long stock is `strike - premium received`. The original premium credit is rolled into basis, not booked as a separate gain. Make sure the journal records this — broker 1099-Bs are inconsistent about it.
  - **§1256 vs §988.** SPX, RUT, NDX, VIX index options are §1256 contracts — 60/40 long/short tax treatment, mark-to-market at year-end regardless of whether you closed. ETF options (SPY, QQQ, IWM) are not §1256 and follow standard §1091 wash-sale rules. Do not mix the two reports.
  - **Futures options.** If you trade /ES or /CL options, those are also §1256 — same 60/40 + MTM treatment.
- **Output:** `reports/tax-loss-harvest/YYYY/<ts>/` — separated into `equity-options.md` (§1091) and `index-options.md` (§1256).
- **What good looks like:** every position is classified into the right tax bucket; every wash-sale flag includes the relevant option leg.

## Y2 — Annual options review

- **Trigger:** first week of January.
- **Steps:** rerun M1 on the full year. Compare realized expectancy to what your decision cards predicted (Annie-Duke style — were your probability estimates calibrated?). Update playbook rules that consistently lost money.
- **Output:** `reports/annual-review/YYYY/options-review.md`.
- **What good looks like:** at least one rule changed based on data, not vibes. If nothing changed, either you are pluperfect (unlikely) or you did not look hard enough.

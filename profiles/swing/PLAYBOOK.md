# Swing playbook

The recurring rhythm. Weekend-led, daily-light, weekly review, monthly retrospective, quarterly recalibration. If you do nothing else, do the weekend prep and the monthly mistake review — those are the highest-leverage hours of the month.

---

## Weekend prep — Sunday evening, 30-45 min

**Trigger:** Sunday 18:00-21:00 local; or any time Sat/Sun before the week opens.

**Steps:**

1. `/regime-detect --symbol SPY --lookback 252` — is the index trending or chopping? Bias breakout setups in trending regime, bias mean-revert in chopping.
2. `/equities-screener --filter-pack gap-and-go --limit 25` — Friday close gap candidates.
3. `/equities-screener --filter-pack 52w-high-breakout --limit 25` — base breakouts.
4. `/equities-screener --filter-pack oversold-bounce --limit 25` — RSI < 30 with > 5d to earnings.
5. `/equities-screener --filter-pack base-break --limit 25` — multi-week consolidation breaks.
6. Cross-reference results: drop any symbol that appears with conflicting signals (e.g. on both breakout and oversold lists — probably noise).
7. Shortlist 5-10 names. For each, pull `/market-data --symbol X --timeframe 1d --years 1` + `/ta-indicators` (RSI, ATR, 20/50 EMA).
8. For each shortlist name run `/decision-card new --order-id <pending-id> --symbol X --side long|short`:
   - Thesis (1 sentence)
   - 3 falsifiers (observable, time-bound — "stop at $X breaks before $Y prints", "VIX > 22 by Wed", "sector ETF down > 1.5% on Monday")
   - Probability of thesis (0-100)
   - Expected R (must be consistent with planned stop and target)
   - Target hold horizon (days)
   - Bias most at risk
9. Write the week's watchlist to `data/journal/YYYY-Www-watchlist.md` with: symbol, setup, entry trigger, stop, target, R, planned size, decision-card link.

**Output:** `reports/screener/<UTC-ts>/`, `data/decisions/<order_id>.md` × N, `data/journal/YYYY-Www-watchlist.md`.

**What good looks like:** 5-10 names, all with a decision card, expected R ≥ 1.5, falsifiers concrete enough that you could check them from your phone at lunch.

---

## Pre-market — daily, 10 min

**Trigger:** 08:00-09:25 ET on any trading day where the watchlist has triggers pending.

**Steps:**

1. `/session-warmup brief` — overnight ES/NQ, VIX, top 5 headlines, open positions, calendar.
2. Re-read yesterday's open positions vs their decision cards: any falsifier fired overnight? If yes, plan to exit at open.
3. `/pre-trade-checklist run` — sleep, residue, market context, 5-item playbook recital → writes `data/state.yaml`.
4. If `trade_today: true`, place limit / stop-buy orders for any watchlist names whose entry trigger is in range. Stops and first-target orders go in **at the same time** — never as a "I'll set the stop later" promise.

**Output:** `data/journal/warmup/YYYY-MM-DD-brief.md`, `data/state.yaml`, broker order tickets.

**What good looks like:** orders placed before 09:25 ET, every order has a stop attached, no impulse-add to the watchlist after the bell.

---

## Intraday — low-touch

**Trigger:** none. The whole point of swing trading is this row is empty.

**Steps:** stops and targets are working at the broker. Do not check the tape midday. If you must look, do so at the lunchtime lull (12:30-13:30 ET) and only to confirm nothing structural has changed (sector down > 2%, your name halted, etc.).

**Output:** none.

**What good looks like:** zero discretionary intraday actions. Your day job got your full attention. The decision card already made the trade.

---

## EOD — daily, 10 min

**Trigger:** after 16:15 ET on any day with a fill (open or close).

**Steps:**

1. For each fill today, `/trade-journal --action open|close --symbol X ...` — fills in YAML frontmatter (entry, stop, target on open; exit, R-realized, exit-reason on close).
2. For each close, mark **R realized vs predicted** from the decision card. Tag any "decision deviation":
   - Held past stop ("moved my stop")
   - Took partial unplanned
   - Exited at target but kept paper-trade running ("would have been 3R")
   - Added to a loser
3. If deviation tagged, write a 1-line "what I'd do differently" into the trade's `lessons` field. Do not aggregate yet — that's `mistake-miner`'s job.
4. Recompute `data/journal/expectancy.json` (automatic on close).

**Output:** `data/journal/YYYY-MM-DD/<order_id>.md` (open or close blocks appended), `data/journal/expectancy.json`.

**What good looks like:** every fill journaled the same day, every close has an R-realized and an exit-reason, every deviation is explicitly tagged.

---

## Weekly review — Saturday, 30 min

**Trigger:** Saturday morning before the weekend prep.

**Steps:**

1. `/quant-tearsheet` on last-week NAV vs SPY benchmark — Sharpe, Sortino, max drawdown, win rate, profit factor.
2. Walk the week's journal entries: for each closed trade, did you follow the decision card? Adherence percentage.
3. Count "decision deviations" from the week. If > 30% of trades deviated, the playbook is the problem (or you're trading too often) — flag for the monthly review.
4. Update `data/journal/YYYY-Www-review.md`: stats table, adherence %, top lesson of the week, one thing to change next week.

**Output:** `reports/tearsheet/YYYY-Www/`, `data/journal/YYYY-Www-review.md`.

**What good looks like:** adherence ≥ 80%, lessons section is specific ("I added to BABA after the first red candle even though my decision card said no add"), not vague ("I should be more patient").

---

## Monthly — first weekend of the month

**Trigger:** first Saturday of each calendar month, after the weekly review.

**Steps:**

1. `/mistake-miner run --since <first-of-last-month> --top 5` — embedding-cluster the prior month's losers, label clusters, rank by dollar cost.
2. For the #1 leak, write a **drill** for the coming month: a concrete rule whose violation is visible (e.g. "no position > 1.0× baseline for 3 trades after any winner > 2R").
3. Add the drill to `data/tilt_rules.md` if it's behavioral, or to your written playbook if it's mechanical.
4. Compare this month's expectancy to the prior month — drift?

**Output:** `reports/reviews/YYYY-MM.md`, `reports/reviews/YYYY-MM_clusters.json`, drill entry in `data/tilt_rules.md`.

**What good looks like:** top 5 leaks identified with dollar cost, one drill committed to for the coming month, drill is testable (you'll know in 30 days whether you violated it).

---

## Quarterly — first weekend of the quarter

**Trigger:** first weekend of Jan / Apr / Jul / Oct.

**Steps:**

1. Identify your top 2 setups by volume over the trailing quarter (most-used filter packs).
2. For each, `/backtest-runner --strategy <setup_name> --symbol <basket> --timeframe 1d --years 1` against the trailing quarter's bars.
3. Compare Sharpe / win rate / expectancy to last quarter's backtest.
4. **Drift gate:** if Sharpe drift > 0.3 in either direction, recalibrate the filter pack or retire the setup. Drift > 0.5 is a stop — that setup is broken (or the regime broke it).
5. If you're using TradingView alerts, `/pine-new` and `/pine-to-python` to keep Pine and Python parity tight; an alert that fires on TV but doesn't reproduce in your backtest is repaint risk.

**Output:** `strategies/<setup>/`, `reports/backtest/<setup>/<UTC-ts>/`.

**What good looks like:** every active setup has a backtest no older than 90 days, no setup is in production with Sharpe < 0.5, recalibrations are logged with a date and a reason.

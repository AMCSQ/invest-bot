# Day-trading playbook

The recurring routine. Everything here is **fast** — sub-daily at the slowest, sub-second when the chart updates. If you find yourself reaching for a routine that runs less often than weekly, you are probably looking at `../long-term/PLAYBOOK.md`.

Each routine has the same shape: **trigger** (what kicks it off), **steps** (what you actually do, with the exact slash commands), **output** (where the result lands), and **what good looks like** (so you know when to stop).

The day flows top-to-bottom. Pre-market -> open -> intraday -> midday -> close -> EOD. Weekly and monthly reviews bracket the day-by-day grind.

---

# Daily — pre-market

## D1 — 05:30 ET: overnight briefing

- **Trigger:** alarm. Coffee in hand. Before opening any chart.
- **Steps:**
  1. `/session-warmup brief` — pulls ES / NQ / RTY futures, VIX, crude, top 5 overnight headlines (FinBERT-scored), economic calendar for today, your open positions.
  2. Read it once. Do not act yet. The brief is informational, not actionable.
- **Output:** `data/journal/warmup/YYYY-MM-DD-brief.md`.
- **What good looks like:** you spend < 5 min on it. You walk away knowing the macro risk window for the day (FOMC at 14:00? CPI at 08:30?) and which open positions need to be flat before the news.

## D2 — 08:30 ET: pre-trade checklist (the go / no-go gate)

- **Trigger:** 60 minutes before the open. **Mandatory.** Without it, `state.yaml` is missing or stale and every order will be blocked.
- **Steps:**
  1. `/pre-trade-checklist run`.
  2. Answer all 6 prompts honestly: sleep hours + quality, prior-P&L residue (1-5), routine done y/n, high-impact macro event today y/n, recite all 5 rules from `data/playbook.md` (no skimming), pick one bias to watch today from the cheat-sheet.
  3. If sleep < 5h AND residue > 4, `trade_today: false` is forced — go for a walk instead.
- **Output:** `data/state.yaml` with `trade_today`, `trade_size_modifier`, `bias_to_watch`, `warmup_at` timestamp.
- **What good looks like:** the checklist is friction-on-purpose. If you breeze through it in 30 seconds you are not doing it right. Aim for 5 minutes of honest self-assessment.

## D3 — 09:15 ET: pre-market scan + game plan

- **Trigger:** 15 minutes before the open.
- **Steps:**
  1. `/daily-routine morning` — chains: cached `session-warmup` + `pre-trade-checklist` results, then `market-data --symbols SPY,QQQ,IWM,VIX --timeframe 1d --years 1`, then `/equities-screener --filter-pack gap-and-go --limit 25`.
  2. Pick 5-10 names off the screener. For each: thesis (gap-and-go, gap-and-fade, opening drive, ORB, VWAP reclaim, ...), key level (yesterday high/low, premarket high/low, VWAP), planned R-size.
  3. Note avoid windows (news at 08:30 -> avoid 09:30-09:35; FOMC at 14:00 -> avoid 13:45-15:00).
- **Output:** `data/journal/YYYY-MM-DD-plan.md` with watchlist + avoid windows + day P&L target + max-loss cutoff + max-trades cap.
- **What good looks like:** 10 names, every one with a level and a size. No name without a thesis. The plan fits on one screen.

## D4 — 09:25 ET: boot the cockpit

- **Trigger:** T-5 to the open.
- **Steps:**
  1. `cd web && npm run dev` (if not already running). Open `http://localhost:3000`. Confirm the connection-status pill is green (subscribed to your real-time `DataAdapter`), the watchlist sparklines are updating, and the HeroChart crosshair is responsive.
  2. `cd mcp && npm start` in a second pane. Confirm `[mcp] ping_broker ok` shows up on stderr.
  3. **Dummy-order check.** From the Claude Code session: try to place a 1-share order in the synthetic broker and confirm `tilt-guard` either passes it (state OK) or blocks it cleanly (state missing / BLOCKED). If it silently goes through and you didn't run the checklist, your hook is not wired — stop and fix `.claude/settings.json` before the open.
  4. Pin the HeroChart to your top watchlist name. Open the level-2 / time-and-sales window your broker provides.
- **Output:** running dashboard + MCP server + verified hook.
- **What good looks like:** you are flat (or know exactly what you hold), the cockpit is up, the gate is proven to fire, and you have not placed a single live order yet.

---

# Daily — regular hours

## D5 — 09:30 - 16:00 ET: trade the plan

- **Trigger:** the bell.
- **Steps (per trade):**
  1. **Decide:** `/decision-card --symbol <X> --side <buy|sell> --thesis "<one line>" --stop <px> --target <px> --probability <0-1> --bias-at-risk <pick>`. Writes a YAML pre-mortem keyed to the order ID. 90 seconds, no more.
  2. **Size:** the gate will recompute qty from current equity and your `risk_pct`. Do not override unless you logged a reason.
  3. **Place:** order goes through either the dashboard (manual click) or the MCP tool (`place_order`). Either path runs the same gate stack: kill switch -> tilt-guard -> PDT -> buying power -> risk ceiling -> idempotency -> audit log. Any failure surfaces with a specific error code (`TRADE_BLOCKED`, `PDT_EXCEEDED`, `INSUFFICIENT_BUYING_POWER`, `RISK_CEILING_EXCEEDED`, `DUPLICATE_ORDER`).
  4. **Manage:** server-side bracket / stop is set at entry — do not trust yourself to manage exits manually under pressure. Trail by structure, not by feeling.
  5. **Close:** broker fills the bracket or you close manually. On the close, `/trade-journal log --order-id <id>` — fills realized R, emotion at entry/exit, plan adherence y/n, one-line lesson.
- **Output:** `data/trades/YYYY-MM-DD/<id>.json` (raw fills) + `data/journal/YYYY-MM-DD/<id>.md` (your narrative + R) + appended `data/mcp-log/YYYY-MM-DD.jsonl`.
- **What good looks like:** every fill has a matching decision card AND a journal entry within 60 seconds of close. Zero un-journaled fills by EOD. Plan-adherence rate > 80%.

## D6 — 12:00 ET: midday tilt re-check

- **Trigger:** lunch. The dead zone where most account-killing mistakes happen.
- **Steps:**
  1. `/daily-routine midday` — re-reads the morning plan, pulls every trade closed since the open, recomputes `tilt_score` from the morning baseline.
  2. Compare fills to plan: which thesis worked, which did not?
  3. The skill emits a 5-line decision card: continue, scale back, or stop.
- **Output:** `data/journal/YYYY-MM-DD-midday.md` + updated `data/state.yaml`.
- **What good looks like:** if tilt score drifted up but you are green, `scale back` is the correct answer most days. If tilt drifted up AND you are red, `stop` is the answer — close the dashboard and walk away.

## D7 — 15:55 ET: flatten check

- **Trigger:** 5 minutes to the close.
- **Steps:**
  1. Pull positions from `getPositions()`. Anything still open?
  2. If yes and your strategy is intraday-only: close it. Overnight gap risk is not your edge in this profile.
  3. If you intentionally hold something overnight, write the reason in `data/journal/YYYY-MM-DD/overnight-<symbol>.md` so future-you can audit the call.
- **Output:** flat book, or a documented exception.
- **What good looks like:** zero unintentional carries. The strategy you signed up for is flat-by-close; if you keep slipping, mistake-miner will surface it.

---

# Daily — end of day

## D8 — 16:05 ET: EOD review

- **Trigger:** after the close. **Mandatory.** Same friction-on-purpose as the morning checklist.
- **Steps:**
  1. `/daily-routine eod` — pulls all fills from `data/trades/`, runs `/trade-journal --action review` on each to backfill realized R + lessons placeholder, computes day stats (trades, win rate, total R, biggest win, biggest loss, longest hold), compares to morning targets.
  2. Answer the one prompt the skill asks: "What is the single biggest lesson from today?" One sentence. Not a paragraph.
  3. Update `data/journal/expectancy.json` rolling 30 / 90 / YTD windows.
- **Output:** `data/journal/YYYY-MM-DD-eod.md` with day stats table, per-trade adherence ticks, lessons list, plan adjustments for tomorrow.
- **What good looks like:** total time < 15 min. Win rate or R per the rolling window, not today alone. One lesson, not five. If you want to skip the EOD because "today was bad" — that is exactly when you most need it.

---

# Weekly

## W1 — Saturday: weekly tearsheet + adherence audit

- **Trigger:** Saturday morning, coffee, no market open.
- **Steps:**
  1. `/quant-tearsheet --returns data/journal/expectancy.json --window 1w --benchmark SPY`.
  2. Compute plan-adherence rate from the EOD ticks: `# trades where adherence == true / total`.
  3. Plot R distribution (histogram). Look for fat left tails — those are the leaks mistake-miner will catch later.
- **Output:** `reports/weekly/YYYY-Wn/tearsheet.html` + `reports/weekly/YYYY-Wn/adherence.md`.
- **What good looks like:** adherence > 80%, R distribution roughly symmetric or right-skewed (positive expectancy is right-skewed), Sharpe vs SPY > 1.0 over rolling 90 days. If adherence drops below 60%, mistake-miner is overdue.

---

# Monthly

## M1 — First Saturday of the month: mistake-miner + drill

- **Trigger:** first Saturday.
- **Steps:**
  1. `/mistake-miner --window 30d` — embedding-clusters your journal entries to surface the top 5 recurring failure modes (oversized, held too long, news fade, FOMO, revenge trade, ...) and quantifies the dollar cost of each leak.
  2. Pick the **single most expensive** leak. Write a one-paragraph drill to address it in `data/playbook.md` — e.g. "Before any add, screenshot the chart and wait 60 seconds." The drill becomes part of your `pre-trade-checklist` recital for the next month.
  3. If a leak is "broker / data infra" (mis-fills, bad ticks, hung MCP), open a GitHub issue, do not treat it as a behavioral failure.
- **Output:** `reports/monthly/YYYY-MM/mistakes.md` + appended `data/playbook.md`.
- **What good looks like:** the same leak does not appear twice in a row. If it does, the drill was wrong; pick a more specific one.

---

# Event-driven

## E1 — Tilt-guard fires mid-session

- **Trigger:** you try to place an order and the hook returns a blocking intervention with the current tilt score breakdown.
- **Steps:** read the intervention. Read the cognitive bias the hook drew for you. If you still want to trade: `/tilt-guard override --reason "<one paragraph>"`. The override is logged to `data/journal/overrides/<ts>.md` and reviewed at EOD.
- **Output:** override log entry, or (correctly) a closed laptop.
- **What good looks like:** > 80% of tilt-guard fires end in "closed the laptop", not "overrode". An override rate > 50% means your tilt threshold is too low — recalibrate after the next mistake-miner run.

## E2 — TradingView alert auto-executes

- **Trigger:** TV alert POSTs to `/api/tv-webhook`.
- **Steps:** the receiver runs: kill switch -> shared-secret auth -> Zod validation -> idempotency dedup (1h TTL on `symbol:strategy:minute`) -> tilt-guard / PDT / BP gate -> risk-recomputed qty -> `brokers.active.placeOrder()` -> audit. You do nothing. You watch.
- **Output:** `data/webhook-log/YYYY-MM-DD.jsonl`.
- **What good looks like:** every alert lands in the audit log with `stage: submit, ok: true` or a specific gate reason. Zero silent drops. Practice the kill switch (`TV_WEBHOOK_KILL=1`) at least once a month so muscle memory is there when you need it.

## E3 — Real-time data goes stale

- **Trigger:** the connection-status pill on the HeroChart turns amber (`reconnecting`) or red (`stale`).
- **Steps:** stop placing orders. Pull the open positions list manually from the broker (not the cached dashboard). Decide flat-by-close, then fix the adapter (Polygon key expired? rate-limited? socket dropped?). Restart `npm run dev` and re-verify before the next trade.
- **Output:** a paragraph in `data/journal/YYYY-MM-DD/notes.md`.
- **What good looks like:** you noticed within 30 seconds (because the pill is loud), you stopped trading, you did not rely on stale ticks.

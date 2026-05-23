# Day-trading profile

A focused subset of Financial-Planner tuned for the **active intraday equities trader** who measures the holding period in minutes, not weeks. The dashboard, the MCP server, and the discipline gate all run live during market hours.

---

## PDT warning — read this first

> **If your account is under $25,000 and you make 4 or more day trades in any 5-trading-day window, your broker will freeze you for 90 days.**
>
> This profile's `tilt-guard` PreToolUse hook and the `daily-routine` orchestrator both respect the PDT counter — but only if **(a)** you set `BROKER` to your real broker in `web/.env.local` and `mcp/`, and **(b)** your account balance reported by `getAccount()` is your real balance. The synthetic broker reports $100,000 and will not protect you from your live account being frozen.

---

## Who this is for

You trade SPY / QQQ / IWM and the NVDA / TSLA / AAPL-tier names intraday. You run the Next.js dashboard on a second monitor during market hours, you read the level-2 / time-and-sales obsessively, you size your day on the morning gap map, and you want the LLM to **stop you placing an order when you are emotional** rather than help you place more of them. You journal every fill, you review the day before bed, you flatten by 16:00 ET because overnight gaps are not your edge.

If that is you, this profile loads the discipline triad (`pre-trade-checklist` -> `tilt-guard` PreToolUse hook -> `mistake-miner`) by default, ships the only profile-local hook in the repo, and excludes the long-horizon / portfolio / Pine-generation tooling that would just clutter the suggestion surface.

## Default skills

| Skill | Use it for |
|---|---|
| `pre-trade-checklist` | **08:30 ET go/no-go.** Writes `data/state.yaml`. Without this, tilt-guard fails closed. |
| `tilt-guard` | **The hook.** Blocks `mcp__broker__place_order` when tilt score breaches threshold. |
| `mistake-miner` | Monthly review — clusters journal entries to surface your top 5 recurring leaks. |
| `decision-card` | Annie Duke pre-mortem per trade, keyed to the order ID so journal scores prediction vs reality. |
| `trade-journal` | Log every fill as YAML-frontmatter MD. Feeds tilt-guard, mistake-miner, expectancy. |
| `session-warmup` | 05:30 ET overnight + headlines + open-position briefing. Runs before pre-trade-checklist. |
| `daily-routine` | Orchestrator: chains warmup -> checklist -> screener at open, midday tilt re-check, EOD review. |
| `alert-webhook` | TradingView Premium alert -> hardened receiver -> BrokerAdapter. Gated by tilt-guard + PDT + BP. |
| `broker-connect` | Wire Alpaca paper (default), IBKR, Tradier, Tastytrade, Schwab. |
| `market-data` | Real-time quotes / bars / chains via Polygon (real-time required for intraday). |
| `equities-screener` | Gap-and-go, RVOL, distance-from-VWAP, ATR% scans pre-market. |
| `ta-indicators` | Enrich an intraday bar frame with RSI / VWAP / ATR / Bollinger / Ichimoku. |
| `chart-render` | Annotated PNG/HTML candle chart for post-trade review or sharing. |
| `regime-detect` | Trending vs chopping classifier on the index — switches your default strategy. |
| `quant-tearsheet` | Weekly / monthly NAV review against SPY. |
| `risk-var` | Per-position 1-day VaR before sizing up. |
| `vol-forecast` | GARCH conditional vol -> position-size scaling. |
| `sentiment-scan` | FinBERT on overnight headlines for the watchlist. |

## Skills excluded from this profile

- `retire-fire`, `debt-payoff` — multi-decade horizon, nothing to do with today's tape.
- `etf-analyzer`, `portfolio-optimize` — strategic allocation, not intraday.
- `tax-loss-harvest` — annual sweep; lives in `../long-term/`.
- `statarb-scan` — weekly-bar cointegration; wrong timeframe.
- `pine-new`, `pine-to-python` — most intraday traders use pre-built TV indicators, not generation.
- `iv-surface`, `options-chain`, `options-strategy-builder`, `greeks-monitor` — opt back in only if you actively trade options intraday (then symlink them from `../options/`).
- `smc-scan` — keep if you trade ICT / SMC; off by default to keep the surface clean.

## Where the data lives

- `data/state.yaml` — written by `pre-trade-checklist`, read by `tilt-guard` and `alert-webhook` gates. Without it, all order-placement tools fail closed.
- `data/tilt_rules.md` — your personal tilt rules, scaffolded on first `/tilt-guard init`.
- `data/playbook.md` — your 5 trading rules, recited daily during pre-trade-checklist.
- `data/calendar.md` — user-maintained macro / earnings calendar.
- `data/positions.yaml` — open positions snapshot (broker-sync or manual).
- `data/journal/YYYY-MM-DD/` — per-trade JSON + per-session plan/midday/eod markdown.
- `data/trades/YYYY-MM-DD/<id>.json` — raw fills from the broker.
- `data/webhook-log/YYYY-MM-DD.jsonl` — every TradingView alert: validation, gate decision, broker result.
- `data/mcp-log/YYYY-MM-DD.jsonl` — every MCP tool call: tool, ok/error, latency.
- `data/journal/overrides/<ts>.md` — written when you override a tilt block; auditable.

## Quick start

```bash
# 1. The dashboard (live data, hero chart, watchlist, KPI strip)
cd profiles/day-trading
cp ../../web/.env.example ../../web/.env.local
# edit web/.env.local: set BROKER=alpaca, ALPACA_KEY_ID, ALPACA_SECRET_KEY,
# ALPACA_MODE=paper, DATA_REALTIME=polygon, POLYGON_KEY, TV_WEBHOOK_SECRET
cd ../../web && npm install && npm run dev
# -> http://localhost:3000

# 2. The MCP server (broker + data adapter as MCP tools, with hardening gates)
cd ../mcp && npm install && npm run build && npm start
# -> stdio (default) for Claude Desktop / Cursor / Codex
# -> npm start -- --transport http --port 7711 for HTTP/SSE

# 3. The discipline gate (Claude Code session with the day-trading persona)
cd ../profiles/day-trading && claude
# /pre-trade-checklist run     <-- writes data/state.yaml; do this BEFORE trading
# /session-warmup brief        <-- 60-second pre-market briefing
# /daily-routine morning       <-- chains warmup + checklist + screener
```

## Critical: the order-placement gate only works if both halves are wired

The "tilt-guard blocks an emotional order" promise depends on **two** things being true at the same time:

1. **The PreToolUse hook is registered in `.claude/settings.json`.** This profile is the only one that ships a default hook entry; see `./.claude/settings.json`. If you delete it or move the profile, the gate is dead silent.
2. **You actually ran `/pre-trade-checklist` this morning.** The hook reads `data/state.yaml`. If state is missing or stale (>4h old), `tilt-guard` fails closed and refuses every order — which is the right behavior, but it surprises people the first time. Don't fight it; run the checklist.

If you ever feel the urge to disable the hook mid-session, that **is** the tilt signal. The hook is doing its job.

## Cross-profile

If you also hold a long-horizon core sleeve in a separate account, switch to `../long-term/` for that work and come back here for intraday. Each profile owns its own LLM persona and skill list so they do not bleed into each other.

If you want to spin this profile out into its own dedicated repo (highly recommended — see [`EXTRACT.md`](./EXTRACT.md)), the live data flow + MCP server + dashboard is a self-contained deployable product.

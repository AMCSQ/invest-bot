---
name: session-warmup
description: Lightweight wrapper around `pre-trade-checklist` that also pulls macro headlines, today's economic calendar, and the user's open positions for a 60-second briefing. Invoke when the user wants "morning brief", "session warmup", "what's on the calendar".
---

# When to use

Right before `pre-trade-checklist`, when the user wants context before answering go/no-go.

# Upstream references / chained skills

- Chains to: `market-data --source openbb` (or yfinance) for index futures + key tickers.
- Chains to: news fetch via `areed1192/finance-news-aggregator`.
- Reads: `data/positions.yaml` (user-maintained or broker-sync), `data/calendar.md`.

# Recipe

```
/session-warmup brief
```

Output to terminal + `data/journal/warmup/YYYY-MM-DD-brief.md`:

```markdown
# Morning Brief — 2026-05-22

## Overnight
- ES futures: +0.34%
- VIX: 13.8 (-2%)
- Crude: 78.20

## Top headlines (≤ 5)
- AAPL: WSJ reports new iPad lineup (sentiment +0.6, FinBERT)
- ...

## Today's calendar
- 08:30 ET: Initial Jobless Claims (consensus 230k)
- 14:00 ET: FOMC minutes  ← high impact

## Open positions
- AAPL long 100 @ 192.30, stop 188.00 (open R: +0.4)
- ...

## Suggested focus
Given FOMC minutes at 14:00 ET, consider closing or de-risking discretionary positions before 13:45.
```

After printing, exits with a one-line nudge: "Run `/pre-trade-checklist run` to commit your go/no-go for the session."

# Output convention

`data/journal/warmup/YYYY-MM-DD-brief.md`.

# Install on first use

No new deps if `market-data` is already installed.

# Don't

- Don't auto-set `trade_today` — the brief is informational; `pre-trade-checklist` writes state.
- Don't pull more than 5 headlines — noise > signal.
- Don't trust the FinBERT score as actionable — show it for context only.

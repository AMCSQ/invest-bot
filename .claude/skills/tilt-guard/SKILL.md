---
name: tilt-guard
description: Real-time behavioral circuit breaker. Computes a rolling "tilt score" from recent journal entries (trades-since-last-loss, size delta, time-between-entries delta, entry-note sentiment) and **blocks order-placement MCP tool calls** when the score exceeds the user's threshold. Invoke when the user wants "tilt detection", "stop me from revenge trading", or "block trades when I'm on tilt".
---

# When to use

This is the enforcement layer. Pair with `trade-journal` (which feeds it) and `pre-trade-checklist` (which initializes daily state). Use during live trading hours.

# Upstream references (building blocks; no upstream is a full tilt detector)

- [`danielle707/Quantitative-Trading-with-Sentiment-Analysis`](https://github.com/danielle707/Quantitative-Trading-with-Sentiment-Analysis) — emotion categories on journal text.
- VADER or FinBERT for journal sentiment.
- [`busterbenson cognitive-bias-cheat-sheet.json`](https://github.com/busterbenson/public/blob/master/cognitive-bias-cheat-sheet.json) — 175 biases for intervention text.

# What it computes

```
tilt_score = 0.30 * (size_z_score)            # position size vs 30-day baseline
           + 0.25 * (trades_after_loss_streak)
           + 0.20 * (1 / minutes_since_last_entry)
           + 0.15 * (negative_sentiment_score)
           + 0.10 * (sleep_deficit)
```

Output `data/state.yaml`:
```yaml
date: 2026-05-22
session_warmup_completed: true
sleep_hours: 5.5
last_loss_at: 2026-05-22T15:14:00Z
trades_after_last_loss: 2
size_baseline_30d: 87
last_entry_size: 240
tilt_score: 0.78
tilt_threshold: 0.50
status: BLOCKED
```

# Hook installation

On first invocation, create `.claude/settings.json` with:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__broker__place_order|mcp__binance__order|mcp__ccxt__create_order",
        "command": "python .claude/skills/tilt-guard/check.py"
      }
    ]
  }
}
```

`check.py` reads `data/state.yaml`. If `status == BLOCKED`, exits non-zero with an intervention markdown printed to stderr, including:
1. The current tilt score and which components drove it.
2. The user's pre-written tilt rules (`data/tilt_rules.md`, scaffolded on first run).
3. One randomly drawn cognitive bias from the cheat-sheet that fits the failure mode.

The hook **cannot be routed around by Claude** — that's the point.

# Invocation

```
/tilt-guard init                  # scaffold settings + tilt_rules.md
/tilt-guard score                 # recompute now
/tilt-guard override --reason "..."   # logs override to data/journal/overrides/<ts>.md
```

# Output convention

```
data/state.yaml
data/tilt_rules.md
data/journal/overrides/<ts>.md
```

# Install on first use

```bash
uvx --with pyyaml --with vaderSentiment python -c "from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer"
```

# Don't

- Don't compute tilt from a single trade — minimum 5 trades of baseline.
- Don't let the hook silently pass when state is stale (`updated_at > 5min ago`) — fail closed.
- Don't let the user disable the hook without writing the reason to the override log.

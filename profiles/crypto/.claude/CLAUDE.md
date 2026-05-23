# Crypto profile — Claude memory

> **This is a SECONDARY profile.** The repo's primary focus is US equities / ETFs / indexes / options. Use this profile when crypto is a side-pocket; extract it (see `../EXTRACT.md`) if it becomes your main game.

- **Persona:** crypto trader (BTC/ETH/SOL/HYPE-tier majors + perps via Hyperliquid / Bybit / Binance). 24/7 markets. Likely spillover from day-trading or options.
- **Default skills:** `market-data` (ccxt path), `smc-scan`, `sentiment-scan`, `ta-indicators`, `trade-journal`, `decision-card`, `quant-tearsheet`, `risk-var`, `vol-forecast`, `backtest-runner`, `pre-trade-checklist`, `mistake-miner`.
- **Excluded skills:** `retire-fire`, `etf-analyzer`, `debt-payoff`, `tax-loss-harvest` (US wash-sale treatment differs and is post-2025 anyway), `equities-screener`, `options-*`, `greeks-monitor`, `iv-surface`, `alert-webhook` (TradingView-equity-flavored), `broker-connect` (US-equity-broker-only).
- **Default broker:** none for spot (ccxt direct); Hyperliquid paper for perps.
- **Default data adapter:** ccxt (Binance / Bybit / Kraken).

## Critical warning — DO NOT MIX HOOKS ACROSS ASSETS

The day-trading profile's `tilt-guard` PreToolUse hook is **equity-session-aware**. If you point a crypto order path at it, one of two things happens:
1. Silent bypass — no PDT counter, no session check, hook returns "ok" for orders placed at 3am that shouldn't pass.
2. Fail-closed against a stale `state.yaml` written for the equity session — your crypto orders get blocked for the wrong reason.

**Solution:** if crypto becomes a significant share of activity, follow `../EXTRACT.md` and build a crypto-native discipline gate in the new repo (24/7-aware, no PDT, with wallet/seed-phrase mgmt).

## Routing rules

- For deep crypto-native questions (DEX MEV, on-chain forensics, vault yield decomposition, MM strategy on perps): acknowledge the repo's equity-first orientation and route to [FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) or the OpenAlgo + Hyperliquid SDK paths. Don't try to overfit this repo to a niche it wasn't built for.
- For stock trading: route to `cd ../long-term`, `cd ../swing`, `cd ../day-trading`, or `cd ../options`.

## Tone

Pragmatic. Not evangelical about crypto. If the user is making this their main game, recommend extraction sooner rather than later.

## Routine source-of-truth

`../PLAYBOOK.md`. Deliberately shorter than the equity playbooks — if you find yourself adding more crypto-specific routines, that's a signal to extract.

## Extraction recipe

`../EXTRACT.md`. **Extraction is strongly recommended** when crypto > 20% of activity. Suggested target repo name: `crypto-side-pocket` or `defi-trading-os`. Things you'll need to ADD post-extraction: wallet/seed-phrase handling, on-chain analytics adapter, perp funding tracker, vault depositor UI, crypto-tilt-guard, crypto tax accounting.

# Crypto profile — Claude memory (SECONDARY)

**This profile is secondary.** The repo's primary focus is US equities / ETFs / indexes / options. Crypto is supported because the skill pack covers `ccxt` + on-chain analytics + perp DEX patterns, but if crypto is your main game, extract this profile per `../EXTRACT.md`.

- **Persona:** crypto trader (BTC/ETH/SOL/HYPE-tier majors, perps via Hyperliquid / Bybit / Binance). Likely spillover from another profile.
- **Default skills:** `market-data` (ccxt path), `smc-scan`, `sentiment-scan`, `ta-indicators`, `trade-journal`, `decision-card`, `quant-tearsheet`, `risk-var`, `vol-forecast`, `backtest-runner`, `pre-trade-checklist`, `mistake-miner`.
- **Excluded skills:** all equities-specific stuff — `retire-fire`, `etf-analyzer`, `debt-payoff`, `tax-loss-harvest` (US-equity-flavored), `equities-screener`, `options-*`, `greeks-monitor`, `iv-surface`, `alert-webhook` (TradingView-equity-flavored), `broker-connect` (US-equity-broker-only).
- **Default broker:** ccxt direct (spot); Hyperliquid paper (perps).
- **Default data adapter:** ccxt (Binance / Bybit / Kraken / Hyperliquid).

## Important routing rules

- For deep crypto-native questions (DEX MEV, on-chain forensics, vault yield decomposition, MM strategy on perps), **acknowledge the repo's equity-first orientation and route the user to FinceptTerminal** (see `../../FAVOURITE-REPOS.md` §1) or to the OpenAlgo + Hyperliquid SDK paths. Don't try to overfit this repo to a niche it wasn't built for.
- For stock-only questions, route to `../long-term/`, `../swing/`, `../day-trading/`, or `../options/`.

## Critical warning — don't reuse equity discipline gates

The day-trading profile's `tilt-guard` `PreToolUse` hook is **PDT- and NYSE-session-aware**. Pointing a crypto order path at it will either:
1. **Silently bypass** the gate (no PDT counter triggers, no session check fails), letting you place a leveraged perp at 3am with zero discipline check, OR
2. **Fail-closed** against a stale `data/state.yaml` written for an equity session that doesn't apply to 24/7 crypto markets.

If you trade both, EXTRACT this profile first and build a crypto-native gate (no PDT, time-zone-agnostic, funding-rate-aware).

## Tone

Pragmatic, not evangelical about crypto. Don't pitch the asset class — just help the user manage their allocation.

## Extraction recipe

`../EXTRACT.md`. **Strongly recommended** if crypto exceeds ~20% of trading activity.

> **This profile is secondary.** The repo's primary focus is **US equities, ETFs, indexes, and options.** Crypto is included here because the skill pack already supports the ccxt data path, because `smc-scan` happens to be popular among crypto chartists, and because the Voltrex-inspired visual brief in `design/DASHBOARD-BRIEF.md` originated from a crypto-vault Dribbble shot — so the design language is already crypto-flavored. But if you came to this repo looking for a Bloomberg-Terminal-grade crypto stack with deep on-chain analytics, MEV tooling, DEX-aggregation, and wallet-first UX, you will find more mature single-purpose tools elsewhere. See [`FAVOURITE-REPOS.md` §1 FinceptTerminal entry](../../FAVOURITE-REPOS.md) for one such reference. Use this profile only when crypto is a **side-pocket** of an otherwise equity-first practice; if crypto becomes your main game, **extract this profile into its own repo** ([`EXTRACT.md`](./EXTRACT.md)) and build it out properly without competing with this repo's equities orientation.

# Crypto profile (secondary, opt-in)

A small, deliberately-modest subset of Financial-Planner tuned for the crypto trader who runs **crypto as a side-pocket** to an equities-first practice.

## Who this is for

You allocate roughly **5-15% of net liquid worth to BTC / ETH long-term**, you occasionally swing **SOL / HYPE / other major-tier names** for a few days to a few weeks, and you might rotate a small bag through **Hyperliquid / Bybit / Binance perps** when funding is favorable. Crypto is a satellite. Your main book is equities, ETFs, or options — and you do not want the LLM in your crypto sessions to keep volunteering retirement / tax-loss / Pine / PDT advice that does not apply.

If crypto is **> 20% of your trading activity or capital**, this profile is the wrong shape — extract it.

## Default skills

Intentionally a short list — every skill here works equally well for equities, so we are only listing the ones that genuinely earn their place in a crypto workflow.

| Skill | Use it for |
|---|---|
| `market-data` | The ccxt path. `--source ccxt --exchange binance` (or `bybit`, `kraken`) for OHLCV on `BTC/USDT`, `ETH/USDT`, `SOL/USDT`, `HYPE/USDT`. |
| `smc-scan` | SMC / ICT vocabulary is endemic in crypto Twitter — FVG / OB / liquidity sweeps on `1h` and `4h` are the common timeframes. Outputs candidate zones, not signals. |
| `ta-indicators` | RSI, MACD, Bollinger, ATR on crypto bars before sizing a swing. |
| `sentiment-scan` | Headline / Reddit / RSS sentiment — crypto is reflexive enough that news cycles matter inside a 24h window. |
| `trade-journal` | YAML-frontmatter MD per fill; works fine for ccxt fills if you write a thin adapter. |
| `decision-card` | 90-second pre-mortem before opening a perp — crypto's 24/7 nature makes pre-commitment more important, not less. |
| `quant-tearsheet` | Monthly review of crypto-only P&L vs HODL benchmark (BTC or a 50/50 BTC-ETH baseline). |
| `risk-var` | Historical / parametric VaR over crypto returns — they have fatter tails than equities, so the parametric path lies more. |
| `vol-forecast` | GARCH on hourly crypto returns — crypto vol regimes shift fast and the realized vs implied gap on perps is tradeable. |
| `backtest-runner` | Offline parity for any rule-based crypto idea before risking real flow. |
| `mistake-miner` | Monthly leak detection — only meaningful if you have > 10 closed crypto trades in the month. |
| `pre-trade-checklist` | Optional, but recommended if you are touching perps. 24/7 markets eat unprepared traders. |

## Skills excluded from this profile

Most of the equities-specific stack is **off** here because the underlying constructs do not exist or do not apply:

- `retire-fire`, `debt-payoff`, `portfolio-optimize`, `etf-analyzer` — wrong horizon / wrong asset class. Belongs in `../long-term/`.
- `tax-loss-harvest` — US wash-sale rule does not currently apply to crypto the same way (and tax treatment is a moving target post-2025); do not generate Form 8949 from this profile.
- `equities-screener` — Finviz universe is US equities. There is no comparable single-source crypto screener; build your own from ccxt + CoinGecko if you need one.
- `options-chain`, `options-strategy-builder`, `greeks-monitor`, `iv-surface` — crypto options (Deribit, Bybit) exist but the chain shapes, settlement, and margining differ enough that the equity-flavored skills will mislead more than help. Extract and rebuild if you go deep on crypto options.
- `pine-new`, `pine-to-python` — TradingView Pine supports crypto symbols, but Pine's idiom library and our `pine-new` templates are calibrated to equities. Workable, not optimized.
- `alert-webhook` — the TradingView → BrokerAdapter receiver is equity-broker-flavored; a crypto webhook route should hit ccxt or a DEX SDK directly.
- `broker-connect` — scaffolds US-equity-broker adapters (Alpaca / IBKR / Tradier / Tastytrade / Schwab). For crypto, go straight to ccxt for spot and the Hyperliquid / Bybit / Binance SDKs for perps.
- `daily-routine`, `session-warmup`, `tilt-guard` — built around the US equities session (08:30 → 16:00 ET). Crypto has no session. Re-author if you want crypto-shaped versions; do not just symlink.
- `statarb-scan`, `regime-detect` — usable, but not load-bearing for the persona this profile targets.

## Where the data lives

```
data/quotes/<exchange>/<symbol>.parquet     # e.g. data/quotes/binance/BTC-USDT_1h.parquet
data/onchain/<network>/<dataset>.parquet    # optional: tx flow, gas, validator stats
data/journal/YYYY-MM-DD/<order_id>.md       # per-trade journal entries
data/decisions/<order_id>.md                # pre-mortem decision cards
data/funding/<exchange>/<symbol>.parquet    # perp funding rate history
reports/tearsheet/YYYY-MM/                  # monthly crypto-only P&L review
reports/reviews/YYYY-MM.md                  # monthly mistake-miner output
```

The `/` in `BTC/USDT` is replaced with `-` in filenames to stay POSIX-friendly. Other than that, this mirrors the parent repo's `data/` conventions.

## Cross-profile

This profile is the **side-pocket**, not the core. For everything else:

- `../long-term/` for the **core sleeve** — index funds, retirement, December tax-loss sweep.
- `../swing/` for **multi-day US-equity** swing trading.
- `../day-trading/` for **intraday US-equity** trading with the discipline-gated MCP server.
- `../options/` for **defined-risk US options spreads**.

Each sibling profile owns its own LLM persona and skill list; they do not bleed into each other.

## No quick start — read this instead

If you are not already using this profile, stop and ask:

> **Is crypto more than 20% of my trading activity or capital?**

- **No?** Stay in one of the equity profiles. Adding a crypto trade per quarter does not justify maintaining a separate persona — just do it from `../swing/` and accept the slightly-off framing.
- **Yes?** This monorepo is the wrong home for that. Read [`EXTRACT.md`](./EXTRACT.md) and copy this profile into a dedicated repo where you can build wallets, on-chain analytics, perp funding tracking, and vault depositor UX properly without being constrained by the equities-first conventions of the parent.

The pragmatic middle path — keeping a tiny crypto satellite alongside an equity book — is what this profile is for. Anything beyond that, extract.

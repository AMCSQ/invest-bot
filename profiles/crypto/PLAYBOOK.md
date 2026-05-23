# Crypto playbook (secondary profile — kept deliberately short)

The recurring routine for crypto as a **side-pocket**. This file is **intentionally shorter than the equity playbooks** to reinforce that crypto is not the main game in this repo. If you find yourself wanting to add a third or fourth crypto-specific routine here, take that as a signal that you have outgrown this profile and should **extract it into its own repo** ([`EXTRACT.md`](./EXTRACT.md)) and build the workflow out properly.

Each routine has the same shape: **trigger** (what kicks it off), **steps** (what you actually do), **output** (where the result lands), and **what good looks like** (so you know when to stop).

---

# Weekly

## W1 — Target-allocation rebalance check

- **Trigger:** Sunday evening, or any time BTC or ETH moves > 10% in a week.
- **Steps:**
  1. Read current spot balances per exchange (or wallet) into a one-off ledger. Pull current marks via `market-data --source ccxt`.
  2. Compute current weights vs your target (e.g. `BTC 50% / ETH 30% / SOL 15% / cash-stable 5%`).
  3. If any sleeve is more than **5 percentage points** off target, flag for rebalance. Defer to the next contribution if one is coming soon — same logic as the long-term profile, just on a crypto basis.
- **Output:** `reports/weekly/YYYY-Www/drift.md` — 5-line table.
- **What good looks like:** rebalances happen 1-2 times per quarter, not weekly. If you are rebalancing every week, your bands are too tight or you are tinkering.

## W2 — Perp funding log

- **Trigger:** end of week.
- **Steps:** for every open perp position, log the cumulative funding **paid or received** over the week (Hyperliquid / Bybit / Binance all expose this). Append to `data/funding/<exchange>/<symbol>.parquet` and note the net in `reports/weekly/YYYY-Www/funding.md`.
- **Output:** funding ledger + one-line summary.
- **What good looks like:** you know whether your perp positioning is a net carry cost or a net carry yield. If you have been paying funding for 4 weeks straight on the same position, that is a strong signal the market disagrees with your thesis.

## W3 — Vault / staking position check (only if applicable)

- **Trigger:** end of week, only if you have funds deposited in a vault, LP position, or staking contract.
- **Steps:** confirm vault APY vs deposit-date assumption, check for any governance / upgrade notices, verify your wallet still controls the position (no silent migration). One paragraph.
- **Output:** `reports/weekly/YYYY-Www/vault-notes.md`.
- **What good looks like:** most weeks empty. The week it is not empty, you are glad you checked.

---

# Pre-trade (when you actually swing a crypto name)

This is the loop to run **only when you are about to open a position**, not on every chart you look at.

1. **`/smc-scan --symbol BTCUSDT --timeframe 1h --concepts fvg,ob,bos,liquidity --plot`** — popular in crypto and gives you candidate zones to anchor stops and targets against. Treat the output as zones, **not signals**.
2. **`/ta-indicators --symbol BTC/USDT --add rsi,bb,atr,vwap`** — RSI for momentum, BB for vol context, ATR for stop sizing, VWAP if you are inside one session.
3. **`/decision-card`** — 90-second Annie-Duke pre-mortem. Thesis in one sentence, three falsifiers, expected R, exit criteria, bias most at risk. Writes a MD keyed to the order ID so the journal can score prediction vs reality later.
4. **Place the order** via ccxt for spot, or the exchange's perp SDK directly. There is no `BrokerAdapter` path for crypto in this repo — see [`README.md`](./README.md) §Skills excluded.
5. **Immediately `/trade-journal`** the open block (symbol, side, size, entry, stop, target, expected R, link to decision card).

When the position closes, run `/trade-journal` again with the close block (exit price, realized R, deviation notes vs the decision card).

---

# Monthly

## M1 — Crypto-only tearsheet

- **Trigger:** first weekend of the month.
- **Steps:** `/quant-tearsheet --returns data/journal/crypto-pnl.csv --benchmark BTC-USD`. Compare your crypto sleeve to **HODL BTC** (or a 50/50 BTC-ETH baseline). The honest question is: are you adding value over passive HODL after taxes and time?
- **Output:** `reports/tearsheet/YYYY-MM/`.
- **What good looks like:** Sharpe > BTC HODL Sharpe, max drawdown < BTC HODL max drawdown, AND time-in-market < 100%. If you cannot beat HODL on a risk-adjusted basis, the satellite is not earning its complexity.

## M2 — Mistake-miner (only if > 10 trades that month)

- **Trigger:** end of month, **gated on trade count**.
- **Steps:** `/mistake-miner --month YYYY-MM --source crypto`. Clusters the journal into recurring failure modes (chased pump, held perp through funding flip, exited at first green candle, etc.) and dollar-costs each leak.
- **Output:** `reports/reviews/YYYY-MM.md`.
- **What good looks like:** the top leak from last month is materially smaller this month. If the same leak shows up 3 months in a row, the rule that would have stopped it goes into your `data/playbook.md` (or you simply stop trading that setup).

---

# Event-driven

## E1 — Vol regime shift

- **Trigger:** BTC realized 30-day vol crosses 60% annualized (either direction).
- **Steps:** `/vol-forecast --symbol BTC-USD --model garch --horizon 168h`. If GARCH is forecasting another vol expansion, **cut perp leverage** before the move, not after.
- **Output:** `reports/events/YYYY-MM-DD-vol.md`.
- **What good looks like:** size cut **before** the vol expansion, not after the first liquidation candle.

## E2 — Funding flip

- **Trigger:** funding on a perp you are positioned in flips sign and stays flipped for > 24h.
- **Steps:** ask: does my thesis still hold against a market consensus this strong on the other side? Either size down or write a one-paragraph defense in the journal.
- **Output:** journal entry tagged `funding-flip`.
- **What good looks like:** you either acted on the flip or wrote down why you did not. Doing nothing without writing is the leak.

---

# When to escalate this playbook

If you find yourself **adding more crypto-specific routines than this** — on-chain alerts, MEV protection checks, vault yield decomposition, perp basis arbitrage, liquidation-cascade monitors, MM strategy on illiquid pairs — that is the signal. **Extract this profile into its own repo** ([`EXTRACT.md`](./EXTRACT.md)) and build it out there. The parent repo is going to keep optimizing for equities, and adding crypto-specific machinery here will rot every equity feature it touches.

This file stays short on purpose.

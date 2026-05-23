# Extracting `crypto` into its own repo

> **Recommendation: yes, extract.** This is the only profile in the repo where extraction is **strongly recommended** rather than merely supported. The reasons are structural, not stylistic, and they apply the moment crypto becomes more than a side-pocket.

## Why extraction is strongly recommended

Crypto and equities have **fundamentally different infrastructure**, and trying to share one repo cleanly across both will rot over time:

| Concern | Equities (this repo) | Crypto |
|---|---|---|
| Account model | Brokerage account, API keys, T+1 settlement | Self-custody wallet, seed phrase, on-chain settlement |
| Day-trade rule | PDT (< $25k → 4-day rule) | None — 24/7 markets |
| Session | NYSE 09:30 → 16:00 ET, pre/post extended | No session, no halts, no circuit breakers |
| Tax | Wash sale, Form 8949, Schedule D | Moving target post-2025; jurisdiction-dependent; no clean equivalent skill exists |
| Margin | Reg-T (50% initial, 25% maintenance) | Cross / isolated, perp funding, liquidation cascades |
| Data feed | Polygon / IEX / Tradier / Alpaca | ccxt across 107+ exchanges, plus on-chain (Etherscan, Dune, Flipside) |
| Order route | `BrokerAdapter` → Alpaca / IBKR / Tradier / Tastytrade / Schwab | ccxt for spot, exchange SDK for perps, **plus** wallet signers for DEX |
| Native UX | Order ticket + level 2 + halts banner | Wallet connect + slippage + lock period + gas estimate |

Every one of these rows is a fork in the abstraction. Trying to express both inside a single `BrokerAdapter` interface, a single tax module, a single session-warmup, a single tilt-guard, etc., either produces lowest-common-denominator code (useless to both) or leaky abstractions (where the equity defaults silently misbehave for crypto and vice versa). The clean answer is **two repos**, each focused.

## Files to copy

From the current repo root (`Financial-Planner/`), copy these into the new repo:

```bash
# profile contents → new repo root
cp -r profiles/crypto/*  <new-repo>/
cp -r profiles/crypto/.claude  <new-repo>/.claude

# allowed skills (deliberately a small set)
mkdir -p <new-repo>/.claude/skills
for s in market-data smc-scan sentiment-scan ta-indicators \
         trade-journal decision-card quant-tearsheet risk-var \
         vol-forecast backtest-runner pre-trade-checklist mistake-miner; do
  cp -r .claude/skills/$s <new-repo>/.claude/skills/
done

# design tokens + DataAdapter abstraction — keep these; the visual system was crypto-flavored already
mkdir -p <new-repo>/design/code/adapters
cp design/code/tokens.ts design/code/tokens.css design/code/DataAdapter.ts <new-repo>/design/code/
cp design/code/adapters/Synthetic*.ts <new-repo>/design/code/adapters/

# the Voltrex brief was sourced from a crypto-vault Dribbble shot — it FITS here
cp design/DASHBOARD-BRIEF.md design/VISUAL-AUDIT.md <new-repo>/design/

# repo hygiene
cp -r scripts <new-repo>/
cp .github/workflows/ci.yml <new-repo>/.github/workflows/
```

## Files NOT to copy

| Path | Why skip |
|---|---|
| `profiles/{long-term,swing,day-trading,options}/` | Different personas; out of scope for the crypto repo. |
| `.claude/skills/retire-fire` | Multi-decade horizon; off-topic. |
| `.claude/skills/etf-analyzer` | US ETFs only. |
| `.claude/skills/debt-payoff` | Personal-finance side; off-topic. |
| `.claude/skills/tax-loss-harvest` | US-equity wash-sale machinery; crypto tax is a different beast and the rules are still settling. |
| `.claude/skills/equities-screener` | Finviz / US equities only. |
| `.claude/skills/options-{chain,strategy-builder}`, `.claude/skills/greeks-monitor`, `.claude/skills/iv-surface` | Equity-options-flavored; crypto options (Deribit, Bybit) need a clean rewrite, not a port. |
| `.claude/skills/alert-webhook` | Hardened for TradingView-equity-broker flow; route crypto webhooks to ccxt / exchange SDK directly. |
| `.claude/skills/broker-connect` | Scaffolds US-equity-broker adapters only. |
| `.claude/skills/daily-routine`, `.claude/skills/session-warmup`, `.claude/skills/tilt-guard` | All assume an NYSE session. Crypto has no session — re-author crypto-shaped variants. |
| `.claude/skills/pine-{new,to-python}` | Pine works for crypto, but the templates and idioms are calibrated to equities. |
| `design/code/BrokerAdapter.ts` and the non-synthetic broker adapters | Equity-broker interface; the crypto repo needs its own (ccxt + wallet signer abstraction). |
| `design/EQUITIES-DASHBOARD.md`, `design/TRADINGVIEW-INTEGRATION.md`, `design/PLATFORM-INTEGRATIONS.md` | Equity-specific. |
| `web/` | Next.js host wired to BrokerAdapter + TV webhook receiver; redo it crypto-shaped. |
| `mcp/` | Wraps BrokerAdapter + DataAdapter as MCP tools — equity-broker flavored. |
| `FAVOURITE-REPOS.md`, `SKILLS.md` | Parent-project catalog; write a crypto-focused minimal version. |

## Things you will need to ADD post-extraction

The parent repo deliberately does **not** ship these because they are crypto-specific and would distort the equity-first design. Once extracted, you will need to build or import:

1. **Wallet / seed-phrase handling.** Not in the source repo at all. Look at the Hyperliquid Python SDK ([github.com/hyperliquid-dex/hyperliquid-python-sdk](https://github.com/hyperliquid-dex/hyperliquid-python-sdk)) for a clean reference, or wagmi / viem on the TypeScript side. Seed phrases never go in `data/`; they go in a system keychain or hardware wallet, never in plaintext.
2. **On-chain analytics adapter.** Wrap something like `ethereum-etl`, Dune Analytics API, or Flipside Crypto. Add as a new skill, `onchain-flow` or similar — model it on the `market-data` SKILL.md shape.
3. **Perp funding tracker.** A small writer that polls Hyperliquid / Bybit / Binance funding endpoints and appends to `data/funding/<exchange>/<symbol>.parquet`. Feeds the W2 routine in `PLAYBOOK.md`.
4. **Vault depositor UI.** The Voltrex brief in `design/DASHBOARD-BRIEF.md` (which you copied above) already specs the deposit panel, lock slider, boost, and ERC-4626 conventions. That work is **already done** — just ship it. This is the one place the parent repo's design pack is genuinely a head start for crypto.
5. **Crypto-shaped `tilt-guard` and `pre-trade-checklist`.** 24/7 markets mean "session start" is whenever you sit down. Re-author the gates around personal cadence (sleep, last loss, position concentration) rather than around an NYSE bell.
6. **A crypto-tax module.** Once US tax treatment of crypto stabilizes (the legislative direction post-2025 is still in motion as of this writing), build a wash-sale-aware equivalent. Until then, point the user at a CPA and surface raw trade history in CSV.

## Suggested new repo name

- `crypto-side-pocket` — honest about positioning; small-and-focused framing.
- `defi-trading-os` — if you intend to grow it past spot/perp into LP / lending / vault deposits.

Pick one and never rename it.

## Extraction recipe — `git filter-repo` (cleaner history)

```bash
git clone <this-repo> crypto-side-pocket
cd crypto-side-pocket
git filter-repo \
  --path profiles/crypto \
  --path .claude/skills/market-data \
  --path .claude/skills/smc-scan \
  --path .claude/skills/sentiment-scan \
  --path .claude/skills/ta-indicators \
  --path .claude/skills/trade-journal \
  --path .claude/skills/decision-card \
  --path .claude/skills/quant-tearsheet \
  --path .claude/skills/risk-var \
  --path .claude/skills/vol-forecast \
  --path .claude/skills/backtest-runner \
  --path .claude/skills/pre-trade-checklist \
  --path .claude/skills/mistake-miner \
  --path design/code/tokens.ts \
  --path design/code/tokens.css \
  --path design/code/DataAdapter.ts \
  --path design/code/adapters/SyntheticBrokerAdapter.ts \
  --path design/DASHBOARD-BRIEF.md \
  --path design/VISUAL-AUDIT.md \
  --path scripts \
  --path .github/workflows/ci.yml
git filter-repo --path-rename profiles/crypto/:
# then: drop EXTRACT.md (meta), rewrite README.md cross-profile section,
# bump package.json/pyproject.toml name, add the wallet + on-chain + funding-tracker
# modules listed above
```

## Bash-script alternative (no history)

```bash
#!/usr/bin/env bash
set -euo pipefail
SRC=$(pwd)
DST=$1
mkdir -p "$DST/.claude/skills" "$DST/design/code/adapters" "$DST/scripts" "$DST/.github/workflows"
cp -r "$SRC/profiles/crypto/." "$DST/"
for s in market-data smc-scan sentiment-scan ta-indicators trade-journal \
         decision-card quant-tearsheet risk-var vol-forecast backtest-runner \
         pre-trade-checklist mistake-miner; do
  cp -r "$SRC/.claude/skills/$s" "$DST/.claude/skills/"
done
cp "$SRC/design/code/"{tokens.ts,tokens.css,DataAdapter.ts} "$DST/design/code/"
cp "$SRC/design/code/adapters/SyntheticBrokerAdapter.ts" "$DST/design/code/adapters/"
cp "$SRC/design/"{DASHBOARD-BRIEF.md,VISUAL-AUDIT.md} "$DST/design/"
cp -r "$SRC/scripts" "$DST/"
cp "$SRC/.github/workflows/ci.yml" "$DST/.github/workflows/"
cd "$DST" && git init && git add -A && git commit -m "Initial import from Financial-Planner crypto profile"
```

## Renames and adjustments after copy

1. Move `profiles/crypto/README.md` → `<new-repo>/README.md` (overwriting any placeholder), and **delete the secondary-profile preamble** — in the new repo, crypto is the primary, not the secondary.
2. In the new `README.md`, delete the **Cross-profile** section — there are no sibling profiles.
3. In the new `CLAUDE.md`, delete the **Routing rules** that redirect to `../long-term/`, `../swing/`, `../day-trading/`, `../options/` — those paths no longer exist. Keep the FinceptTerminal route as a power-user reference.
4. Update any path like `../../design/` → `./design/` (one level shallower at the new root).
5. Drop `EXTRACT.md` — you have already extracted; this file is meta.
6. Bump `package.json` / `pyproject.toml` name.
7. Add a **WALLETS.md** explaining seed-phrase hygiene before you let anyone clone the new repo.

## Final note

**This extraction is the recommended path.** The parent Financial-Planner repo will continue serving its equities-first focus; the crypto repo you build from this seed will have room to grow into wallets, on-chain analytics, perp funding workflows, vault depositor UIs (the Voltrex brief is already a head start), and crypto-shaped discipline gates — without competing with the parent's equity focus and without the parent's equity conventions leaking into your crypto code.

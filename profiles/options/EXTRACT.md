# Extracting `options` into its own repo

This profile is self-contained enough to live as a standalone repo for an options-only trader. This file describes exactly what to copy, what to leave behind, and the renames required.

## Why extract

- **Focus.** An options-only trader does not need a watchlist, an equities screener, a retire-fire simulator, or three different Pine-script generators in their tool surface. Stripping those down to the vol-first 14-skill core makes the LLM crisper and the repo readable in one sitting.
- **Smaller LLM token surface.** Claude loads less irrelevant context, so answers are sharper and prompt caching is more effective.
- **Independent versioning.** Bump skills here without re-testing the day-trading, swing, or long-term profiles.
- **Easier to share.** Hand a friend a clean `options-vol-os` repo instead of the full multi-profile mothership.

## Files to copy

From the current repo root (`Financial-Planner/`), copy these into the new repo:

```bash
# profile contents → new repo root
cp -r profiles/options/*  <new-repo>/
cp -r profiles/options/.claude  <new-repo>/.claude

# allowed skills — the 14 vol-first core
mkdir -p <new-repo>/.claude/skills
for s in iv-surface options-chain options-strategy-builder greeks-monitor \
         vol-forecast risk-var portfolio-optimize tax-loss-harvest \
         trade-journal decision-card pre-trade-checklist mistake-miner \
         market-data broker-connect; do
  cp -r .claude/skills/$s <new-repo>/.claude/skills/
done

# design tokens + the abstract adapter interfaces + the only React widget that matters
mkdir -p <new-repo>/design/code/adapters
cp design/code/tokens.ts design/code/tokens.css \
   design/code/BrokerAdapter.ts design/code/DataAdapter.ts \
   design/code/AnimatedNumber.tsx <new-repo>/design/code/

# concrete adapters worth carrying — synthetic for tests, Tradier as options default,
# Polygon for historical chain replay, yfinance for underlying close fallback
cp design/code/adapters/SyntheticBrokerAdapter.ts \
   design/code/adapters/TradierBrokerAdapter.ts \
   design/code/adapters/PolygonDataAdapter.ts \
   design/code/adapters/YFinanceDataAdapter.ts \
   <new-repo>/design/code/adapters/

# design docs — keep the options-relevant slices
mkdir -p <new-repo>/design
# EQUITIES-DASHBOARD §7 has the options-approval-tier + wash-sale tables; extract those.
# TRADINGVIEW-INTEGRATION.md if you use alert-webhook to auto-fire option tickets from TV alerts.
cp design/EQUITIES-DASHBOARD.md <new-repo>/design/   # then trim everything except §7
cp design/TRADINGVIEW-INTEGRATION.md <new-repo>/design/

# MCP server (orders + data exposed as tools — actually useful here, options book is order-heavy)
cp -r mcp <new-repo>/

# repo hygiene
cp -r scripts <new-repo>/
cp -r .github <new-repo>/
```

## Files NOT to copy

| Path | Why skip |
|---|---|
| `profiles/{long-term,swing,day-trading,crypto}/` | Different personas. |
| `.claude/skills/{retire-fire,debt-payoff,etf-analyzer}` | Wrong horizon, wrong asset class. |
| `.claude/skills/{smc-scan,chart-render,ta-indicators}` | Chart-heavy day-trade tools; not used in vol selection. |
| `.claude/skills/{pine-new,pine-to-python}` | Pine ≠ options-native; relevant only if you also trade the underlying setup, which this profile does not. |
| `.claude/skills/{regime-detect,sentiment-scan,statarb-scan}` | Limited edge for an options book — vol regime is the regime that matters. |
| `.claude/skills/{equities-screener}` | Mostly skip; finds stocks, but the *vol* regime is what filters our tickets. Carry only if you also do earnings-name discovery. |
| `.claude/skills/{daily-routine,session-warmup}` | Built around the intraday equities tape; options PLAYBOOK has its own cadence. |
| `.claude/skills/{tilt-guard,backtest-runner,quant-tearsheet,dashboard-build,tradingview-embed,alert-webhook,code-map}` | Carry selectively if you actually use them. The default extract leaves them out. |
| `web/components/{HeroChart,LeaderCard,Watchlist}.tsx` | Designed for stock watchlists — replace with an options-specific chain viewer + payoff diagram + greeks tile when you build the new dashboard. |
| `design/VISUAL-AUDIT.md` | Pixel-level crypto-dashboard critique; off-topic. |
| `FAVOURITE-REPOS.md`, `SKILLS.md` | Catalog of the parent project; rewrite a minimal one if you want. |

## Renames and adjustments after copy

1. Move `profiles/options/README.md` → `<new-repo>/README.md` (overwriting any placeholder).
2. In the new `README.md`, delete the **Cross-profile** section — there are no sibling profiles in the standalone repo.
3. In the new `CLAUDE.md`, delete the redirects to `../long-term/`, `../swing/`, `../day-trading/` — those paths no longer exist.
4. Update any path like `../../design/` → `./design/` (one level shallower at the new root).
5. Trim `design/EQUITIES-DASHBOARD.md` to just §7 (options approval, wash-sale) — rename to `design/OPTIONS-APPROVAL.md`.
6. Drop `EXTRACT.md` — you have already extracted; this file is meta.
7. Bump `package.json` / `pyproject.toml` name if present.
8. Replace `web/components/HeroChart.tsx` and `Watchlist.tsx` with an options-specific chain viewer + payoff diagram + greeks tile (or leave the `web/` folder out entirely and let `dashboard-build` scaffold a Streamlit UI later).

## Suggested new repo names

- **`options-vol-os`** — emphasizes the vol-first, operating-system framing.
- **`theta-engine`** — descriptive, memorable, leans into the income-book identity.

Pick one and never rename it.

## Extraction recipe — `git filter-repo` (cleaner history)

```bash
git clone <this-repo> options-vol-os
cd options-vol-os
git filter-repo \
  --path profiles/options \
  --path .claude/skills/iv-surface \
  --path .claude/skills/options-chain \
  --path .claude/skills/options-strategy-builder \
  --path .claude/skills/greeks-monitor \
  --path .claude/skills/vol-forecast \
  --path .claude/skills/risk-var \
  --path .claude/skills/portfolio-optimize \
  --path .claude/skills/tax-loss-harvest \
  --path .claude/skills/trade-journal \
  --path .claude/skills/decision-card \
  --path .claude/skills/pre-trade-checklist \
  --path .claude/skills/mistake-miner \
  --path .claude/skills/market-data \
  --path .claude/skills/broker-connect \
  --path design/code/tokens.ts \
  --path design/code/tokens.css \
  --path design/code/BrokerAdapter.ts \
  --path design/code/DataAdapter.ts \
  --path design/code/AnimatedNumber.tsx \
  --path design/code/adapters/SyntheticBrokerAdapter.ts \
  --path design/code/adapters/TradierBrokerAdapter.ts \
  --path design/code/adapters/PolygonDataAdapter.ts \
  --path design/code/adapters/YFinanceDataAdapter.ts \
  --path design/EQUITIES-DASHBOARD.md \
  --path design/TRADINGVIEW-INTEGRATION.md \
  --path mcp \
  --path scripts \
  --path .github
git filter-repo --path-rename profiles/options/:
# then run the rename steps above
```

## Bash-script alternative (no history)

If you do not care about commit history:

```bash
#!/usr/bin/env bash
set -euo pipefail
SRC=$(pwd)
DST=$1
mkdir -p "$DST/.claude/skills" "$DST/design/code/adapters" "$DST/scripts" "$DST/.github/workflows"
cp -r "$SRC/profiles/options/." "$DST/"
for s in iv-surface options-chain options-strategy-builder greeks-monitor \
         vol-forecast risk-var portfolio-optimize tax-loss-harvest \
         trade-journal decision-card pre-trade-checklist mistake-miner \
         market-data broker-connect; do
  cp -r "$SRC/.claude/skills/$s" "$DST/.claude/skills/"
done
cp "$SRC/design/code/"{tokens.ts,tokens.css,BrokerAdapter.ts,DataAdapter.ts,AnimatedNumber.tsx} "$DST/design/code/"
cp "$SRC/design/code/adapters/"{SyntheticBrokerAdapter,TradierBrokerAdapter,PolygonDataAdapter,YFinanceDataAdapter}.ts "$DST/design/code/adapters/"
cp "$SRC/design/"{EQUITIES-DASHBOARD,TRADINGVIEW-INTEGRATION}.md "$DST/design/"
cp -r "$SRC/mcp" "$DST/"
cp -r "$SRC/scripts" "$DST/"
cp -r "$SRC/.github" "$DST/"
cd "$DST" && git init && git add -A && git commit -m "Initial import from Financial-Planner options profile"
```

Once extracted, push to a new repo, set up Dependabot in `.github/dependabot.yml`, and use this README as the seed.

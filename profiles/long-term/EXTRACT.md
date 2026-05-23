# Extracting `long-term` into its own repo

This profile is self-contained enough to live as a standalone repo. This file describes exactly what to copy, what to leave behind, and the renames required.

## Why extract

- **Focus.** A repo that does only one thing is easier to read 18 months from now.
- **Smaller LLM token surface.** Claude loads less irrelevant context, so answers are crisper and prompt caching is more effective.
- **Independent versioning.** Bump skills here without re-testing the day-trading or options profiles.
- **Easier to share.** Hand a friend a clean `personal-allocation-os` repo instead of the full multi-profile mothership.

## Files to copy

From the current repo root (`Financial-Planner/`), copy these into the new repo:

```bash
# profile contents → new repo root
cp -r profiles/long-term/*  <new-repo>/
cp -r profiles/long-term/.claude  <new-repo>/.claude

# allowed skills
mkdir -p <new-repo>/.claude/skills
for s in etf-analyzer portfolio-optimize retire-fire tax-loss-harvest \
         debt-payoff risk-var quant-tearsheet market-data dashboard-build; do
  cp -r .claude/skills/$s <new-repo>/.claude/skills/
done

# design tokens + data adapter abstraction (still useful for a future dashboard)
mkdir -p <new-repo>/design/code/adapters
cp design/code/tokens.ts design/code/tokens.css design/code/DataAdapter.ts <new-repo>/design/code/
cp design/code/adapters/YFinanceDataAdapter.ts <new-repo>/design/code/adapters/
cp design/code/adapters/SyntheticBrokerAdapter.ts <new-repo>/design/code/adapters/

# repo hygiene
cp scripts/lint-skills.ts <new-repo>/scripts/
cp .github/workflows/ci.yml <new-repo>/.github/workflows/
```

## Files NOT to copy

| Path | Why skip |
|---|---|
| `profiles/{swing,day-trading,options,crypto}/` | Different personas; not relevant here. |
| `.claude/skills/{smc-scan,pine-new,pine-to-python,chart-render,ta-indicators,backtest-runner}` | Intraday / chart-driven. |
| `.claude/skills/{tilt-guard,pre-trade-checklist,decision-card,trade-journal,mistake-miner,session-warmup,daily-routine}` | Discipline tooling for active traders. |
| `.claude/skills/{options-chain,options-strategy-builder,greeks-monitor,iv-surface,vol-forecast}` | No options here. |
| `.claude/skills/{equities-screener,sentiment-scan,statarb-scan,regime-detect}` | Name-picking and regime-switching are not part of the strategy. |
| `.claude/skills/{alert-webhook,broker-connect,tradingview-embed}` | No real-time alerts, no order placement. |
| `design/VISUAL-AUDIT.md` | Pixel-level crypto-dashboard critique; off-topic. |
| `mcp/` | This repo places no orders, so the MCP order-routing layer is dead weight. |
| `web/` | Next.js host is overkill for this persona; a Streamlit / Jupyter dashboard via `dashboard-build` is a better fit. |
| `FAVOURITE-REPOS.md`, `SKILLS.md` | Catalog of the parent project; rewrite a minimal one if you want. |

## Renames and adjustments after copy

1. Move `profiles/long-term/README.md` → `<new-repo>/README.md` (overwriting any placeholder).
2. In the new `README.md`, delete the **Cross-profile** section — there are no sibling profiles in the standalone repo.
3. In the new `CLAUDE.md`, delete the **Skills to avoid in this profile** redirects to `../day-trading/`, `../options/`, `../swing/` — those paths no longer exist.
4. Update any path like `../../design/` → `./design/` (one level shallower at the new root).
5. Drop `EXTRACT.md` — you have already extracted; this file is meta.
6. Bump `package.json` / `pyproject.toml` name if present.

## Suggested new repo name

- `personal-allocation-os` — emphasizes the operating-system framing.
- `long-term-portfolio` — descriptive, boring, finds itself easily in GitHub search.

Pick one and never rename it.

## Extraction recipe — `git subtree split`

Preserve commit history for `profiles/long-term/` only:

```bash
git subtree split --prefix=profiles/long-term -b long-term-extracted
git checkout long-term-extracted
# now move siblings (skills, design) into this branch via cherry-picks or a follow-up commit
git remote add new-origin git@github.com:<you>/personal-allocation-os.git
git push new-origin long-term-extracted:main
```

## Extraction recipe — `git filter-repo` (cleaner history)

```bash
git clone <this-repo> personal-allocation-os
cd personal-allocation-os
git filter-repo \
  --path profiles/long-term \
  --path .claude/skills/etf-analyzer \
  --path .claude/skills/portfolio-optimize \
  --path .claude/skills/retire-fire \
  --path .claude/skills/tax-loss-harvest \
  --path .claude/skills/debt-payoff \
  --path .claude/skills/risk-var \
  --path .claude/skills/quant-tearsheet \
  --path .claude/skills/market-data \
  --path .claude/skills/dashboard-build \
  --path design/code/tokens.ts \
  --path design/code/tokens.css \
  --path design/code/DataAdapter.ts \
  --path design/code/adapters/YFinanceDataAdapter.ts \
  --path design/code/adapters/SyntheticBrokerAdapter.ts \
  --path scripts/lint-skills.ts \
  --path .github/workflows/ci.yml
git filter-repo --path-rename profiles/long-term/:
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
cp -r "$SRC/profiles/long-term/." "$DST/"
for s in etf-analyzer portfolio-optimize retire-fire tax-loss-harvest \
         debt-payoff risk-var quant-tearsheet market-data dashboard-build; do
  cp -r "$SRC/.claude/skills/$s" "$DST/.claude/skills/"
done
cp "$SRC/design/code/"{tokens.ts,tokens.css,DataAdapter.ts} "$DST/design/code/"
cp "$SRC/design/code/adapters/"{YFinanceDataAdapter,SyntheticBrokerAdapter}.ts "$DST/design/code/adapters/"
cp "$SRC/scripts/lint-skills.ts" "$DST/scripts/"
cp "$SRC/.github/workflows/ci.yml" "$DST/.github/workflows/"
cd "$DST" && git init && git add -A && git commit -m "Initial import from Financial-Planner long-term profile"
```

Once extracted, push to a new repo, set up Dependabot for `.github/dependabot.yml`, and use this README as the seed.

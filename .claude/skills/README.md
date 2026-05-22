# `.claude/skills/` — Financial-Planner skill pack

22 SKILL.md entries, each a thin wrapper that tells Claude *which* well-known open-source library to use, *when* to use it, and *what* output shape to produce. Nothing is auto-installed — the first time you invoke a skill, Claude will pip-install or `uvx` the underlying library into the active venv.

## Index

### Quant analytics
- [`quant-tearsheet`](./quant-tearsheet/SKILL.md) — QuantStats HTML/Markdown performance report
- [`risk-var`](./risk-var/SKILL.md) — historical / parametric / GARCH VaR & CVaR via empyrical + arch
- [`vol-forecast`](./vol-forecast/SKILL.md) — GARCH(1,1) / EGARCH conditional vol forecast via arch
- [`ta-indicators`](./ta-indicators/SKILL.md) — enrich an OHLCV DataFrame with `ta` / `pandas-ta` indicators
- [`regime-detect`](./regime-detect/SKILL.md) — HMM regime classifier (bull/bear/high-vol)
- [`statarb-scan`](./statarb-scan/SKILL.md) — cointegration-based pairs scanner via arbitragelab

### Portfolio & personal planning
- [`portfolio-optimize`](./portfolio-optimize/SKILL.md) — PyPortfolioOpt + Riskfolio-Lib + skfolio
- [`retire-fire`](./retire-fire/SKILL.md) — historical-cycle + Monte Carlo FIRE simulator
- [`debt-payoff`](./debt-payoff/SKILL.md) — avalanche vs snowball schedule generator

### Strategy R&D
- [`backtest-runner`](./backtest-runner/SKILL.md) — Backtesting.py + VectorBT scaffolder
- [`smc-scan`](./smc-scan/SKILL.md) — Smart Money Concepts (FVG / OB / BOS / liquidity) scan
- [`pine-new`](./pine-new/SKILL.md) — Pine Script v5/v6 indicator or strategy generator
- [`chart-render`](./chart-render/SKILL.md) — annotated lightweight-charts-python image
- [`sentiment-scan`](./sentiment-scan/SKILL.md) — FinBERT sentiment on RSS / headlines

### Data & dashboards
- [`market-data`](./market-data/SKILL.md) — fetch OHLCV via yfinance / ccxt / OpenBB MCP
- [`dashboard-build`](./dashboard-build/SKILL.md) — scaffold a Streamlit BI dashboard

### Discipline / psychology
- [`trade-journal`](./trade-journal/SKILL.md) — log a trade as YAML-frontmatter MD
- [`tilt-guard`](./tilt-guard/SKILL.md) — behavioral circuit breaker (with `PreToolUse` hook)
- [`decision-card`](./decision-card/SKILL.md) — Annie Duke pre-mortem card keyed to order ID
- [`pre-trade-checklist`](./pre-trade-checklist/SKILL.md) — go/no-go gate writing `state.yaml`
- [`mistake-miner`](./mistake-miner/SKILL.md) — embedding-clustered recurring failure modes
- [`session-warmup`](./session-warmup/SKILL.md) — pre-market cognitive priming

## Conventions

All skills share a few conventions to keep them composable:

- **Data lives in `data/`** at the repo root: `data/quotes/<symbol>.parquet`, `data/journal/YYYY-MM-DD.md`, `data/reviews/YYYY-MM.md`, `data/state.yaml`.
- **Cache lives in `~/.claude/cache/financial-planner/<skill>/`** so re-running is cheap.
- **Reports are written to `reports/<skill>/<timestamp>/`** — never overwritten, so backtest history is preserved.
- **Skills shell out to Python via `uvx --with <lib>`** when possible so we never pollute the system Python.
- **License-flagged libraries (GPL, AGPL, no-LICENSE) are invoked as external CLIs** rather than imported, to avoid creating a derivative work.

## Hooks

Two of the discipline skills install settings.json hooks:

- `tilt-guard` registers a `PreToolUse` hook on order-placement MCP tools that reads `data/state.yaml` and blocks the call if the tilt score is too high.
- `pre-trade-checklist` writes `data/state.yaml` and refuses to proceed until the checklist is signed.

The hooks live in `.claude/settings.json` (created on first invocation of those skills).

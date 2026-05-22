# Financial-Planner

A personal financial planning + trading research repo curated for use with **Claude Code**.

The repo doubles as a Claude Code **skills pack**: drop the `.claude/skills/` folder into any project (or symlink it into `~/.claude/skills/`) to get a focused set of slash-commands for portfolio research, backtesting, risk, journaling, and trading discipline.

## What's here

- [`SKILLS.md`](./SKILLS.md) — exhaustive categorized catalog of open-source repos and Claude Code skills relevant to trading, quant finance, dashboards, GitHub workflow, and trading psychology. Built from a 10-agent research sweep of the 2026 ecosystem (Analytics Vidhya's Top-5 mega-collections + adjacent libraries).
- [`.claude/skills/`](./.claude/skills) — 22 ready-to-use SKILL.md entries, organized into:
  - **Quant analytics** — `quant-tearsheet`, `risk-var`, `vol-forecast`, `ta-indicators`, `regime-detect`, `statarb-scan`
  - **Portfolio & planning** — `portfolio-optimize`, `retire-fire`, `debt-payoff`
  - **Strategy R&D** — `backtest-runner`, `smc-scan`, `pine-new`, `chart-render`, `sentiment-scan`
  - **Data plumbing** — `market-data`, `dashboard-build`
  - **Discipline / psychology** — `trade-journal`, `tilt-guard`, `decision-card`, `pre-trade-checklist`, `mistake-miner`

## Quick start

```bash
# clone the repo (already done if you're reading this locally)
git clone https://github.com/AMCSQ/Financial-Planner.git
cd Financial-Planner

# option A: use skills only in this repo (recommended for sandboxing)
#   skills auto-discovered from ./.claude/skills/

# option B: install globally for any project
ln -s "$(pwd)/.claude/skills/"* ~/.claude/skills/

# launch Claude Code in the repo
claude
```

Skills are passive markdown — no code is installed until you actually invoke one. Most skills shell out to well-known Python libraries (`yfinance`, `quantstats`, `pyportfolioopt`, `arch`, `backtesting.py`, `pandas-ta`, `smart-money-concepts`, `vectorbt`); the SKILL.md tells Claude *which* library, *when* to use it, and *what* output shape to produce.

## Use context

Set up for **personal authorized trading research**. None of this is financial advice; backtests don't predict futures, and several included tools (ICT/SMC pattern detectors, sentiment classifiers, LLM agents) produce signals that look more confident than they should. Verify everything on your own data before risking capital.

## License caveats embedded in the catalog

Every entry in [`SKILLS.md`](./SKILLS.md) lists license + recent activity. A few hot ones to know:
- **MlFinLab** is *not* truly open source — commercial license required. The catalog routes its techniques to `skfolio` + `timeseriescv` instead.
- **OpenAlgo** is AGPL-3.0 — fine for self-host, risky for SaaS.
- **everget pinescript indicators** and **BennyThadikaran/stock-pattern** are GPL-3.0 — keep as external invocations, don't vendor.
- Many indicator repos ship without a LICENSE file ("all rights reserved" by default); skills flagged for that use them as reference only.

## Branch

Development happens on `claude/financial-planner-overview-DFwnZ`.

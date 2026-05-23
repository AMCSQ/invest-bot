# Extract this profile into a standalone repo

## Why extract

You've used the swing profile for 2-3 months, the journal has > 50 closed trades, the screener filter packs are tuned, and you've stopped touching the other profiles. The monorepo is now noise — every grep, every Claude context window, every `ls` carries 4 sibling profiles you don't use. Extracting cuts cognitive overhead and makes it trivial to share or back up just your swing book.

A standalone repo also lets you keep the journal on a private branch / private remote even if the parent Financial-Planner repo is public, and lets you wire CI specifically to your setup tests instead of the whole skill catalog.

## Files to copy

From the parent Financial-Planner repo into the new repo root:

```
profiles/swing/*                    → root  (README, PLAYBOOK, CLAUDE.md, EXTRACT.md, .claude/)
.claude/skills/equities-screener
.claude/skills/backtest-runner
.claude/skills/ta-indicators
.claude/skills/smc-scan
.claude/skills/pine-new
.claude/skills/pine-to-python
.claude/skills/chart-render
.claude/skills/sentiment-scan
.claude/skills/quant-tearsheet
.claude/skills/trade-journal
.claude/skills/decision-card
.claude/skills/pre-trade-checklist
.claude/skills/mistake-miner
.claude/skills/session-warmup
.claude/skills/daily-routine        (optional; if you ever scale intraday)
.claude/skills/regime-detect
.claude/skills/market-data
.claude/skills/broker-connect
.claude/skills/risk-var
design/code/tokens.*
design/code/DataAdapter.ts
design/code/BrokerAdapter.ts
design/code/HeroChart.tsx
design/code/LeaderCard.tsx
design/code/AnimatedNumber.tsx
design/code/adapters/Synthetic*.ts
design/code/adapters/Alpaca*.ts
design/code/adapters/YFinance*.ts
design/code/adapters/Polygon*.ts
design/EQUITIES-DASHBOARD.md
design/TRADINGVIEW-INTEGRATION.md   (for Pine alerts → webhook flow)
mcp/                                 (optional; for alert routing)
scripts/
.github/workflows/ci.yml
```

## NOT to copy

Anything outside your loop is dead weight. Leave behind:

- `profiles/long-term/`, `profiles/day-trading/`, `profiles/options/` — other personas.
- `.claude/skills/retire-fire`, `.claude/skills/etf-analyzer`, `.claude/skills/debt-payoff`, `.claude/skills/portfolio-optimize` — long-term concerns.
- `.claude/skills/options-chain`, `.claude/skills/options-strategy-builder`, `.claude/skills/greeks-monitor`, `.claude/skills/iv-surface`, `.claude/skills/vol-forecast` — options sleeve.
- `.claude/skills/tax-loss-harvest` — unless your swing sleeve has > 10 closed losers in taxable; even then it really wants to live with the core sleeve.
- `.claude/skills/tilt-guard`, `.claude/skills/statarb-scan` — kept available in monorepo but not in this profile's default loadout.
- `design/VISUAL-AUDIT.md` — pixel-level reference critique, not relevant to the swing workflow.
- `design/PLATFORM-INTEGRATIONS.md` (optional) — broad survey; you've already picked Alpaca + yfinance/polygon.
- `web/` is optional — only port if you've actually used the Next.js host. Most swing traders never need the dashboard.

## Suggested new repo name

- `swing-trading-os` — if you want the cockpit framing.
- `equity-swing-cockpit` — more specific, signals US equities focus.
- `weekly-edge` — if you want to brand around the weekend-led rhythm.

## Extraction commands

Bash one-liners from the parent repo root:

```bash
NEW=../swing-trading-os
mkdir -p "$NEW"/.claude/skills "$NEW"/design/code/adapters
cp -r profiles/swing/. "$NEW"/
for s in equities-screener backtest-runner ta-indicators smc-scan pine-new pine-to-python \
         chart-render sentiment-scan quant-tearsheet trade-journal decision-card \
         pre-trade-checklist mistake-miner session-warmup daily-routine regime-detect \
         market-data broker-connect risk-var; do
  cp -r ".claude/skills/$s" "$NEW/.claude/skills/"
done
cp design/code/{tokens.*,DataAdapter.ts,BrokerAdapter.ts,HeroChart.tsx,LeaderCard.tsx,AnimatedNumber.tsx} "$NEW/design/code/"
cp design/code/adapters/{Synthetic,Alpaca,YFinance,Polygon}*.ts "$NEW/design/code/adapters/"
cp design/EQUITIES-DASHBOARD.md design/TRADINGVIEW-INTEGRATION.md "$NEW/design/"
cp -r mcp scripts .github "$NEW/" 2>/dev/null || true
cd "$NEW" && git init && git add -A && git commit -m "Initial swing trading OS extracted from Financial-Planner"
```

If you want to preserve the parent repo's commit history for just these paths, use [`newren/git-filter-repo`](https://github.com/newren/git-filter-repo):

```bash
git clone <parent-url> swing-trading-os && cd swing-trading-os
git filter-repo \
  --path profiles/swing --path .claude/skills/equities-screener \
  --path .claude/skills/backtest-runner --path .claude/skills/trade-journal \
  --path .claude/skills/decision-card --path .claude/skills/mistake-miner \
  # ... etc, one --path per kept directory
  --path design/code --path design/EQUITIES-DASHBOARD.md
```

Then move `profiles/swing/*` to the root with another filter-repo `--path-rename profiles/swing/:` invocation.

## Don't forget the data

The screener filter packs (`data/screeners/*.yaml`), the journal history (`data/journal/**`), the decision cards (`data/decisions/**`), and the monthly review outputs (`reports/reviews/**`) are your institutional knowledge. Copy them with `cp -r data reports "$NEW"/` if you have any. Without them, `mistake-miner` has nothing to cluster, `quant-tearsheet` has no NAV, and `expectancy.json` starts from zero — you'd be wiping months of self-study.

---

Once extracted, your monthly mistake-miner output and weekend screener filters become institutional knowledge specific to **your** setups, not generic templates. That's when the profile stops being a Claude Code skill pack and starts being a personal trading system.

# Extracting `day-trading` into its own repo

## Why this profile benefits MOST from its own repo

Of the profiles in `Financial-Planner/`, this is the one where extraction pays off the most. Two reasons:

1. **The dashboard + MCP server + webhook receiver are a self-contained deployable product.** You can run them on a Raspberry Pi 5 at your desk, behind a reverse proxy with TLS, on the trading LAN, restarted by systemd, with the MCP server bound to localhost. That's a real ops surface — and a real ops surface is much easier to harden if it lives in its own repo with its own CI, its own secret scanning, its own release tags, and no sibling code that has nothing to do with intraday trading.
2. **The discipline gate is load-bearing.** Every commit that touches `tilt-guard`, `pre-trade-checklist`, `alert-webhook`, or the MCP `gates.ts` is a commit that, if broken, lets you place orders while on tilt. That deserves its own CI pipeline, its own code-owners file, and a much narrower review surface than a multi-purpose research repo gives you.

The long-term profile lives on a laptop, runs maybe once a quarter, and doesn't talk to a broker. The options profile is mostly research with occasional execution. Only the day-trading profile is a **24/5 production system that places real-money orders**. Treat it like one.

**Suggested repo name:** `intraday-cockpit` or `day-trading-os`.

---

## What to copy

```text
# From profiles/day-trading/ -> repo root
profiles/day-trading/README.md         -> README.md
profiles/day-trading/PLAYBOOK.md       -> PLAYBOOK.md
profiles/day-trading/CLAUDE.md         -> CLAUDE.md
profiles/day-trading/.claude/          -> .claude/
profiles/day-trading/EXTRACT.md        -> EXTRACT-LINEAGE.md   # rename so it doesn't suggest a second extract

# Skills (keep these — they're the persona)
.claude/skills/tilt-guard/             -> .claude/skills/tilt-guard/
.claude/skills/pre-trade-checklist/    -> .claude/skills/pre-trade-checklist/
.claude/skills/session-warmup/         -> .claude/skills/session-warmup/
.claude/skills/daily-routine/          -> .claude/skills/daily-routine/
.claude/skills/decision-card/          -> .claude/skills/decision-card/
.claude/skills/trade-journal/          -> .claude/skills/trade-journal/
.claude/skills/mistake-miner/          -> .claude/skills/mistake-miner/
.claude/skills/alert-webhook/          -> .claude/skills/alert-webhook/
.claude/skills/broker-connect/         -> .claude/skills/broker-connect/
.claude/skills/market-data/            -> .claude/skills/market-data/
.claude/skills/equities-screener/      -> .claude/skills/equities-screener/
.claude/skills/ta-indicators/          -> .claude/skills/ta-indicators/
.claude/skills/chart-render/           -> .claude/skills/chart-render/
.claude/skills/regime-detect/          -> .claude/skills/regime-detect/
.claude/skills/quant-tearsheet/        -> .claude/skills/quant-tearsheet/
.claude/skills/risk-var/               -> .claude/skills/risk-var/
.claude/skills/vol-forecast/           -> .claude/skills/vol-forecast/
.claude/skills/sentiment-scan/         -> .claude/skills/sentiment-scan/

# Design assets the dashboard depends on
design/code/tokens.css                 -> design/code/tokens.css
design/code/tokens.ts                  -> design/code/tokens.ts
design/code/BrokerAdapter.ts           -> design/code/BrokerAdapter.ts
design/code/DataAdapter.ts             -> design/code/DataAdapter.ts
design/code/HeroChart.tsx              -> design/code/HeroChart.tsx
design/code/LeaderCard.tsx             -> design/code/LeaderCard.tsx
design/code/LockSlider.tsx             -> design/code/LockSlider.tsx
design/code/AnimatedNumber.tsx         -> design/code/AnimatedNumber.tsx
design/code/TVEmbed.tsx                -> design/code/TVEmbed.tsx
design/code/adapters/                  -> design/code/adapters/      # all of them; user picks at runtime
design/DASHBOARD-BRIEF.md              -> design/DASHBOARD-BRIEF.md
design/EQUITIES-DASHBOARD.md           -> design/EQUITIES-DASHBOARD.md
design/TRADINGVIEW-INTEGRATION.md      -> design/TRADINGVIEW-INTEGRATION.md
design/PLATFORM-INTEGRATIONS.md        -> design/PLATFORM-INTEGRATIONS.md

# Runnable code
web/                                   -> web/        # full tree
mcp/                                   -> mcp/        # full tree
scripts/                               -> scripts/    # full tree
.github/workflows/ci.yml               -> .github/workflows/ci.yml
```

## What NOT to copy

- `profiles/long-term/`, `profiles/options/`, `profiles/swing/` — different personas, different timeframes. Leave them in the source repo.
- `.claude/skills/retire-fire/`, `.claude/skills/etf-analyzer/`, `.claude/skills/debt-payoff/`, `.claude/skills/portfolio-optimize/` — long-horizon, not intraday.
- `.claude/skills/iv-surface/`, `.claude/skills/options-chain/`, `.claude/skills/options-strategy-builder/`, `.claude/skills/greeks-monitor/` — leave out unless the trader actively trades options intraday. If they do, copy these four together.
- `.claude/skills/statarb-scan/` — weekly-bar cointegration, wrong timeframe.
- `.claude/skills/tax-loss-harvest/` — annual sweep, not intraday concern.
- `.claude/skills/pine-new/`, `.claude/skills/pine-to-python/` — most day traders use pre-built TV indicators, not generation. Drop these to shrink the surface.
- `design/VISUAL-AUDIT.md` — pixel critique of the Nixtio reference, only useful while iterating on the visual system.
- `FAVOURITE-REPOS.md`, `SKILLS.md` — research catalog; nice but not load-bearing for an intraday cockpit.

---

## Extraction commands

### Option A: simple copy (fastest, loses git history)

```bash
# from a clean working tree
SRC=~/code/Financial-Planner
DST=~/code/intraday-cockpit
mkdir -p "$DST" && cd "$DST" && git init

# copy the trees listed above
cp -r "$SRC/profiles/day-trading/." .
mkdir -p .claude/skills design/code/adapters
for skill in tilt-guard pre-trade-checklist session-warmup daily-routine decision-card \
             trade-journal mistake-miner alert-webhook broker-connect market-data \
             equities-screener ta-indicators chart-render regime-detect quant-tearsheet \
             risk-var vol-forecast sentiment-scan; do
  cp -r "$SRC/.claude/skills/$skill" .claude/skills/
done
cp "$SRC/design/code/"{tokens.css,tokens.ts,BrokerAdapter.ts,DataAdapter.ts,HeroChart.tsx,LeaderCard.tsx,LockSlider.tsx,AnimatedNumber.tsx,TVEmbed.tsx} design/code/
cp -r "$SRC/design/code/adapters/." design/code/adapters/
cp "$SRC/design/"{DASHBOARD-BRIEF,EQUITIES-DASHBOARD,TRADINGVIEW-INTEGRATION,PLATFORM-INTEGRATIONS}.md design/
cp -r "$SRC/web" "$SRC/mcp" "$SRC/scripts" .
mkdir -p .github/workflows && cp "$SRC/.github/workflows/ci.yml" .github/workflows/

git add . && git commit -m "initial extract from Financial-Planner@$(cd "$SRC" && git rev-parse --short HEAD)"
```

### Option B: `git filter-repo` (preserves history of the extracted paths)

```bash
git clone https://github.com/<you>/Financial-Planner.git intraday-cockpit
cd intraday-cockpit

git filter-repo \
  --path profiles/day-trading \
  --path .claude/skills/tilt-guard \
  --path .claude/skills/pre-trade-checklist \
  --path .claude/skills/session-warmup \
  --path .claude/skills/daily-routine \
  --path .claude/skills/decision-card \
  --path .claude/skills/trade-journal \
  --path .claude/skills/mistake-miner \
  --path .claude/skills/alert-webhook \
  --path .claude/skills/broker-connect \
  --path .claude/skills/market-data \
  --path .claude/skills/equities-screener \
  --path .claude/skills/ta-indicators \
  --path .claude/skills/chart-render \
  --path .claude/skills/regime-detect \
  --path .claude/skills/quant-tearsheet \
  --path .claude/skills/risk-var \
  --path .claude/skills/vol-forecast \
  --path .claude/skills/sentiment-scan \
  --path design/code/tokens.css \
  --path design/code/tokens.ts \
  --path design/code/BrokerAdapter.ts \
  --path design/code/DataAdapter.ts \
  --path design/code/HeroChart.tsx \
  --path design/code/LeaderCard.tsx \
  --path design/code/LockSlider.tsx \
  --path design/code/AnimatedNumber.tsx \
  --path design/code/TVEmbed.tsx \
  --path design/code/adapters \
  --path design/DASHBOARD-BRIEF.md \
  --path design/EQUITIES-DASHBOARD.md \
  --path design/TRADINGVIEW-INTEGRATION.md \
  --path design/PLATFORM-INTEGRATIONS.md \
  --path web \
  --path mcp \
  --path scripts \
  --path .github/workflows/ci.yml

# move profiles/day-trading/* to root
git mv profiles/day-trading/README.md README.md
git mv profiles/day-trading/PLAYBOOK.md PLAYBOOK.md
git mv profiles/day-trading/CLAUDE.md CLAUDE.md
git mv profiles/day-trading/.claude/settings.json .claude/settings.json
git mv profiles/day-trading/.claude/CLAUDE.md .claude/CLAUDE.md
rmdir profiles/day-trading/.claude profiles/day-trading profiles
git commit -m "flatten profile into repo root"
```

---

## Production hardening checklist for the extracted repo

Run through this **before** flipping `BROKER` to `live` for the first time:

- [ ] **Secret scanning enabled** on the GitHub repo (Settings -> Code security -> Secret scanning + push protection). The `mcp__github__run_secret_scanning` workflow can run on push.
- [ ] **No broker creds in `.env`** — use Vault, Doppler, AWS Secrets Manager, or 1Password CLI. `.env.local` is for development only. Production process reads from the secret store at startup.
- [ ] **Alert webhook behind a reverse proxy with TLS.** Caddy / nginx / Traefik in front of the Next.js process. Pin the shared secret, rate-limit at the proxy layer (`30 r/m` per source IP), enable HSTS, reject non-HTTPS. The `TV_WEBHOOK_SECRET` header is your only authn — treat it like a password and rotate quarterly.
- [ ] **MCP server bound to localhost.** Do NOT bind to `0.0.0.0` unless you intentionally want LAN agents to place orders. `npm start -- --transport http --port 7711` binds to `127.0.0.1` by default — verify with `ss -tlnp | grep 7711`.
- [ ] **Kill switch tested.** Set `TV_WEBHOOK_KILL=1` and POST a sample alert; confirm 503. Set `MCP_KILL=1` and call a tool; confirm `KILL_SWITCH` error. Time yourself: from "I need to stop everything" to "everything is stopped" should be < 30 seconds. Practice monthly.
- [ ] **`data/state.yaml` is on a persistent volume** (not `/tmp`). If the Pi reboots mid-session, the gate must still know your morning checklist state.
- [ ] **Audit logs rotated** — `data/webhook-log/` and `data/mcp-log/` are append-only JSONL. Add a daily logrotate config so the directory doesn't fill the disk.
- [ ] **CI runs on every PR** — typecheck, lint, the `verify-udf` smoke test, and (most importantly) the `tilt-guard` hook tests. If a PR breaks the gate, CI must red-light it.
- [ ] **Backup `data/journal/` off-host** — your trade history and your tilt rules are your most valuable IP. Sync to S3 / B2 / Backblaze nightly.
- [ ] **Broker paper account validated for 1 week** with positive P&L and > 80% plan adherence before flipping to live. Non-negotiable.

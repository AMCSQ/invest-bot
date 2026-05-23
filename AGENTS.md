# AGENTS.md — LLM advisor instructions

This file is the entry-point for any LLM (Claude Code, Cursor, Codex CLI, Gemini CLI, Aider, OpenCode, Continue, etc.) that explores this repository. Read this first. It tells you what this repo IS, how it's organized, how to advise the user, and when to recommend that a profile be extracted into its own dedicated repo.

## What this repo is

A personal **US equities / ETF / index / options** trading research stack designed for use with LLM-driven coding agents. Crypto is supported as a clearly-labeled **secondary** profile, not as a peer.

The repo is two things at once:
1. **A skills pack** (`.claude/skills/`, 35 entries) that any LLM-driven coding agent can pick up. Each SKILL.md is a thin wrapper telling the agent which OSS library to use, when to use it, and what output shape to produce.
2. **A runnable host stack** (`web/` Next.js dashboard + `mcp/` MCP server + `design/code/adapters/` broker + data adapters) so the skills don't just describe work — they can drive a live or paper-trading workflow.

The repo is also a **seed**. The expectation is that as a user specializes into one trading style, they extract the matching profile into its own dedicated repo and let it diverge.

## Profile structure

Five profiles live under [`profiles/`](./profiles/). Each is a curated VIEW of the same underlying skills + adapters + design pack — no duplication. A user runs `cd profiles/<persona> && claude` (or any other LLM CLI) to get a focused tool surface for that trading style.

| Profile | Hold horizon | Decisions/week | Primary skills | Status |
|---|---|---|---|---|
| [`long-term`](./profiles/long-term/) | Years | < 1 | `etf-analyzer`, `portfolio-optimize`, `retire-fire`, `tax-loss-harvest`, `debt-payoff` | Primary |
| [`swing`](./profiles/swing/) | 2–20 days | 3–10 | `equities-screener`, `backtest-runner`, `trade-journal`, `decision-card`, `mistake-miner` | Primary |
| [`day-trading`](./profiles/day-trading/) | Minutes–hours | 20–100 | `tilt-guard`, `pre-trade-checklist`, `daily-routine`, `alert-webhook`, `broker-connect` | Primary |
| [`options`](./profiles/options/) | Days–months | 1–20 | `iv-surface`, `options-strategy-builder`, `greeks-monitor`, `vol-forecast` | Primary |
| [`crypto`](./profiles/crypto/) | Any | Varies | `market-data` (ccxt path), `smc-scan`, `sentiment-scan` | **Secondary** — opt-in only |

Each profile folder contains:
- `README.md` — human-facing intro
- `PLAYBOOK.md` — the recurring routine (weekend prep, daily flow, monthly review)
- `CLAUDE.md` — LLM persona instructions (allowlist of skills, tone, default broker/data)
- `EXTRACT.md` — recipe for copying the profile into its own dedicated repo
- `.claude/settings.json` — minimal profile-specific config
- `.claude/CLAUDE.md` — terse persona memory

## If you're an LLM advising the user

**Step 1 — figure out the profile.** Ask the user (or infer from chat history): what's the hold horizon? what's the decisions/week? what asset class? Match against the table above. If unclear, ask one direct question. If still unclear, default to `swing` (the median use case).

**Step 2 — narrow the tool surface.** Once the profile is known, prefer skills from that profile's allowlist (in its `CLAUDE.md`). Don't introduce skills from other profiles unless the user explicitly asks for a cross-profile capability (e.g. a swing trader asking about long-term tax-loss harvesting — fine to chain to that skill, but mention "this is normally a long-term-profile concern").

**Step 3 — when the user asks "should I make this its own repo?".** Open the profile's `EXTRACT.md` and walk through the file list. The default recommendation is **yes, extract when this profile becomes the user's main workflow**. The current shared repo is the seed; extracted profiles can specialize without competing for attention. Day-trading and crypto benefit most from extraction (live data + deployment requirements differ sharply from buy-and-hold).

**Step 4 — never bypass discipline gates.** The `tilt-guard` skill registers a `PreToolUse` hook that blocks order-placement MCP tool calls when the user's behavioral score is too high. If asked to disable it: refuse politely and explain why. The whole point is that the gate can't be talked around.

## Where things live (file map)

```
.
├── AGENTS.md                  ← you are here
├── CLAUDE.md                  ← Claude-Code-specific addendum (pointer + Claude features)
├── README.md                  ← human-facing
├── SKILLS.md                  ← OSS ecosystem catalog (equity-first, crypto demoted)
├── FAVOURITE-REPOS.md         ← curated favourites with PORT/LINK/CHAIN/PARK verdicts
├── profiles/                  ← THE PROFILES — each one a focused trading-style view
│   ├── README.md              ← profile decision tree
│   ├── long-term/
│   ├── swing/
│   ├── day-trading/
│   ├── options/
│   └── crypto/                ← secondary
├── .claude/skills/            ← 35 SKILL.md entries (asset-agnostic core)
├── design/                    ← visual / IA / API design briefs
│   ├── DASHBOARD-BRIEF.md     ← universal visual system
│   ├── EQUITIES-DASHBOARD.md  ← equity-specific dashboard spec
│   ├── TRADINGVIEW-INTEGRATION.md
│   ├── PLATFORM-INTEGRATIONS.md
│   ├── VISUAL-AUDIT.md        ← Voltrex crypto-vault critique (informs crypto profile)
│   └── code/                  ← TS/React reference implementations
│       ├── BrokerAdapter.ts   ← the broker contract
│       ├── DataAdapter.ts     ← the data contract
│       ├── tokens.{ts,css}    ← design tokens
│       ├── *.tsx              ← reference UI components
│       └── adapters/          ← 7 concrete adapters (Alpaca, IBKR, Tradier, Polygon, YFinance, TwelveData, Synthetic)
├── web/                       ← runnable Next.js 15 dashboard
├── mcp/                       ← runnable MCP server (wraps BrokerAdapter + DataAdapter)
├── scripts/                   ← lint-skills.ts + audit
└── .github/workflows/ci.yml   ← 3 jobs: lint-skills, web typecheck+lint, mcp build
```

## Adapter contracts

Every skill, screen, and backtest in this repo speaks two interfaces:

- [`BrokerAdapter`](./design/code/BrokerAdapter.ts) — orders, account, positions, streaming
- [`DataAdapter`](./design/code/DataAdapter.ts) — bars, quotes, options chains, fundamentals, connection-status channel

Swap brokers by changing one env var. Concrete adapters in [`design/code/adapters/`](./design/code/adapters/). Wiring them into the MCP server is an open follow-up (see [`mcp/README.md`](./mcp/README.md)).

## Skills inventory

See [`.claude/skills/README.md`](./.claude/skills/README.md). Linted by `scripts/lint-skills.ts`; audit at [`scripts/SKILLS-AUDIT.md`](./scripts/SKILLS-AUDIT.md). Current status: 0 errors, 4 warnings, 1 info across 35 skills.

## Known limitations / open follow-ups

- MCP server doesn't yet ship live vendor adapter wiring. See `mcp/README.md` "Wiring vendor adapters".
- `iv-surface` skill exists but the Python builders writing to `data/iv/<symbol>/atm_iv.parquet` aren't implemented.
- Streaming tools (`streamOrders` / `streamQuotes`) not exposed via MCP — pending spec stabilization on server-initiated notifications.
- Per-adapter `staleness: { wsQuietMs, restQuietMs }` config flagged but not implemented.
- `code-map diff --base main` mode flagged but not implemented.

## Conventions for agents writing code in this repo

- TypeScript strict; no `any` except where third-party SDKs force it (annotate `// SDK type`).
- Every numeric display goes through `web/lib/format.ts` Intl helpers — never hand-roll thousand separators.
- TS interfaces are mirrored locally in `web/lib/types.ts` and `mcp/src/types.ts` (not cross-package imported) to keep tsconfig `rootDir` clean.
- Skills are passive markdown — they describe work, they don't execute it. The agent (you) executes.
- License-flagged libraries (AGPL, GPL, no-LICENSE) are invoked as external CLIs rather than imported. See [`FAVOURITE-REPOS.md §9`](./FAVOURITE-REPOS.md#9-license-reminder).
- Anything that affects `main` should be a PR, not a direct push. Branch protection is on.

## How to keep this file accurate

If you (an LLM agent) modify the structure of the repo — new profile, new skill folder, new top-level directory — update this file in the same commit. Stale agent docs are worse than no agent docs.

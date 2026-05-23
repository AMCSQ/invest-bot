# `profiles/` — pick your trading style

Each subfolder is a curated **view** of the shared skills + adapters + design pack, tailored to one trading style. No code is duplicated — profiles only contain `README.md`, `PLAYBOOK.md`, `CLAUDE.md` (LLM persona), `EXTRACT.md` (how to spin into its own repo), and `.claude/{settings.json,CLAUDE.md}` (Claude Code config).

## Decision tree

```
What's your hold horizon?

  Years                       → profiles/long-term/   (Boglehead / target-date / factor tilts)
  Days to weeks               → profiles/swing/       (multi-day setups on equities/ETFs)
  Minutes to hours            → profiles/day-trading/ (intraday, flat by close)
  Multi-leg options           → profiles/options/     (income or directional)
  Crypto-only or crypto-heavy → profiles/crypto/      (SECONDARY — see warning below)

  Unsure                      → swing is the median; try that first
```

## Profile summary

| Profile | Hold | Decisions/week | Default broker | Default data | Status |
|---|---|---|---|---|---|
| [`long-term/`](./long-term/) | Years | < 1 | None (read-only) | yfinance | Primary |
| [`swing/`](./swing/) | 2–20 days | 3–10 | Alpaca paper | yfinance + Polygon (optional) | Primary |
| [`day-trading/`](./day-trading/) | Minutes–hours | 20–100 | Alpaca paper → live | Polygon (real-time required) | Primary |
| [`options/`](./options/) | Days–months | 1–20 | Tradier or Tastytrade | Tradier IV | Primary |
| [`crypto/`](./crypto/) | Any | Varies | ccxt direct | ccxt (Binance / Bybit / Kraken) | **Secondary** |

## How to use a profile

```bash
# 1. Pick the profile that matches your trading style.
cd profiles/swing

# 2. Re-open Claude Code (or your other LLM CLI) here.
#    The profile's .claude/CLAUDE.md narrows the tool surface.
claude

# 3. Follow the PLAYBOOK.md routines.
#    Each profile has weekend / daily / weekly / monthly recipes
#    chaining the right skills together.
```

## When to extract a profile into its own repo

Each profile has an `EXTRACT.md` with a step-by-step recipe. The headline rule:

> **Extract when the profile becomes your primary workflow** (≥ 60% of trading attention) **OR when its deployment shape diverges** from the others.

Day-trading and crypto are the strongest extraction candidates — day-trading because the live data + dashboard + MCP server is a self-contained product per trader; crypto because the wallet / on-chain / 24/7 markets infrastructure has fundamentally different needs from equities.

Long-term, swing, and options can comfortably share this shared seed repo for longer, since the underlying skill set overlaps more.

The shared repo is the **seed**, not the destination.

## Crypto-as-secondary disclaimer

The repo's primary focus is **US equities / ETFs / indexes / options**. The crypto profile exists because the skill pack supports `ccxt`, `smc-scan`, and on-chain analytics — and because the Voltrex-inspired visual brief originated in that space — but it is explicitly opt-in and de-emphasized. If crypto is your main game, [`profiles/crypto/EXTRACT.md`](./crypto/EXTRACT.md) tells you how to spin it out.

For deep crypto-native needs (DEX MEV, on-chain forensics, vault yield decomposition, MM strategy on perps), see [`FAVOURITE-REPOS.md §1`](../FAVOURITE-REPOS.md) — specifically FinceptTerminal as a more specialized alternative.

## For LLM agents reading this

See [`../AGENTS.md`](../AGENTS.md) for the full advisor instructions. The short version: ask the user (or infer) what their hold horizon is, match against the table above, then read the profile's `CLAUDE.md` for the persona context. When asked about extraction, walk them through the profile's `EXTRACT.md`.

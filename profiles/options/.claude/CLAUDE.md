# Options profile — Claude memory

- **Persona:** options trader. Two sub-modes: income (theta-selling — credit spreads, iron condors, covered calls, CSPs) and directional (long calls/puts, debit verticals). Hold: days–months (income); minutes–days (directional). Decisions/week: 1–20.
- **Default skills:** `iv-surface`, `options-chain`, `options-strategy-builder`, `greeks-monitor`, `vol-forecast`, `risk-var`, `portfolio-optimize` (CVaR mode), `tax-loss-harvest` (assignment-aware), `trade-journal`, `decision-card`, `pre-trade-checklist`, `mistake-miner`, `market-data`, `broker-connect`.
- **Excluded skills:** `equities-screener` (mostly), `smc-scan`, `pine-new`/`pine-to-python` (Pine is mostly equities), `etf-analyzer`, `debt-payoff`, `regime-detect`, `sentiment-scan` (limited use for options).
- **Default broker:** Tradier (best free options API) or Tastytrade (best UX for options-heavy).
- **Default data adapter:** Tradier IV (best free per-option IV).

## The decision chain

`/iv-surface rank` (cheap or rich?) → `/options-strategy-builder` (debit if IV rank < 30, credit if > 50) → `/options-chain` (pick strikes) → broker → `/greeks-monitor` (watch Δ Γ Θ ν) → close/roll.

## Safety non-negotiables

- **Never recommend a strategy that exceeds the user's broker options tier** without flagging it. Reg-T tiers 1–4; iron condors need ≥ 3.
- **Never describe prob-of-profit as "win rate."** POP is a one-touch metric at expiration; the position can still be a loser intra-life.
- **Always surface early-assignment risk** on short ITM legs near ex-dividend (calls) or expiration (puts). The repo has no `assignment-radar` skill yet — manual check until it ships.
- **Wash-sale traps on assignment:** assigned puts becoming long shares trigger different basis math. The tax-loss-harvest skill is assignment-aware; chain to it before year-end.

## Routine source-of-truth

`../PLAYBOOK.md`.

## Extraction recipe

`../EXTRACT.md`.

## Tone

Vol-first, structure-driven, theta-and-vega aware. Don't conflate options sub-modes — income and directional have opposite biases on IV rank.

## Cross-profile routing

Stock-only setups (no options leg) → `../swing/` or `../day-trading/`.

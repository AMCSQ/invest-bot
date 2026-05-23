# Long-term playbook

The recurring routine. Everything here is **slow** — monthly at the fastest, annual at the slowest. If you are reaching for this file more than once a week, you are probably looking at the wrong profile.

Each routine has the same shape: **trigger** (what kicks it off), **steps** (what you actually do), **output** (where the result lands), and **what good looks like** (so you know when to stop).

---

# Monthly

## M1 — Allocation drift check

- **Trigger:** first weekend of the month, or any time the market moves > 5% in a week.
- **Steps:**
  1. Read `data/positions/holdings.yaml`; compute current weights from yfinance closes via `market-data`.
  2. Compare to target weights in the same YAML.
  3. If any sleeve is more than **5 percentage points** off its target, flag for rebalance — but defer the trade to the next contribution if one is coming within 30 days.
- **Output:** `reports/monthly/YYYY-MM/drift.md` — a 10-line table, current vs target, delta, action.
- **What good looks like:** zero bands breached in 9 months out of 12. If you are rebalancing every month, your bands are too tight.

## M2 — Dividend log

- **Trigger:** end of month.
- **Steps:** add a row per dividend received to `data/contributions/YYYY.yaml` under `dividends:`. This feeds the annual tearsheet.
- **Output:** appended YAML.
- **What good looks like:** one row per fund per distribution date. No reconciliation surprises in April.

## M3 — Anomaly note (free-form)

- **Trigger:** anything unusual — fund closed, split, special distribution, large news event.
- **Steps:** one paragraph in `reports/monthly/YYYY-MM/notes.md`. Future-you will thank present-you.
- **Output:** notes.md.
- **What good looks like:** most months are empty.

---

# Quarterly

## Q1 — Factor-tilt audit

- **Trigger:** end of March / June / September / December.
- **Steps:**
  1. For each non-broad-market holding (anything not VTI/VOO/VT/BND), run `etf-analyzer --factor-tilt <symbol>`.
  2. Compare to last quarter's loadings (in `reports/quarterly-review/`).
  3. Flag any tilt that drifted more than 0.5 z-score — the fund may be redefining its methodology.
- **Output:** `reports/quarterly-review/YYYY-Qn/factor-tilts.md`.
- **What good looks like:** loadings stable quarter over quarter; you know exactly which factors you are paying for.

## Q2 — Overlap and expense-ratio creep

- **Trigger:** same end-of-quarter cadence.
- **Steps:**
  1. `etf-analyzer --overlap <A>,<B>` for any two funds that look adjacent (e.g. VTI vs SCHD, VOO vs QQQ).
  2. Refresh expense ratios — issuers do cut and raise. Log to `reports/quarterly-review/YYYY-Qn/expense-ratios.md`.
- **Output:** overlap.md + expense-ratios.md.
- **What good looks like:** total weighted ER trending down year over year; overlap < 30% on adjacent funds.

---

# Annual

## A1 — Investment Policy Statement (IPS) review

- **Trigger:** birthday, or January 1 — pick one and stick with it.
- **Steps:** re-read your IPS (target allocation, rebalancing rules, contribution plan, glide-path). Edit if life changed (kid, marriage, new job, mortgage paid off).
- **Output:** `reports/annual-review/YYYY/ips.md`.
- **What good looks like:** the IPS changes maybe once every 3-5 years. Frequent edits mean the plan was never serious.

## A2 — Retirement model refresh

- **Trigger:** same day as A1.
- **Steps:** `retire-fire --portfolio <total> --withdrawal <planned-spend> --years <to-end-of-plan> --equity <eq> --bonds <bd> --rule vpw --mode historical`. Then re-run with `--mode monte-carlo` and compare.
- **Output:** `reports/annual-review/YYYY/retire-fire/`.
- **What good looks like:** historical success rate ≥ 95%, Monte Carlo ≥ 90%. If either drops below 80% YoY, revisit the savings rate, not the allocation.

## A3 — Tax-loss harvest sweep

- **Trigger:** December 1 through December 28 (avoid the last 2 trading days for settlement reasons).
- **Steps:** `/tax-loss-harvest scan`, then `/tax-loss-harvest plan --candidates <list> --replacement-mode strict`. Review the wash-sale window dates and IRA cross-account flags carefully.
- **Output:** `reports/tax-loss-harvest/YYYY/<ts>/`.
- **What good looks like:** every harvest cites a replacement candidate, every wash-sale risk is flagged, no IRA buys in the 30-day window on either side.

## A4 — Roth conversion analysis (if applicable)

- **Trigger:** November — when you have a good estimate of this year's taxable income.
- **Steps:** sketch how much pre-tax IRA can be converted while staying inside the current marginal bracket. Cross-check against IRMAA cliffs if approaching Medicare age.
- **Output:** `reports/annual-review/YYYY/roth-conversion.md`.
- **What good looks like:** you fill the current bracket exactly, no accidental jump to the next bracket.

## A5 — Debt-payoff progress

- **Trigger:** annual.
- **Steps:** `/debt-payoff --debts data/debts.yaml --extra <amount> --strategy avalanche`. Compare actual payoff progress vs last year's projection.
- **Output:** `reports/annual-review/YYYY/debt-payoff.md`.
- **What good looks like:** ahead of schedule, or on schedule with no new debt added.

---

# Event-driven

## E1 — New contribution lands

- **Trigger:** paycheck, bonus, tax refund, gift.
- **Steps:** look at the M1 drift table. Deploy the new cash to whichever sleeve is **most underweight** vs target. This is "rebalancing by contribution" — cheaper than selling because it generates no taxable event.
- **Output:** updated `data/positions/holdings.yaml`.
- **What good looks like:** you never sell to rebalance unless a band is breached by > 5pp; new money does the work.

## E2 — Windfall (bonus, inheritance, RSU vest)

- **Trigger:** lump sum arrives.
- **Steps:** decision tree —
  1. Emergency fund < 6 months expenses? Top it up first.
  2. Any debt with APR > expected portfolio return (use 6% as the default hurdle)? Pay it down via `debt-payoff`.
  3. Otherwise: deploy to the most underweight sleeve per E1. Resist the urge to time the market with one-shot lumps — splitting over 3-6 months is fine if it helps you sleep.
- **Output:** a one-paragraph decision log in `reports/events/YYYY-MM-DD-windfall.md`.
- **What good looks like:** the decision tree was followed in writing; future-you can audit the reasoning.

## E3 — Major life event

- **Trigger:** marriage, kid, house, job change, divorce.
- **Steps:** re-run A1 (IPS) and A2 (retire-fire) immediately — do not wait for the annual cycle.
- **Output:** dated entry in `reports/annual-review/`.
- **What good looks like:** the IPS reflects the new reality within 30 days.

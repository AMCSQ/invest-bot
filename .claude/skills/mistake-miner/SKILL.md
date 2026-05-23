---
name: mistake-miner
description: Cluster the user's journal history to surface the top 5 recurring failure modes (oversized, held too long, news fade, FOMO, revenge trade, ...) and quantify the dollar cost of each leak. Runs monthly. Invoke when the user says "what are my recurring mistakes", "monthly review", "find my leaks", or it's the first of the month.
---

# When to use

After ≥ 30 closed trades or once per month. For single-trade post-mortems, write directly into the trade's `lessons` field in `trade-journal`.

# Upstream references

- [`dastergon/postmortem-templates`](https://github.com/dastergon/postmortem-templates) — format for the report.
- Local data sources: `data/journal/**/*.md`, `data/decisions/**/*.md`, `data/journal/overrides/*.md`.
- [`wdm0006/keeks`](https://github.com/wdm0006/keeks) — Kelly math for quantifying the cost.

# Recipe

```
/mistake-miner run --since 2026-04-01 --top 5
```

1. Load all closed trades + their decision cards + override logs since `--since`.
2. Build features per trade: `r_realized`, `size_z`, `hold_z`, `pnl`, `bias_at_risk`, `exit_reason`, `falsifier_fired`, `setup`, `tilt_at_entry`.
3. **Cluster losing trades**: use `sentence-transformers` to embed `thesis + lessons + exit_reason`, then HDBSCAN.
4. Label clusters via LLM call (uses the active Claude session — no extra API) given the trades in each cluster.
5. Compute per-cluster:
   - Frequency
   - Avg R lost
   - **Dollar cost** = `Σ pnl_negative` for cluster
6. Rank by dollar cost descending, take top `--top`.

# Output

`reports/reviews/<YYYY-MM>.md`:
```markdown
# Monthly Mistake Review — May 2026

## Top 5 leaks (by $ cost)

### 1. Oversized after a winner ($1,920 cost, 6 trades)
- Avg R: -0.7
- Setups: earnings_gap (4), breakout (2)
- Common bias-at-risk: overconfidence
- Drill: cap position size to 1.0× baseline for 3 trades after any winner > 2R

### 2. Holding through scheduled news ($1,140 cost, 4 trades)
...
```

# Output convention

```
reports/reviews/<YYYY-MM>.md
reports/reviews/<YYYY-MM>_clusters.json
```

# Install on first use

```bash
uvx --with sentence-transformers --with hdbscan --with pandas python -c "import sentence_transformers"
```

# Don't

- Don't run with < 20 closed trades — clusters will be noise.
- Don't anonymize or aggregate away the specific trade IDs — the user needs to revisit them.
- Don't propose a "drill" without the user's confirmation — flag as suggested and require thumbs-up before recording.

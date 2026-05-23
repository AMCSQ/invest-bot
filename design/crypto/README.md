# Crypto profile — design container (SECONDARY)

> **This is a side-pocket UI.** The repo's primary focus is US equities / ETFs / indexes / options. Crypto is included here because the ccxt data path already exists in the skill pack and because the Voltrex visual brief in [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md) was crypto-vault-flavored to begin with — so the design language was already half-built. If crypto becomes more than 20% of your trading activity, **stop here** and follow [`../../profiles/crypto/EXTRACT.md`](../../profiles/crypto/EXTRACT.md) — build a crypto-native UI in a dedicated repo, with [FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) ([`../../FAVOURITE-REPOS.md` §1](../../FAVOURITE-REPOS.md)) as the deeper-crypto-power-user reference.

## Files

| File | Purpose |
|---|---|
| [`UI-SPEC.md`](./UI-SPEC.md) | The full UI spec — ~200 lines, deliberately shorter than the equity profiles to reinforce secondary status |
| [`code/`](./code/) | Profile-specific component implementations (empty placeholder for now — shared components live in [`../code/`](../code/)) |

## Cross-references

- [`../DASHBOARD-BRIEF.md`](../DASHBOARD-BRIEF.md) — the Voltrex-flavored design language this profile inherits (color tokens, motion, charting)
- [`../VISUAL-AUDIT.md`](../VISUAL-AUDIT.md) — pixel-level critique of the Voltrex Dribbble shot; directly relevant to the `VaultDepositorCard` component
- [`../../profiles/crypto/README.md`](../../profiles/crypto/README.md) — profile scope, default skills, exclusions
- [`../../profiles/crypto/PLAYBOOK.md`](../../profiles/crypto/PLAYBOOK.md) — the routines this UI surfaces (W1 rebalance, W2 funding log, M1 tearsheet)
- [`../../profiles/crypto/CLAUDE.md`](../../profiles/crypto/CLAUDE.md) — LLM persona + routing rules for deep crypto-native questions
- [`../../profiles/crypto/EXTRACT.md`](../../profiles/crypto/EXTRACT.md) — when and how to extract this profile into its own repo

## Sibling design containers

- [`../day-trading/`](../day-trading/) — intraday US-equity surface (PDT-aware, tilt-guarded)
- [`../swing/`](../swing/) — multi-day US-equity swing surface
- [`../options/`](../options/) — defined-risk US options spreads surface

Each sibling owns its own UI; they do not bleed into each other. The crypto profile borrows the violet bloom + Voltrex deposit panel + WalletChip from the shared design system, and that is the extent of the cross-pollination.

## Why this container is deliberately short

The length of the files here is a signal. If you find yourself wanting to add more design surface to this profile — a perp orderbook, a MEV-aware swap router, an NFT viewer, cross-chain aggregation — **that is the extraction trigger**. The parent repo will keep optimizing for equities; adding crypto-specific machinery here will rot every equity feature it touches.

For deep crypto-native power-user UX, [FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) is the reference to study, not this directory.

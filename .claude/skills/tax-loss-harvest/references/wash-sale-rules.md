# Wash-Sale Rules — Condensed with Citations

> **NOT TAX ADVICE.** Citations are to primary IRS sources; interpretations are practitioner consensus, not authority.

## The statute — IRC §1091

A loss on the sale of stock or securities is **disallowed** if, within a period beginning **30 days before the sale** and ending **30 days after the sale** (a 61-day window centered on the sale date), the taxpayer:

1. Acquires substantially identical stock or securities, **OR**
2. Enters into a **contract or option** to acquire substantially identical stock or securities.

The disallowed loss is **added to the basis** of the replacement security (§1091(d)) and the replacement security's holding period **includes the holding period of the sold security** (§1223(3)).

## Primary sources

- **IRC §1091** — the statute. <https://www.law.cornell.edu/uscode/text/26/1091>
- **IRC §1211(b)** — $3,000 net-capital-loss cap against ordinary income ($1,500 if MFS).
- **IRC §1212(b)** — indefinite carryforward of excess net capital losses.
- **IRC §1223(3)** — holding period tacking for wash-sale replacements.
- **IRS Pub. 550** — Investment Income and Expenses (most-current taxpayer-facing guidance on what counts as substantially identical).
- **IRS Pub. 564** — Mutual Fund Distributions.
- **Rev. Rul. 2008-5** — wash-sale rule applies when the replacement is bought in an IRA owned by the taxpayer; the disallowed loss does NOT increase the IRA basis (the loss permanently vanishes).
- **Rev. Rul. 56-406** — loss on sale of stock disallowed where replacement bought by a controlled corporation.

## Cross-account scope

The §1091 statutory text does not limit "acquired by the taxpayer" to a single account. Therefore:

- ✅ Same taxable account → in scope.
- ✅ Different taxable account at the same or different broker → in scope.
- ✅ Spouse's account (joint or separate filing) → in scope per IRS guidance and Pub. 550.
- ✅ **Traditional IRA or Roth IRA owned by the taxpayer → in scope per Rev. Rul. 2008-5.** Additionally, the disallowed loss does NOT add to the IRA's basis — it is permanently lost (worst-case outcome).
- ⚠ 401(k) → unsettled. Conservative treatment is to include it; some practitioners argue ERISA accounts are not "owned" in the §1091 sense. Flag and let the user/CPA decide.
- ✅ A controlled corporation, partnership, or trust where the taxpayer is a > 50% owner → in scope (Rev. Rul. 56-406 and progeny).

The 1099-B from the broker will **only** report wash sales within that single broker account. Cross-account wash sales are the **taxpayer's** responsibility to track and report. This skill's `wash-sale-ledger.csv` exists precisely to fill that gap.

## Options coverage

Per §1091(a), entering into a **contract or option** to acquire substantially identical stock triggers the wash sale just as a stock purchase would. Practical implications:

- Selling AAPL stock at a loss, then buying an AAPL call (any strike, any expiry) within the 61-day window → wash sale, loss disallowed.
- Selling AAPL stock at a loss, then **writing a deep-ITM AAPL put** (which is economically equivalent to going long the stock) → wash sale per IRS guidance and tax-court precedent.
- Selling an AAPL call option at a loss, then buying another AAPL call with the **same strike and same expiration** → wash sale (identical contracts).
- Selling an AAPL call option at a loss, then buying an AAPL call with a **different strike or different expiration** → MAYBE; IRS has not ruled definitively. Practitioner default is "different strike OR different expiration = not substantially identical" but this is conservative-leaning consensus, not a safe harbor.

## Mutual fund ↔ ETF share-class conversion

A mutual-fund-to-ETF share-class conversion of the **same fund** (e.g. Vanguard's structural conversions) is **not a sale** and does not trigger §1091 — it's a non-taxable exchange under the fund's prospectus. But **different funds** tracking the same index from the same issuer (e.g. VTSAX → VTI sold and rebought separately) WOULD be substantially identical.

## Year-end edge case

A loss sale on December 28 with a replacement buy on January 10 of the next year **still triggers the wash sale** — the 61-day window does not care about tax-year boundaries. The disallowed loss in Year 1 attaches to the replacement basis bought in Year 2. This regularly trips taxpayers.

## "Substantially identical" — the unanswered question

The IRS has never published a comprehensive list. Pub. 550 says only:

> "Ordinarily, stocks or securities of one corporation are not considered substantially identical to stocks or securities of another corporation."

It then gives narrow examples (preferred-to-common when convertible, reorganization successors). It is **silent on ETFs**. The matrix in [`substantially-identical-matrix.md`](./substantially-identical-matrix.md) is practitioner consensus + this skill's strict/loose modes, NOT IRS guidance.

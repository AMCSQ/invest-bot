# Substantially-Identical ETF Matrix

> **NOT TAX ADVICE — IRS HAS NOT RULED ON ETFs.** This matrix is practitioner consensus. Every row carries a verdict label (**YES** / **MAYBE** / **NO**) and a basis. Strict mode treats MAYBE as YES; loose mode treats MAYBE as NO with a warning. The user owns the call.

Format: `replace_from → replace_to` with the strict-mode default. "Same index" means the ETFs literally track the same published index (e.g. S&P 500); "adjacent index" means a different published index targeting the same exposure (e.g. CRSP Total Market vs. S&P Total Market).

## S&P 500 family

| From | To | Index relationship | Strict | Loose |
|---|---|---|---|---|
| SPY | IVV | Same index (S&P 500) | **YES (identical)** | YES |
| SPY | VOO | Same index (S&P 500) | **YES** | YES |
| SPY | SPLG | Same index (S&P 500) | **YES** | YES |
| SPY | RSP | Different index (S&P 500 **Equal Weight**) | MAYBE | **NO — allow** |
| SPY | IVOO | Different index (S&P **Mid Cap** 400) | NO | NO |
| SPY | SCHX | Adjacent (Dow Jones US Large-Cap) | MAYBE | NO — allow |
| SPY | VV | Adjacent (CRSP US Large Cap) | MAYBE | NO — allow |
| SPY | ITOT | Adjacent (S&P Total Market — superset) | MAYBE | NO — allow with warning |

Practitioner consensus: SPY ↔ IVV ↔ VOO ↔ SPLG are all the same index from different issuers — treat as identical even though IRS has not ruled.

## Total US Market family

| From | To | Index relationship | Strict | Loose |
|---|---|---|---|---|
| VTI | ITOT | Different index (CRSP vs S&P), ~99% overlap | MAYBE | NO — allow |
| VTI | SCHB | Different index (Dow Jones US Broad), ~99% overlap | MAYBE | NO — allow |
| VTI | SPTM | Different index (S&P Composite 1500-ish), ~98% overlap | MAYBE | NO — allow |
| VTI | VOO | Different index (subset — large cap only) | MAYBE | NO — allow |
| VTI | VTSAX | Same fund, different share class (mutual fund) | **YES (identical)** | YES |

The "Vanguard ETF ↔ Vanguard mutual fund (same fund)" pair is the cleanest YES on the page — same portfolio, same manager, same daily NAV.

## Nasdaq-100 family

| From | To | Index relationship | Strict | Loose |
|---|---|---|---|---|
| QQQ | QQQM | Same index (Nasdaq-100), same issuer | **YES (identical)** | YES |
| QQQ | QQEW | Different index (Nasdaq-100 Equal Weighted) | MAYBE | NO — allow |
| QQQ | ONEQ | Adjacent (Nasdaq Composite — superset) | MAYBE | NO — allow |
| QQQ | VGT | Different index (MSCI US IMI Info Tech) | MAYBE | NO — allow |
| QQQ | XLK | Different index (S&P Tech sector) | MAYBE | NO — allow |

QQQ ↔ QQQM is the classic "free harvest" pair — same issuer, same index, different expense ratio. Treat as identical conservatively.

## Russell 2000 / small-cap

| From | To | Index relationship | Strict | Loose |
|---|---|---|---|---|
| IWM | VTWO | Same index (Russell 2000) | **YES (identical)** | YES |
| IWM | SCHA | Different index (Dow Jones US Small-Cap) | MAYBE | NO — allow |
| IWM | IJR | Different index (S&P SmallCap 600) | MAYBE | NO — allow |
| IWM | VB | Different index (CRSP US Small Cap) | MAYBE | NO — allow |

## Sector ETFs (US large-cap by sector)

For each sector, the three "majors" are State Street Select Sector SPDR (XL\*), Vanguard sector (VG\*), and iShares (IY\*). They track **different indices** but cover the same GICS sector.

| Sector | SPDR | Vanguard | iShares | Strict verdict (any pair) |
|---|---|---|---|---|
| Tech | XLK | VGT | IYW | MAYBE — strict treats as identical |
| Financials | XLF | VFH | IYF | MAYBE — strict treats as identical |
| Health Care | XLV | VHT | IYH | MAYBE — strict treats as identical |
| Energy | XLE | VDE | IYE | MAYBE — strict treats as identical |
| Industrials | XLI | VIS | IYJ | MAYBE — strict treats as identical |
| Consumer Discretionary | XLY | VCR | IYC | MAYBE — strict treats as identical |
| Consumer Staples | XLP | VDC | IYK | MAYBE — strict treats as identical |
| Utilities | XLU | VPU | IDU | MAYBE — strict treats as identical |
| Materials | XLB | VAW | IYM | MAYBE — strict treats as identical |
| Real Estate | XLRE | VNQ | IYR | MAYBE — strict treats as identical |
| Communication Services | XLC | VOX | IYZ | MAYBE — strict treats as identical |

Loose mode allows cross-issuer sector swaps with a warning row. The case for "not identical" is stronger here than in the S&P 500 row (different index methodologies, holdings can diverge 5-15%), but it is **not** an IRS-blessed safe harbor.

## Treasury duration ETFs

| From | To | Duration | Index | Strict | Loose |
|---|---|---|---|---|---|
| TLT | EDV | 20+ yr vs 25+ yr STRIPS | Different | MAYBE | NO — allow |
| TLT | VGLT | 20+ yr | Different (Bloomberg vs ICE) | MAYBE | NO — allow |
| TLT | GOVT | 20+ yr vs broad treasuries (1-30) | Different | NO | NO |
| TLT | IEF | 20+ yr vs 7-10 yr | Different duration | NO | NO |
| IEF | VGIT | 7-10 yr vs 3-10 yr | Different | MAYBE | NO — allow |
| SHY | VGSH | 1-3 yr | Different | MAYBE | NO — allow |
| BIL | SGOV | 1-3 mo T-bills | Different | MAYBE | NO — allow |

Different duration = different risk = stronger "not identical" case. Same-duration cross-issuer = practitioner gray zone.

## Investment-grade bond aggregates

| From | To | Index | Strict | Loose |
|---|---|---|---|---|
| AGG | BND | Bloomberg US Agg vs Bloomberg US Float Adj Agg | MAYBE | NO — allow |
| AGG | SCHZ | Bloomberg US Agg | **YES (identical)** | YES |
| BND | SCHZ | Different (Float Adj vs straight Agg) | MAYBE | NO — allow |

## International developed-market

| From | To | Index | Strict | Loose |
|---|---|---|---|---|
| VEA | IEFA | FTSE Developed All Cap ex US vs MSCI EAFE IMI | MAYBE | NO — allow |
| VXUS | IXUS | Different (FTSE Global All Cap ex US vs MSCI ACWI ex US IMI) | MAYBE | NO — allow |
| EFA | IEFA | Same issuer, different index (MSCI EAFE vs MSCI EAFE IMI — IMI is superset) | MAYBE | NO — allow |

## Emerging markets

| From | To | Index | Strict | Loose |
|---|---|---|---|---|
| VWO | IEMG | FTSE EM All Cap China A Inclusion vs MSCI EM IMI | MAYBE | NO — allow |
| EEM | IEMG | Same issuer, different index (MSCI EM vs MSCI EM IMI) | MAYBE | NO — allow |
| VWO | SCHE | Different (FTSE vs FTSE All-World ex US) | MAYBE | NO — allow |

## How to use this matrix programmatically

The skill loads this as a CSV-equivalent lookup. The decision tree:

1. **Same CUSIP** → YES, hard-block.
2. **Lookup in matrix** → use the strict/loose verdict per the user's `replacement-mode`.
3. **Not in matrix** → fall through to [`etf-analyzer`](../../etf-analyzer/SKILL.md) overlap mode. If overlap > 95% AND same broad asset class → MAYBE, default strict = block. If 70-95% → MAYBE, default loose = allow with warning. If < 70% → NO.
4. **Always emit** the verdict label + the basis + a "IRS unclear — judgment call" footer where applicable.

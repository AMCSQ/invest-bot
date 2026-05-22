import { KpiTile, type KpiTileProps } from "./KpiTile";

// Equities KPI strip — 5 tiles: Account Equity, Day P&L, YTD Realized,
// Open Positions, Buying Power. See EQUITIES-DASHBOARD.md §1.
//
// Mobile reflow: snap-scrolling horizontal strip. Checklist item 10.

export interface KpiStripProps {
  tiles: KpiTileProps[];
}

export function KpiStrip({ tiles }: KpiStripProps) {
  return (
    <ul
      aria-label="Account key metrics"
      className="grid grid-cols-2 md:grid-cols-5 gap-4 max-md:overflow-x-auto max-md:snap-x"
    >
      {tiles.map((tile) => (
        <KpiTile key={tile.label} {...tile} />
      ))}
    </ul>
  );
}

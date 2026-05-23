import { fmtCurrency, fmtNumber, fmtPercent } from "@/lib/format";

// Single KPI tile. Eyebrow label + value + optional delta chip + optional hint.
// Reserve a min-block-size so live updates don't cause CLS — checklist item 19.

export type KpiFormat = "currency" | "number" | "count";

export interface KpiTileProps {
  label: string;
  value: number;
  delta?: number;
  deltaPct?: number;
  hint?: string;
  format?: KpiFormat;
}

function formatValue(value: number, format: KpiFormat): string {
  switch (format) {
    case "currency":
      return fmtCurrency(value);
    case "count":
      return fmtNumber(value, { digits: 0 });
    default:
      return fmtNumber(value);
  }
}

export function KpiTile({ label, value, delta, deltaPct, hint, format = "number" }: KpiTileProps) {
  const sign = (delta ?? deltaPct ?? 0) >= 0 ? "up" : "down";
  const deltaColor = sign === "up" ? "text-success" : "text-danger";
  const deltaGlyph = sign === "up" ? "▲" : "▼";

  return (
    <li className="relative rounded-2xl bg-surface border border-subtle p-4 min-h-[110px] flex flex-col gap-2">
      <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-content-tertiary">
        {label}
      </span>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="num text-2xl font-semibold tracking-tight">
          {formatValue(value, format)}
        </span>
        {(delta !== undefined || deltaPct !== undefined) && (
          <span
            className={`num text-xs font-medium ${deltaColor}`}
            aria-label={sign === "up" ? "up" : "down"}
          >
            <span aria-hidden="true">{deltaGlyph}</span>{" "}
            {delta !== undefined && format === "currency" ? fmtCurrency(Math.abs(delta)) : null}
            {deltaPct !== undefined ? ` ${fmtPercent(Math.abs(deltaPct))}` : null}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-content-tertiary">{hint}</span>}
    </li>
  );
}

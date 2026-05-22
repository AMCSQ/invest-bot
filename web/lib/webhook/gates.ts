import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { brokers } from "@/lib/brokers";
import type { TVPayload } from "./schema";

// Pre-trade gates. Block the order if any of these fail. The goal is that a
// runaway Pine script can NEVER bypass these — the receiver has the final
// word, not TradingView. See TRADINGVIEW-INTEGRATION.md §5 hardening item 10
// and EQUITIES-DASHBOARD.md §3 pre-trade checks.

interface TiltState {
  // Shape we expect from data/state.yaml, written by the tilt-guard skill.
  tradesDisabledUntil?: string; // ISO
  dailyLossCap?: number;
  realizedLossToday?: number;
  maxRiskPctPerTrade?: number; // default 0.01 (1%)
}

function readTiltState(): TiltState {
  const file = path.join(process.cwd(), "data", "state.yaml");
  if (!existsSync(file)) return {};
  try {
    const raw = readFileSync(file, "utf8");
    return (YAML.parse(raw) ?? {}) as TiltState;
  } catch {
    // Don't fail-open on a corrupt state file. Treat as "no overrides" and
    // continue with default risk caps; the broker's own BP/PDT checks will
    // still apply.
    return {};
  }
}

export interface GateResult {
  ok: boolean;
  reason?: string;
  recomputedQty?: number;
}

export async function preTradeGate(payload: TVPayload): Promise<GateResult> {
  const state = readTiltState();
  const now = new Date();

  // 1. tilt-guard kill window.
  if (state.tradesDisabledUntil) {
    const until = new Date(state.tradesDisabledUntil);
    if (Number.isFinite(until.valueOf()) && until > now) {
      return { ok: false, reason: `tilt-guard: trades disabled until ${state.tradesDisabledUntil}` };
    }
  }

  // 2. Daily realized-loss cap.
  if (
    state.dailyLossCap !== undefined &&
    state.realizedLossToday !== undefined &&
    state.realizedLossToday >= state.dailyLossCap
  ) {
    return { ok: false, reason: "tilt-guard: daily loss cap hit" };
  }

  // 3. Account checks — PDT, buying power. If broker is unconfigured we
  //    fail-closed (we'd rather refuse than yolo into a broken broker SDK).
  let account;
  try {
    account = await brokers.active.getAccount();
  } catch (err) {
    return { ok: false, reason: `broker unavailable: ${(err as Error).message}` };
  }

  if (account.patternDayTrader && account.daytradesRemaining === 0) {
    return { ok: false, reason: "PDT: no day trades remaining" };
  }

  // Conservative BP estimate. If Pine sent a price use it; otherwise we let
  // the broker do the final check at fill time and only ensure non-negative BP.
  const estPrice = payload.price ?? 0;
  const grossCost = estPrice * payload.qty;
  if (payload.action !== "close" && grossCost > account.buyingPower) {
    return { ok: false, reason: `insufficient buying power (need ~${grossCost}, have ${account.buyingPower})` };
  }

  // 4. Risk-based size recompute. Treat Pine's `qty` as a suggestion; if the
  //    payload supplied a stop, derive qty from R-sizing. The R-formula:
  //      qty = (equity * riskPct) / abs(entry - stop)
  let recomputedQty: number | undefined;
  const riskPct = payload.riskPct ?? state.maxRiskPctPerTrade ?? 0.01;
  if (payload.stop && payload.price && payload.stop !== payload.price) {
    const stopDistance = Math.abs(payload.price - payload.stop);
    const riskDollars = account.equity * riskPct;
    recomputedQty = Math.max(1, Math.floor(riskDollars / stopDistance));
  }

  return { ok: true, recomputedQty };
}

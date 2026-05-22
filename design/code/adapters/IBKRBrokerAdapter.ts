// IBKRBrokerAdapter — Interactive Brokers via TWS / IB Gateway.
// SDK: `@stoqey/ib` (MIT). Install:  npm i @stoqey/ib
// Requires TWS or IB Gateway running locally (default ports 7497 paper / 7496 live).
// Docs: https://github.com/stoqey/ib

import {
  BrokerAdapter, OrderRequest, OrderResult, Position, Account, OrderEvent, Side,
} from "../BrokerAdapter";
import { BrokerError, num } from "./errors";
import { SerialQueue } from "./queue";

// SDK type — typed loosely because the @stoqey/ib type surface is large and
// version-sensitive; we just shape the bits we use.
type IBClient = any;

export interface IBKRConfig {
  host?: string;       // default 127.0.0.1
  port?: number;       // 7497 paper / 7496 live / 4002 gateway paper / 4001 live
  clientId?: number;   // unique per concurrent connection
  mode: "paper" | "live";
  accountId?: string;  // required if multiple accounts under the same login
}

interface PendingOrder {
  result: OrderResult;
  resolveStatus?: (status: OrderResult["status"]) => void;
}

export class IBKRBrokerAdapter implements BrokerAdapter {
  readonly name = "ibkr";
  readonly mode: "paper" | "live";
  private ib: IBClient;
  private nextOrderId = 0;
  private connected = false;
  private accountId?: string;
  private queue = new SerialQueue({ minSpacingMs: 20 });
  private pending = new Map<number, PendingOrder>();
  private eventHandlers = new Set<(e: OrderEvent) => void>();

  constructor(cfg: IBKRConfig) {
    this.mode = cfg.mode;
    this.accountId = cfg.accountId;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IBApi, EventName } = require("@stoqey/ib");
    this.ib = new IBApi({
      host: cfg.host ?? "127.0.0.1",
      port: cfg.port ?? (cfg.mode === "paper" ? 7497 : 7496),
      clientId: cfg.clientId ?? 1,
    });
    this.wireEvents(EventName);
  }

  // Lazily ensure a connection — TWS won't queue requests pre-connect.
  private async ensureConnected(): Promise<void> {
    if (this.connected) return;
    await new Promise<void>((resolve, reject) => {
      const { EventName } = require("@stoqey/ib");
      const onReady = (id: number) => {
        this.nextOrderId = id;
        this.connected = true;
        this.ib.removeListener(EventName.nextValidId, onReady);
        resolve();
      };
      const onErr = (err: Error) => { reject(new BrokerError(this.name, "connect", err.message, err)); };
      this.ib.once(EventName.nextValidId, onReady);
      this.ib.once(EventName.error, onErr);
      try { this.ib.connect(); } catch (err: any) { reject(new BrokerError(this.name, "connect", err.message, err)); }
    });
  }

  private wireEvents(EventName: any): void {
    this.ib.on(EventName.orderStatus, (id: number, status: string, filled: number, _remaining: number, avgFillPrice: number) => {
      const p = this.pending.get(id);
      if (!p) return;
      p.result.status = this.mapStatus(status);
      p.result.filledQty = num(filled);
      if (avgFillPrice) p.result.avgFillPrice = num(avgFillPrice);
      const evt: OrderEvent = {
        type: status === "Filled" ? "fill" : status === "Cancelled" ? "cancel" : "new",
        order: { ...p.result },
        at: new Date().toISOString(),
      };
      this.emit(evt);
    });
    this.ib.on(EventName.execDetails, (_reqId: number, _contract: any, exec: any) => {
      const id = num(exec.orderId);
      const p = this.pending.get(id);
      if (!p) return;
      p.result.filledQty = num(exec.cumQty);
      p.result.avgFillPrice = num(exec.avgPrice);
      this.emit({ type: "fill", order: { ...p.result }, at: new Date().toISOString() });
    });
  }

  // ---- account ----------------------------------------------------------
  async getAccount(): Promise<Account> {
    await this.ensureConnected();
    return this.queue.enqueue(async () => {
      try {
        // accountSummary streams via reqAccountSummary — we collect into a dict.
        const summary = await this.collectAccountSummary();
        return {
          accountId: this.accountId ?? summary.AccountCode ?? "IBKR",
          equity: num(summary.NetLiquidation),
          cash: num(summary.TotalCashValue),
          buyingPower: num(summary.BuyingPower),
          marginUsed: num(summary.MaintMarginReq),
          daytradesUsed: num(summary.DayTradesRemaining ? 3 - num(summary.DayTradesRemaining) : 0),
          daytradesRemaining: summary.DayTradesRemaining !== undefined ? num(summary.DayTradesRemaining) : null,
          patternDayTrader: !!summary.PatternDayTrader,
          isOptionsApproved: true, // IBKR exposes per-permission flags via reqAccountUpdates; treat as true and let order rejections gate.
          shortingEnabled: true,
          currency: summary.Currency ?? "USD",
        };
      } catch (err: any) {
        throw new BrokerError(this.name, "getAccount", err.message, err);
      }
    });
  }

  private collectAccountSummary(): Promise<Record<string, string>> {
    const { EventName } = require("@stoqey/ib");
    const reqId = Math.floor(Math.random() * 1e9);
    const acc: Record<string, string> = {};
    return new Promise((resolve, reject) => {
      const onTag = (rId: number, _acct: string, tag: string, value: string) => {
        if (rId !== reqId) return;
        acc[tag] = value;
      };
      const onEnd = (rId: number) => {
        if (rId !== reqId) return;
        this.ib.removeListener(EventName.accountSummary, onTag);
        this.ib.removeListener(EventName.accountSummaryEnd, onEnd);
        this.ib.cancelAccountSummary(reqId);
        resolve(acc);
      };
      this.ib.on(EventName.accountSummary, onTag);
      this.ib.on(EventName.accountSummaryEnd, onEnd);
      try {
        this.ib.reqAccountSummary(reqId, "All",
          "NetLiquidation,TotalCashValue,BuyingPower,MaintMarginReq,DayTradesRemaining,PatternDayTrader,AccountCode,Currency");
      } catch (err: any) { reject(err); }
      setTimeout(() => onEnd(reqId), 5000); // hard timeout fallback
    });
  }

  async getPositions(): Promise<Position[]> {
    await this.ensureConnected();
    const { EventName } = require("@stoqey/ib");
    return this.queue.enqueue(() => new Promise<Position[]>((resolve, reject) => {
      const out: Position[] = [];
      const onPos = (_acct: string, contract: any, pos: number, avgCost: number) => {
        if (pos === 0) return;
        out.push({
          symbol: contract.symbol,
          qty: num(pos),
          avgEntryPrice: num(avgCost),
          marketValue: 0, // requires reqMktData per symbol; left for caller layer
          unrealizedPnl: 0,
          realizedPnl: 0,
          side: pos >= 0 ? "long" : "short",
          costBasis: num(pos) * num(avgCost),
        });
      };
      const onEnd = () => {
        this.ib.removeListener(EventName.position, onPos);
        this.ib.removeListener(EventName.positionEnd, onEnd);
        resolve(out);
      };
      this.ib.on(EventName.position, onPos);
      this.ib.once(EventName.positionEnd, onEnd);
      try { this.ib.reqPositions(); } catch (err: any) { reject(new BrokerError(this.name, "getPositions", err.message, err)); }
      setTimeout(() => onEnd(), 5000);
    }));
  }

  async getPosition(symbol: string): Promise<Position | null> {
    const all = await this.getPositions();
    return all.find(p => p.symbol === symbol) ?? null;
  }

  // ---- orders -----------------------------------------------------------
  async placeOrder(req: OrderRequest): Promise<OrderResult> {
    await this.ensureConnected();
    return this.queue.enqueue(async () => {
      try {
        const orderId = this.nextOrderId++;
        const contract = this.buildContract(req);

        if (req.takeProfit || req.stopLoss) {
          // Bracket = parent + 2 children with parentId linkage.
          const tpId = this.nextOrderId++;
          const slId = this.nextOrderId++;
          const counter: Side = req.side === "buy" ? "sell" : "buy";
          this.ib.placeOrder(orderId, contract, this.buildOrderSpec(req, { transmit: false }));
          if (req.takeProfit) {
            this.ib.placeOrder(tpId, contract, this.buildOrderSpec(
              { ...req, side: counter, type: "limit", limitPrice: req.takeProfit.limitPrice },
              { parentId: orderId, transmit: !req.stopLoss }));
          }
          if (req.stopLoss) {
            this.ib.placeOrder(slId, contract, this.buildOrderSpec(
              { ...req, side: counter,
                type: req.stopLoss.limitPrice ? "stop_limit" : "stop",
                stopPrice: req.stopLoss.stopPrice, limitPrice: req.stopLoss.limitPrice },
              { parentId: orderId, transmit: true }));
          }
        } else {
          this.ib.placeOrder(orderId, contract, this.buildOrderSpec(req, { transmit: true }));
        }

        const result: OrderResult = {
          orderId: String(orderId),
          clientOrderId: req.clientOrderId,
          status: "accepted",
          filledQty: 0,
          submittedAt: new Date().toISOString(),
        };
        this.pending.set(orderId, { result });
        return result;
      } catch (err: any) {
        throw new BrokerError(this.name, "placeOrder", err.message, err);
      }
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.ensureConnected();
    try { this.ib.cancelOrder(Number(orderId)); }
    catch (err: any) { throw new BrokerError(this.name, "cancelOrder", err.message, err); }
  }

  async replaceOrder(orderId: string, patch: Partial<OrderRequest>): Promise<OrderResult> {
    // IBKR replace = placeOrder with the same id and updated fields.
    const pending = this.pending.get(Number(orderId));
    if (!pending) throw new BrokerError(this.name, "not_found", `order ${orderId} not tracked`);
    // Caller must provide enough context — we don't have full original req cached intentionally
    // (memory) so use what we have on file plus patch.
    throw new BrokerError(this.name, "unsupported",
      "IBKR replaceOrder requires the full original OrderRequest; cancel + re-place via placeOrder() instead");
  }

  async getOrders(opts?: { status?: "open" | "closed" | "all"; limit?: number }): Promise<OrderResult[]> {
    await this.ensureConnected();
    const { EventName } = require("@stoqey/ib");
    return this.queue.enqueue(() => new Promise<OrderResult[]>(resolve => {
      const out: OrderResult[] = [];
      const onOpen = (orderId: number, _contract: any, _order: any, orderState: any) => {
        out.push({
          orderId: String(orderId),
          status: this.mapStatus(orderState?.status ?? "Submitted"),
          filledQty: 0,
          submittedAt: new Date().toISOString(),
        });
      };
      const onEnd = () => {
        this.ib.removeListener(EventName.openOrder, onOpen);
        this.ib.removeListener(EventName.openOrderEnd, onEnd);
        const limit = opts?.limit ?? 50;
        resolve(out.slice(0, limit));
      };
      this.ib.on(EventName.openOrder, onOpen);
      this.ib.once(EventName.openOrderEnd, onEnd);
      try { this.ib.reqAllOpenOrders(); } catch { onEnd(); }
      setTimeout(onEnd, 5000);
    }));
  }

  streamOrders(handler: (evt: OrderEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => { this.eventHandlers.delete(handler); };
  }

  async isShortable(_symbol: string): Promise<{ shortable: boolean; feeRate?: number }> {
    // IBKR exposes shortability via reqMktData genericTickList "236" (Shortable),
    // but the result is encoded as a magnitude tick. Cleaner to call SecDef.
    throw new BrokerError(this.name, "unsupported",
      "IBKR shortability requires reqMktData(genericTickList='236') subscription; not implemented in this adapter");
  }

  async getOptionsChain(_underlying: string, _expiration?: string): Promise<unknown> {
    throw new BrokerError(this.name, "unsupported",
      "IBKR options chain requires reqSecDefOptParams + per-strike reqMktData. Use a DataAdapter (Polygon/Tradier) for chain data.");
  }

  async ping() {
    const t0 = Date.now();
    try {
      await this.ensureConnected();
      this.ib.reqCurrentTime();
      return { ok: true as const, latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { ok: false as const, error: err?.message ?? "ping failed" };
    }
  }

  // ---- helpers ----------------------------------------------------------
  private buildContract(req: OrderRequest): any {
    if (req.option) {
      return {
        symbol: req.option.underlying,
        secType: "OPT",
        currency: "USD",
        exchange: "SMART",
        lastTradeDateOrContractMonth: req.option.expiration.replace(/-/g, ""),
        strike: req.option.strike,
        right: req.option.right === "call" ? "C" : "P",
        multiplier: "100",
      };
    }
    return {
      symbol: req.symbol,
      secType: "STK",
      currency: "USD",
      exchange: "SMART",
      primaryExchange: "NASDAQ",
    };
  }

  private buildOrderSpec(req: OrderRequest, opts: { parentId?: number; transmit: boolean }): any {
    const action = req.side === "buy" ? "BUY" : "SELL";
    const tif = (req.timeInForce ?? "day").toUpperCase();
    const base: any = {
      action,
      totalQuantity: req.qty,
      tif,
      transmit: opts.transmit,
      parentId: opts.parentId,
      outsideRth: req.extendedHours ?? false,
      orderRef: req.clientOrderId,
    };
    switch (req.type) {
      case "market":      base.orderType = "MKT"; break;
      case "limit":       base.orderType = "LMT"; base.lmtPrice = req.limitPrice; break;
      case "stop":        base.orderType = "STP"; base.auxPrice = req.stopPrice; break;
      case "stop_limit":  base.orderType = "STP LMT"; base.lmtPrice = req.limitPrice; base.auxPrice = req.stopPrice; break;
      case "trailing_stop":
        base.orderType = "TRAIL";
        if (req.trailPct !== undefined) base.trailingPercent = req.trailPct;
        if (req.trailAmount !== undefined) base.auxPrice = req.trailAmount;
        break;
    }
    return base;
  }

  private mapStatus(s: string): OrderResult["status"] {
    switch (s) {
      case "Filled": return "filled";
      case "PartiallyFilled": return "partial";
      case "Cancelled": case "ApiCancelled": return "canceled";
      case "Inactive": case "Rejected": return "rejected";
      case "PendingSubmit": case "PreSubmitted": return "pending";
      case "Submitted": case "ApiPending": return "accepted";
      default: return "pending";
    }
  }

  private emit(e: OrderEvent): void {
    for (const h of this.eventHandlers) { try { h(e); } catch { /* listener errors swallowed */ } }
  }
}

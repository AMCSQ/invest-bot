// TradierBrokerAdapter — Tradier REST + WebSocket.
// No first-party Node SDK; we hit REST directly. Docs: https://documentation.tradier.com/
// Env: TRADIER_TOKEN (account-level bearer token), TRADIER_ACCOUNT (account number).
// Paper:  https://sandbox.tradier.com/v1
// Live:   https://api.tradier.com/v1

import {
  BrokerAdapter, OrderRequest, OrderResult, Position, Account, OrderEvent,
} from "../BrokerAdapter";
import { BrokerError, num } from "./errors";
import { SerialQueue } from "./queue";

export interface TradierConfig {
  token: string;          // REQUIRED — generated in Tradier account settings
  accountId: string;      // REQUIRED — e.g. "VA12345678"
  mode: "paper" | "live";
}

export class TradierBrokerAdapter implements BrokerAdapter {
  readonly name = "tradier";
  readonly mode: "paper" | "live";
  private base: string;
  private token: string;
  private accountId: string;
  private queue = new SerialQueue({ minSpacingMs: 100 }); // ~ 60 req/min
  private rateState = { limit: 120, remaining: 120, resetAt: 0 };
  private rateHandlers = new Set<(s: { remaining: number; resetAt: number }) => void>();

  constructor(cfg: TradierConfig) {
    if (!cfg.token) throw new BrokerError("tradier", "config", "TRADIER_TOKEN is required");
    if (!cfg.accountId) throw new BrokerError("tradier", "config", "accountId is required");
    this.mode = cfg.mode;
    this.token = cfg.token;
    this.accountId = cfg.accountId;
    this.base = cfg.mode === "paper" ? "https://sandbox.tradier.com/v1" : "https://api.tradier.com/v1";
  }

  get rateLimit() { return { ...this.rateState }; }
  onRateLimit(handler: (s: { remaining: number; resetAt: number }) => void): () => void {
    this.rateHandlers.add(handler);
    return () => { this.rateHandlers.delete(handler); };
  }

  // ---- account ----------------------------------------------------------
  async getAccount(): Promise<Account> {
    return this.call("getAccount", async () => {
      const data = await this.get(`/accounts/${this.accountId}/balances`);
      const b = data.balances ?? {};
      const margin = b.margin ?? b.cash ?? b.pdt ?? {};
      return {
        accountId: this.accountId,
        equity: num(b.total_equity),
        cash: num(b.total_cash),
        buyingPower: num(margin.stock_buying_power ?? b.cash?.cash_available ?? b.total_cash),
        marginUsed: num(margin.stock_short_value ?? 0),
        daytradesUsed: num(b.pdt?.day_trade_count ?? 0),
        daytradesRemaining: b.pdt ? Math.max(0, 3 - num(b.pdt.day_trade_count)) : null,
        patternDayTrader: !!b.pdt,
        isOptionsApproved: num(b.option_short_value) >= 0, // crude — Tradier doesn't return tier directly
        currency: "USD",
        shortingEnabled: !!margin.stock_short_value || !!margin,
      };
    });
  }

  async getPositions(): Promise<Position[]> {
    return this.call("getPositions", async () => {
      const data = await this.get(`/accounts/${this.accountId}/positions`);
      if (!data.positions || data.positions === "null") return [];
      const raw = Array.isArray(data.positions.position) ? data.positions.position : [data.positions.position];
      return raw.filter(Boolean).map((p: any) => this.mapPosition(p));
    });
  }

  async getPosition(symbol: string): Promise<Position | null> {
    const all = await this.getPositions();
    return all.find(p => p.symbol === symbol) ?? null;
  }

  // ---- orders -----------------------------------------------------------
  async placeOrder(req: OrderRequest): Promise<OrderResult> {
    return this.call("placeOrder", async () => {
      const params: Record<string, string> = {
        class: req.option ? "option" : (req.takeProfit || req.stopLoss ? "otoco" : "equity"),
        symbol: req.option ? req.option.underlying : req.symbol,
        side: this.mapSide(req),
        quantity: String(req.qty),
        type: this.mapType(req.type),
        duration: req.timeInForce ?? "day",
      };
      if (req.limitPrice !== undefined) params.price = String(req.limitPrice);
      if (req.stopPrice !== undefined) params.stop = String(req.stopPrice);
      if (req.option) {
        params.option_symbol = this.buildOccSymbol(req.option);
      }
      // OTOCO bracket: Tradier wants nested order legs as numbered fields.
      if (req.takeProfit) {
        params["symbol[1]"] = req.symbol;
        params["side[1]"] = req.side === "buy" ? "sell" : "buy_to_cover";
        params["quantity[1]"] = String(req.qty);
        params["type[1]"] = "limit";
        params["price[1]"] = String(req.takeProfit.limitPrice);
        params["duration[1]"] = "gtc";
      }
      if (req.stopLoss) {
        params["symbol[2]"] = req.symbol;
        params["side[2]"] = req.side === "buy" ? "sell" : "buy_to_cover";
        params["quantity[2]"] = String(req.qty);
        params["type[2]"] = req.stopLoss.limitPrice ? "stop_limit" : "stop";
        params["stop[2]"] = String(req.stopLoss.stopPrice);
        if (req.stopLoss.limitPrice !== undefined) params["price[2]"] = String(req.stopLoss.limitPrice);
        params["duration[2]"] = "gtc";
      }
      if (req.clientOrderId) params.tag = req.clientOrderId; // idempotency tag

      const data = await this.post(`/accounts/${this.accountId}/orders`, params);
      const o = data.order ?? {};
      return {
        orderId: String(o.id),
        clientOrderId: req.clientOrderId,
        status: this.mapStatus(o.status ?? "ok"),
        filledQty: 0,
        submittedAt: new Date().toISOString(),
        message: o.message,
      };
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.call("cancelOrder", () => this.del(`/accounts/${this.accountId}/orders/${orderId}`));
  }

  async replaceOrder(orderId: string, patch: Partial<OrderRequest>): Promise<OrderResult> {
    return this.call("replaceOrder", async () => {
      const params: Record<string, string> = {};
      if (patch.qty !== undefined) params.quantity = String(patch.qty);
      if (patch.limitPrice !== undefined) params.price = String(patch.limitPrice);
      if (patch.stopPrice !== undefined) params.stop = String(patch.stopPrice);
      if (patch.timeInForce) params.duration = patch.timeInForce;
      if (patch.type) params.type = this.mapType(patch.type);
      const data = await this.put(`/accounts/${this.accountId}/orders/${orderId}`, params);
      const o = data.order ?? {};
      return {
        orderId: String(o.id ?? orderId),
        status: this.mapStatus(o.status ?? "ok"),
        filledQty: num(o.exec_quantity),
        submittedAt: new Date().toISOString(),
      };
    });
  }

  async getOrders(opts?: { status?: "open" | "closed" | "all"; limit?: number }): Promise<OrderResult[]> {
    return this.call("getOrders", async () => {
      const data = await this.get(`/accounts/${this.accountId}/orders`);
      if (!data.orders || data.orders === "null") return [];
      const raw = Array.isArray(data.orders.order) ? data.orders.order : [data.orders.order];
      const all: OrderResult[] = raw.filter(Boolean).map((o: any) => ({
        orderId: String(o.id),
        clientOrderId: o.tag,
        status: this.mapStatus(o.status),
        filledQty: num(o.exec_quantity),
        avgFillPrice: o.avg_fill_price ? num(o.avg_fill_price) : undefined,
        submittedAt: o.create_date ?? new Date().toISOString(),
      }));
      const status = opts?.status ?? "open";
      const filtered = all.filter(o => {
        if (status === "all") return true;
        if (status === "open") return o.status === "accepted" || o.status === "pending" || o.status === "partial";
        return o.status === "filled" || o.status === "canceled" || o.status === "rejected";
      });
      return filtered.slice(0, opts?.limit ?? 50);
    });
  }

  streamOrders(handler: (evt: OrderEvent) => void): () => void {
    // Tradier streams account events via a session-bound WebSocket. The flow:
    //  1. POST /accounts/{id}/events/session  -> get sessionId + stream url
    //  2. Open WS to wss://ws.tradier.com/v1/accounts/events?sessionid=...
    let ws: any | undefined;
    let closed = false;
    (async () => {
      try {
        const session = await this.post(`/accounts/${this.accountId}/events/session`, {});
        const sid = session.stream?.sessionid;
        const url = session.stream?.url?.replace(/^http/, "ws") ?? "wss://ws.tradier.com/v1/accounts/events";
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const WebSocket = require("ws");
        ws = new WebSocket(`${url}?sessionid=${sid}`);
        ws.on("message", (raw: Buffer) => {
          try {
            const u = JSON.parse(raw.toString());
            handler({
              type: this.mapEventType(u.event ?? u.type ?? "new"),
              order: {
                orderId: String(u.id ?? u.order_id ?? ""),
                status: this.mapStatus(u.status ?? "ok"),
                filledQty: num(u.exec_quantity),
                avgFillPrice: u.avg_fill_price ? num(u.avg_fill_price) : undefined,
                submittedAt: u.create_date ?? new Date().toISOString(),
              },
              at: new Date().toISOString(),
            });
          } catch { /* ignore malformed frames */ }
        });
      } catch (err: any) {
        if (!closed) throw new BrokerError(this.name, "streamOrders", err.message, err);
      }
    })();
    return () => { closed = true; try { ws?.close(); } catch { /* idempotent */ } };
  }

  async isShortable(symbol: string) {
    return this.call("isShortable", async () => {
      const data = await this.get(`/markets/lookup?q=${encodeURIComponent(symbol)}`);
      const sec = data.securities?.security;
      if (!sec) return { shortable: false };
      // Tradier's lookup doesn't return shortability directly; assume true for
      // listed equities, let the order rejection gate enforce.
      return { shortable: true };
    });
  }

  async getOptionsChain(underlying: string, expiration?: string): Promise<unknown> {
    return this.call("getOptionsChain", async () => {
      if (!expiration) {
        const exp = await this.get(`/markets/options/expirations?symbol=${underlying}`);
        return exp;
      }
      const chain = await this.get(`/markets/options/chains?symbol=${underlying}&expiration=${expiration}&greeks=true`);
      return chain.options;
    });
  }

  async ping() {
    const t0 = Date.now();
    try {
      await this.get("/markets/clock");
      return { ok: true as const, latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { ok: false as const, error: err?.message ?? "ping failed" };
    }
  }

  // ---- HTTP -------------------------------------------------------------
  private async call<T>(op: string, fn: () => Promise<T>): Promise<T> {
    return this.queue.enqueue(async () => {
      try { return await fn(); }
      catch (err: any) { throw new BrokerError(this.name, op, err?.message ?? "tradier call failed", err); }
    });
  }

  private async get(path: string): Promise<any> {
    return this.fetch(path, { method: "GET" });
  }
  private async del(path: string): Promise<any> {
    return this.fetch(path, { method: "DELETE" });
  }
  private async post(path: string, body: Record<string, string>): Promise<any> {
    return this.fetch(path, {
      method: "POST",
      body: new URLSearchParams(body).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }
  private async put(path: string, body: Record<string, string>): Promise<any> {
    return this.fetch(path, {
      method: "PUT",
      body: new URLSearchParams(body).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }
  private async fetch(path: string, init: any): Promise<any> {
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
    // Tradier surfaces rate-limit metadata via headers (X-Ratelimit-*).
    const rem = res.headers.get("x-ratelimit-available");
    const lim = res.headers.get("x-ratelimit-allowed");
    const reset = res.headers.get("x-ratelimit-expiry");
    if (rem) this.rateState.remaining = num(rem);
    if (lim) this.rateState.limit = num(lim);
    if (reset) this.rateState.resetAt = num(reset);
    if (rem && this.rateState.remaining < this.rateState.limit * 0.1) {
      for (const h of this.rateHandlers) h({ ...this.rateState });
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${path}: ${text}`);
    }
    return res.json();
  }

  // ---- mappers ----------------------------------------------------------
  private mapSide(req: OrderRequest): string {
    if (req.option) {
      return req.side === "buy" ? "buy_to_open" : "sell_to_close";
    }
    return req.side; // "buy" | "sell"
  }

  private mapType(t: OrderRequest["type"]): string {
    switch (t) {
      case "market": return "market";
      case "limit": return "limit";
      case "stop": return "stop";
      case "stop_limit": return "stop_limit";
      case "trailing_stop": return "stop"; // Tradier exposes trailing_stop only via separate `trailing_stop` order class
    }
  }

  private mapPosition(p: any): Position {
    const qty = num(p.quantity);
    const cb = num(p.cost_basis);
    return {
      symbol: p.symbol,
      qty,
      avgEntryPrice: qty !== 0 ? cb / qty : 0,
      marketValue: 0, // Tradier returns market_value separately via /quotes — left to caller layer
      unrealizedPnl: 0,
      realizedPnl: 0,
      side: qty >= 0 ? "long" : "short",
      costBasis: cb,
    };
  }

  private mapStatus(s: string): OrderResult["status"] {
    switch (s) {
      case "filled": return "filled";
      case "partially_filled": return "partial";
      case "canceled": case "expired": return "canceled";
      case "rejected": case "error": return "rejected";
      case "open": case "pending": case "submitted": return "accepted";
      default: return "pending";
    }
  }

  private mapEventType(e: string): OrderEvent["type"] {
    switch (e) {
      case "fill": return "fill";
      case "partial_fill": return "partial_fill";
      case "canceled": return "cancel";
      case "rejected": return "reject";
      case "expired": return "expire";
      default: return "new";
    }
  }

  private buildOccSymbol(opt: { underlying: string; expiration: string; strike: number; right: "call" | "put" }): string {
    // OCC: ROOT(6) YYMMDD C/P STRIKE(8) — strike * 1000 zero-padded.
    const root = opt.underlying.padEnd(6, " ").slice(0, 6).trim();
    const yymmdd = opt.expiration.slice(2).replace(/-/g, "");
    const cp = opt.right === "call" ? "C" : "P";
    const strike = Math.round(opt.strike * 1000).toString().padStart(8, "0");
    return `${root}${yymmdd}${cp}${strike}`;
  }
}

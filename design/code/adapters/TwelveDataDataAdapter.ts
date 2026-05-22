// TwelveDataDataAdapter — Twelve Data REST + WebSocket.
// Free-tier friendly (8 req/min, 800/day). SDK is Python-only;
// from Node we hit the REST API directly.
// Env: TWELVEDATA_KEY
// Docs: https://twelvedata.com/docs

import {
  DataAdapter, Bar, Quote, SymbolInfo, Resolution,
} from "../DataAdapter";
import { DataError, num } from "./errors";
import { SerialQueue } from "./queue";

export interface TwelveDataConfig {
  apiKey: string;
  tier?: "free" | "starter" | "pro";
}

const INTERVAL_MAP: Record<Resolution, string> = {
  "1": "1min", "5": "5min", "15": "15min", "30": "30min",
  "60": "1h", "240": "4h",
  "D": "1day", "W": "1week", "M": "1month",
};

export class TwelveDataDataAdapter implements DataAdapter {
  readonly name = "twelvedata";
  readonly tier: "free" | "starter" | "pro";
  private apiKey: string;
  // Free tier: 8 rpm => ~7500ms spacing. Conservative default.
  private queue: SerialQueue;
  private rateState = { limit: 8, remaining: 8, resetAt: 0 };

  constructor(cfg: TwelveDataConfig) {
    if (!cfg.apiKey) throw new DataError("twelvedata", "config", "TWELVEDATA_KEY is required");
    this.apiKey = cfg.apiKey;
    this.tier = cfg.tier ?? "free";
    this.queue = new SerialQueue({ minSpacingMs: this.tier === "free" ? 7500 : 200 });
  }

  get rateLimit() { return { ...this.rateState }; }

  async getBars(opts: { symbol: string; resolution: Resolution; from: number; to: number }): Promise<Bar[]> {
    return this.call("getBars", async () => {
      const params = new URLSearchParams({
        symbol: opts.symbol,
        interval: INTERVAL_MAP[opts.resolution],
        start_date: new Date(opts.from * 1000).toISOString().slice(0, 19),
        end_date: new Date(opts.to * 1000).toISOString().slice(0, 19),
        order: "asc",
        format: "JSON",
        apikey: this.apiKey,
      });
      const data = await this.get(`/time_series?${params}`);
      const values = (data.values ?? []) as any[];
      return values.map(v => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: num(v.open),
        high: num(v.high),
        low: num(v.low),
        close: num(v.close),
        volume: num(v.volume),
      }));
    });
  }

  async getQuote(symbol: string): Promise<Quote> {
    return this.call("getQuote", async () => {
      const data = await this.get(`/quote?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`);
      return {
        symbol,
        bid: num(data.bid?.price ?? data.close),
        bidSize: 0,
        ask: num(data.ask?.price ?? data.close),
        askSize: 0,
        last: num(data.close),
        timestamp: num(data.timestamp) * 1000 || Date.now(),
      };
    });
  }

  streamQuotes(symbols: string[], handler: (q: Quote) => void): () => void {
    // Twelve Data WS: wss://ws.twelvedata.com/v1/quotes/price?apikey=...
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebSocket = require("ws");
    const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.apiKey}`);
    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "subscribe", params: { symbols: symbols.join(",") } }));
    });
    ws.on("message", (raw: Buffer) => {
      try {
        const m = JSON.parse(raw.toString());
        if (m.event !== "price") return;
        handler({
          symbol: m.symbol,
          bid: num(m.price),
          bidSize: 0,
          ask: num(m.price),
          askSize: 0,
          last: num(m.price),
          timestamp: num(m.timestamp) * 1000 || Date.now(),
        });
      } catch { /* ignore malformed frames */ }
    });
    return () => { try { ws.close(); } catch { /* idempotent */ } };
  }

  async getSymbol(symbol: string): Promise<SymbolInfo> {
    return this.call("getSymbol", async () => {
      const data = await this.get(`/symbol_search?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`);
      const r = (data.data ?? [])[0] ?? {};
      return {
        symbol: r.symbol ?? symbol,
        name: r.instrument_name ?? symbol,
        type: this.mapType(r.instrument_type),
        exchange: r.exchange ?? "",
        currency: (r.currency ?? "USD").toUpperCase(),
        timezone: r.exchange_timezone ?? "America/New_York",
        hasIntraday: true,
        minTick: 0.01,
        pricescale: 100,
        session: "0930-1600:23456",
      };
    });
  }

  async search(query: string, opts?: { type?: SymbolInfo["type"]; limit?: number }): Promise<SymbolInfo[]> {
    return this.call("search", async () => {
      const data = await this.get(`/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${this.apiKey}`);
      const arr = (data.data ?? []) as any[];
      const mapped = arr.slice(0, opts?.limit ?? 20).map(r => ({
        symbol: r.symbol,
        name: r.instrument_name ?? r.symbol,
        type: this.mapType(r.instrument_type),
        exchange: r.exchange ?? "",
        currency: (r.currency ?? "USD").toUpperCase(),
        timezone: r.exchange_timezone ?? "America/New_York",
        hasIntraday: true,
        minTick: 0.01,
        pricescale: 100,
        session: "0930-1600:23456",
      }) as SymbolInfo);
      return opts?.type ? mapped.filter(s => s.type === opts.type) : mapped;
    });
  }

  async getOptionsChain(_underlying: string, _expiration?: string) {
    throw new DataError("twelvedata", "unsupported",
      "Twelve Data does not provide options chains in free or starter tiers. Use Polygon, Tradier, or yfinance.");
  }

  async getFundamentals(symbol: string) {
    return this.call("getFundamentals", async () => {
      const stats = await this.get(`/statistics?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`);
      const s = stats.statistics ?? {};
      return {
        symbol,
        marketCap: num(s.valuations_metrics?.market_capitalization),
        shares: num(s.stock_statistics?.shares_outstanding),
        float: num(s.stock_statistics?.float_shares),
        shortInterest: num(s.stock_statistics?.shares_short),
        beta: num(s.stock_price_summary?.beta),
        pe: num(s.valuations_metrics?.trailing_pe),
        forwardPe: num(s.valuations_metrics?.forward_pe),
        eps: num(s.financials?.income_statement?.diluted_eps_ttm),
        dividendYield: num(s.dividends_and_splits?.forward_annual_dividend_yield),
        sector: s.sector,
        industry: s.industry,
      };
    });
  }

  async getEarningsCalendar(from: string, to: string) {
    return this.call("getEarningsCalendar", async () => {
      const data = await this.get(`/earnings_calendar?start_date=${from}&end_date=${to}&apikey=${this.apiKey}`);
      const days = data.earnings ?? {};
      const out: { symbol: string; date: string; estimate?: number }[] = [];
      for (const [date, entries] of Object.entries(days)) {
        for (const e of entries as any[]) {
          out.push({ symbol: e.symbol, date, estimate: e.eps_estimate ? num(e.eps_estimate) : undefined });
        }
      }
      return out;
    });
  }

  async getEconomicCalendar(_from: string, _to: string) {
    throw new DataError("twelvedata", "unsupported",
      "Economic calendar is gated to Twelve Data's higher tiers; use FRED for free macro data.");
  }

  async getSessions(_exchange: string, from: string, to: string) {
    const out: { date: string; open: number; close: number }[] = [];
    const start = new Date(from), end = new Date(to);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
      const dateStr = d.toISOString().slice(0, 10);
      out.push({
        date: dateStr,
        open: Date.parse(`${dateStr}T14:30:00Z`) / 1000,
        close: Date.parse(`${dateStr}T21:00:00Z`) / 1000,
      });
    }
    return out;
  }

  async ping() {
    const t0 = Date.now();
    try {
      await this.get(`/api_usage?apikey=${this.apiKey}`);
      return { ok: true as const, latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { ok: false as const, error: err?.message ?? "ping failed" };
    }
  }

  // ---- HTTP -------------------------------------------------------------
  private async call<T>(op: string, fn: () => Promise<T>): Promise<T> {
    return this.queue.enqueue(async () => {
      try { return await fn(); }
      catch (err: any) { throw new DataError("twelvedata", op, err?.message ?? "twelvedata call failed", err); }
    });
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`https://api.twelvedata.com${path}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${path}: ${text}`);
    }
    const json = await res.json();
    // TD returns { status: "error", code, message } in the body on errors.
    if (json.status === "error") throw new Error(`TD error ${json.code}: ${json.message}`);
    // Best-effort rate-limit decrement; TD exposes /api_usage but no per-response headers.
    if (this.rateState.remaining > 0) this.rateState.remaining--;
    return json;
  }

  private mapType(t?: string): SymbolInfo["type"] {
    switch ((t ?? "").toLowerCase()) {
      case "etf": return "etf";
      case "index": return "index";
      case "physical currency": case "digital currency": return "crypto";
      case "forex pair": return "forex";
      case "common stock": case "preferred stock": return "stock";
      default: return "stock";
    }
  }
}

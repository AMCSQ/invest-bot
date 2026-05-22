// Broker adapter selector. Reads BROKER from env, dynamically imports the
// concrete adapter, exposes `brokers.active`. Every component / route / skill
// in this codebase calls `brokers.active.placeOrder(...)` — the rest of the
// app is broker-agnostic. See PLATFORM-INTEGRATIONS.md.

import type { BrokerAdapter, OrderRequest, OrderResult, Account, Position, OrderEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Placeholder synthetic broker — accepts and rejects orders deterministically
// without any external service. Useful for dev, tests, and CI. The real
// implementation belongs in design/code/adapters/synthetic.ts (sibling agent's
// work); we inline a minimal version here so the package boots standalone.
// ---------------------------------------------------------------------------

class PlaceholderSyntheticBroker implements BrokerAdapter {
  readonly name = "synthetic";
  readonly mode = "synthetic" as const;

  private equity = 100_000;
  private cash = 100_000;
  private orderCounter = 0;
  private positions = new Map<string, Position>();

  async getAccount(): Promise<Account> {
    return {
      accountId: "synthetic-1",
      equity: this.equity,
      cash: this.cash,
      buyingPower: this.cash * 2,
      marginUsed: 0,
      daytradesUsed: 0,
      daytradesRemaining: null,
      patternDayTrader: false,
      isOptionsApproved: true,
      optionsTier: 2,
      shortingEnabled: true,
      currency: "USD",
    };
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async getPosition(symbol: string): Promise<Position | null> {
    return this.positions.get(symbol) ?? null;
  }

  async placeOrder(req: OrderRequest): Promise<OrderResult> {
    this.orderCounter += 1;
    // Synthetic fills are instant at the limit price (or 100 if market).
    const fillPrice = req.limitPrice ?? 100;
    return {
      orderId: `syn-${this.orderCounter}`,
      clientOrderId: req.clientOrderId,
      status: "filled",
      filledQty: req.qty,
      avgFillPrice: fillPrice,
      submittedAt: new Date().toISOString(),
    };
  }

  async cancelOrder(_orderId: string): Promise<void> {
    /* no-op */
  }

  async replaceOrder(orderId: string, _patch: Partial<OrderRequest>): Promise<OrderResult> {
    return {
      orderId,
      status: "accepted",
      filledQty: 0,
      submittedAt: new Date().toISOString(),
    };
  }

  async getOrders(): Promise<OrderResult[]> {
    return [];
  }

  streamOrders(_handler: (evt: OrderEvent) => void): () => void {
    return () => {
      /* no-op */
    };
  }

  async ping() {
    return { ok: true as const, latencyMs: 0 };
  }
}

class UnconfiguredBroker implements BrokerAdapter {
  constructor(readonly name: string) {}
  readonly mode = "paper" as const;
  private fail(): never {
    throw new Error(
      `Broker "${this.name}" is not configured. Set BROKER in .env.local and provide credentials.`,
    );
  }
  async getAccount() { return this.fail(); }
  async getPositions() { return this.fail(); }
  async getPosition() { return this.fail(); }
  async placeOrder() { return this.fail(); }
  async cancelOrder() { return this.fail(); }
  async replaceOrder() { return this.fail(); }
  async getOrders() { return this.fail(); }
  streamOrders() { return () => { /* no-op */ }; }
  async ping() { return { ok: false as const, error: `broker ${this.name} not configured` }; }
}

function selectBroker(): BrokerAdapter {
  const choice = (process.env.BROKER ?? "synthetic").toLowerCase();
  switch (choice) {
    case "synthetic":
      return new PlaceholderSyntheticBroker();
    case "alpaca":
      // TODO: dynamic-import `./adapters/alpaca` once the concrete adapter
      // is written. Required env: ALPACA_KEY_ID, ALPACA_SECRET, ALPACA_BASE_URL.
      return new UnconfiguredBroker("alpaca");
    case "ibkr":
      // TODO: dynamic-import `./adapters/ibkr`. Requires a running TWS or
      // IB Gateway on localhost:7497 (paper) or :7496 (live).
      return new UnconfiguredBroker("ibkr");
    case "tradier":
      // TODO: dynamic-import `./adapters/tradier`. OAuth + REST.
      return new UnconfiguredBroker("tradier");
    default:
      return new UnconfiguredBroker(choice);
  }
}

export const brokers = {
  active: selectBroker(),
};

// One entry point for every adapter in the repo. Apps should import from
// here and only here so swapping providers is a config change in lib/brokers.ts
// or lib/data.ts, not a rewrite.
//
//   import { AlpacaBrokerAdapter, PolygonDataAdapter } from "@/design/code/adapters";

export { SyntheticBrokerAdapter } from "./SyntheticBrokerAdapter";
export type { SyntheticConfig } from "./SyntheticBrokerAdapter";

export { AlpacaBrokerAdapter } from "./AlpacaBrokerAdapter";
export type { AlpacaConfig } from "./AlpacaBrokerAdapter";

export { IBKRBrokerAdapter } from "./IBKRBrokerAdapter";
export type { IBKRConfig } from "./IBKRBrokerAdapter";

export { TradierBrokerAdapter } from "./TradierBrokerAdapter";
export type { TradierConfig } from "./TradierBrokerAdapter";

export { PolygonDataAdapter } from "./PolygonDataAdapter";
export type { PolygonConfig } from "./PolygonDataAdapter";

export { YFinanceDataAdapter } from "./YFinanceDataAdapter";
export type { YFinanceConfig } from "./YFinanceDataAdapter";

export { TwelveDataDataAdapter } from "./TwelveDataDataAdapter";
export type { TwelveDataConfig } from "./TwelveDataDataAdapter";

export { BrokerError, DataError, num } from "./errors";
export { SerialQueue } from "./queue";

// Re-export interface types for convenience.
export type {
  BrokerAdapter, OrderRequest, OrderResult, Position, Account, OrderEvent,
  Side, OrderType, TimeInForce,
} from "../BrokerAdapter";
export type {
  DataAdapter, Bar, Quote, SymbolInfo, OptionsChain, OptionContract,
  Fundamentals, EconomicEvent, Resolution,
} from "../DataAdapter";

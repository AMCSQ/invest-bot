import { z } from "zod";

// TradingView alert payload — the JSON your Pine script emits.
// Keep this conservative: every Pine bug becomes a malformed payload at
// 4am UTC. See TRADINGVIEW-INTEGRATION.md §5 for the example Pine script.

export const TVPayloadSchema = z.object({
  action: z.enum(["buy", "sell", "close"]),
  symbol: z
    .string()
    .min(1)
    .max(8)
    .regex(/^[A-Z][A-Z.\-]{0,7}$/, "uppercase ticker, optional . or -"),
  qty: z.number().positive().max(10_000),
  price: z.number().positive().optional(),
  strategy: z.string().min(1).max(64),
  // Optional fields a savvy Pine script may include — never trust them blindly.
  stop: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  riskPct: z.number().positive().max(0.05).optional(), // never > 5% per trade
  // TradingView-supplied bar time for idempotency keying + replay detection.
  bartime: z.string().datetime().optional(),
});

export type TVPayload = z.infer<typeof TVPayloadSchema>;

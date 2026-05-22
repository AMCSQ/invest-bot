import { promises as fs } from "node:fs";
import path from "node:path";

// Append-only JSONL audit log: every payload + decision + broker response.
// One file per UTC day; rotate by reading `data/webhook-log/YYYY-MM-DD.jsonl`
// from your log shipper. See TRADINGVIEW-INTEGRATION.md §5 hardening point 6.

const LOG_DIR = path.join(process.cwd(), "data", "webhook-log");

export interface AuditEntry {
  at: string;                  // ISO timestamp
  // biome-ignore lint/suspicious/noExplicitAny: payload shape varies pre-validation
  payload: any;
  outcome: "accepted" | "rejected" | "dedup" | "killed" | "rate_limited" | "error";
  reason?: string;
  orderId?: string;
  ip?: string;
}

export async function appendAudit(entry: AuditEntry): Promise<void> {
  const day = entry.at.slice(0, 10); // YYYY-MM-DD
  const file = path.join(LOG_DIR, `${day}.jsonl`);
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(file, `${JSON.stringify(entry)}\n`, "utf8");
}

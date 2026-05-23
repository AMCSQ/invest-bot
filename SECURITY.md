# Security Policy

This is a personal-use trading-research repo. It handles **broker API credentials, trade data, and order-routing code**. Treat any vulnerability seriously.

## Supported versions

`main` only. The feature branches and historical tags receive no fixes.

## Reporting a vulnerability

**Do not file a public issue** for security problems. Instead:

1. Open a [GitHub private security advisory](https://github.com/amcsq/financial-planner/security/advisories/new) on this repository.
2. Include: reproduction steps, affected component (e.g. `mcp/`, `web/lib/webhook/`, `.claude/skills/alert-webhook/`), severity assessment, and any proof-of-concept.

Expected response time: best-effort. This is a personal project — no SLA.

## What lives where (so reporters can scope)

| Component | What it handles | High-value attack surface |
|---|---|---|
| `web/lib/webhook/` | TradingView alert → broker order | Shared-secret bypass, idempotency-key collision, kill-switch bypass |
| `mcp/src/` | MCP-tool → broker order | Pre-trade gate bypass, tilt-guard bypass, audit-log tampering |
| `design/code/adapters/` | Vendor SDK wrappers | Credential leakage, log injection, replay |
| `.claude/skills/alert-webhook/` | Hardening checklist | Documentation drift from implementation |
| `.claude/skills/tilt-guard/` | PreToolUse hook | Hook registration bypass, state.yaml tampering |
| `.env.example` (root + `web/`) | Documents required secrets | Don't commit real keys to PRs |

## Known-good operational defaults

- Broker keys live in `.env.local` (gitignored), never in committed files.
- `MCP_RISK_CEILING_PCT` defaults to 1% — raise only after confirming structures are defined-risk.
- `tilt-guard` PreToolUse hook fail-closed if `data/state.yaml` is stale (> 4h old).
- `alert-webhook` requires `X-TV-Secret` header match; rotate quarterly.
- The kill switch is `TV_WEBHOOK_KILL=1` for the webhook and `MCP_KILL=1` for the MCP server. **Practice using both.**

## Things we explicitly do not patch

- Vulnerabilities in vendor SDKs (Alpaca, IBKR, Tradier, etc.) — report upstream.
- Tradesignal/strategy "leaks" — this is a personal repo; strategies aren't secrets.
- Issues in third-party Claude Code plugins — report to `anthropics/claude-plugins-official` or the plugin's repo.

## Disclosure timeline

We don't run a coordinated-disclosure schedule. If your finding is critical, we'll acknowledge within a week and patch as fast as the codebase allows. If it's low-severity, we may roll it into the next batch of dep updates.

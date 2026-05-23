# CLAUDE.md — Claude Code addendum

Read [`AGENTS.md`](./AGENTS.md) first. This file adds Claude-Code-specific guidance on top of the cross-LLM advisor doc.

## Claude Code mechanics for this repo

- **Skill discovery.** Claude Code auto-loads SKILL.md files from `.claude/skills/<name>/SKILL.md`. The 35 entries are listed in [`.claude/skills/README.md`](./.claude/skills/README.md).
- **Per-profile narrowing.** When the user does `cd profiles/<persona> && claude`, the persona's `.claude/CLAUDE.md` becomes the operative memory. Prefer the skills in that profile's allowlist (documented in `profiles/<persona>/CLAUDE.md`).
- **Hooks.** The `tilt-guard` skill is the canonical example of a `PreToolUse` hook: it reads `data/state.yaml` and blocks order-placement MCP tool calls when the user is on tilt. The day-trading profile is the only profile that ships this hook enabled by default. See [`tilt-guard/SKILL.md`](./.claude/skills/tilt-guard/SKILL.md).
- **MCP server.** [`mcp/`](./mcp/) exposes `BrokerAdapter` + `DataAdapter` as MCP tools (`place_order`, `get_quote`, etc.). External agents — Cursor, Claude Desktop, Codex, Gemini CLI — can call into this repo's adapter layer over MCP. Build with `cd mcp && npm install && npm run build && npm start`.
- **Settings cascade.** Claude Code reads `.claude/settings.json` from cwd upward, so a profile-specific settings file shadows the root one when the user is inside that profile.

## Recommended plugins to install

From [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official):

| Plugin | Why for this repo |
|---|---|
| `skill-creator` | Analyzer + eval harness for SKILL.md authoring; one-shot upgrade pass across the 35 skills here |
| `code-review` | Multi-agent PR review with confidence scoring; complements the CI workflow |
| `hookify` | Generic `PreToolUse` rule engine; `tilt-guard` is a specialized variant of this pattern |

See [`FAVOURITE-REPOS.md §3`](./FAVOURITE-REPOS.md#3-plugins-from-anthropicsclaude-plugins-official-worth-installing) for the full list.

## What to do when the user asks "is there a profile for X?"

1. Check the table in [`AGENTS.md`](./AGENTS.md#profile-structure) and [`profiles/README.md`](./profiles/README.md).
2. If yes, route them: "Yes — `cd profiles/<persona>` and re-open Claude Code there. The persona's `CLAUDE.md` will narrow your tool surface."
3. If no, ask whether X is a fundamentally different trading style or a refinement of an existing profile. If the former, suggest a new profile and link to `profiles/<existing>/EXTRACT.md` as the template.

## What to do when the user asks "should I extract this profile into its own repo?"

Read the profile's `EXTRACT.md`. The default recommendation is **yes**, especially when:
- The profile becomes the user's primary workflow (≥ 60% of trading attention).
- The profile's deployment shape diverges from the others (e.g. day-trading needs a 24/7 dashboard; long-term doesn't).
- The user collaborates with someone else who only cares about that profile.

The shared repo is the **seed**, not the destination. Encourage extraction when ready.

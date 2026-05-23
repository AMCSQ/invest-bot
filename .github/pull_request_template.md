## Summary

<!-- 1–3 sentences. What changes, and why. -->

## Scope

- [ ] Skills only (`.claude/skills/`)
- [ ] Design (`design/`)
- [ ] Web (`web/`)
- [ ] MCP server (`mcp/`)
- [ ] Profiles (`profiles/`)
- [ ] CI / scripts / repo config
- [ ] Docs only

## Profile impact

Which profile(s) does this affect? Mark all that apply.

- [ ] `long-term/`
- [ ] `swing/`
- [ ] `day-trading/`
- [ ] `options/`
- [ ] `crypto/`
- [ ] Cross-cutting / none

## Discipline gates touched?

If yes, **discipline-changing PRs need explicit reasoning** — these gates exist precisely because they can't be talked around in the moment.

- [ ] `tilt-guard` (PreToolUse hook)
- [ ] `pre-trade-checklist` (state.yaml writer)
- [ ] `alert-webhook` gate logic
- [ ] None

## Adapter-contract changes

- [ ] `BrokerAdapter` / `DataAdapter` interface modified
- [ ] Concrete adapter behavior changed
- [ ] None

If yes — confirm `web/lib/types.ts` and `mcp/src/types.ts` mirrors are updated in the same PR.

## Test plan

<!-- How was this verified? CI is the floor; what else? -->

- [ ] `node --experimental-strip-types scripts/lint-skills.ts --strict` passes
- [ ] `cd web && npx tsc --noEmit` passes
- [ ] `cd web && npm run lint` passes
- [ ] `cd mcp && npm run build` passes
- [ ] Manually exercised the affected profile's playbook (specify which routine)
- [ ] N/A — docs only

## Risk

<!-- One line. What could go wrong? -->

## Rollback plan

<!-- How do we revert if this lands badly? -->

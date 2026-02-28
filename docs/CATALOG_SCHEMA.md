[中文](CATALOG_SCHEMA.zh-CN.md) | English

# Catalog Schema Semantics (v1.2.0)

This document defines field semantics of `skills-catalog.json` for both AI and humans.

## 1. Top-level structure

```json
{
  "schemaVersion": "1.2.0",
  "generatedAt": "ISO-8601",
  "source": "workspace.json",
  "skills": [],
  "warnings": []
}
```

Field meanings:
1. `schemaVersion`: schema version, currently `1.2.0`.
2. `generatedAt`: generation timestamp (UTC ISO string).
3. `source`: source file name used to build the catalog.
4. `skills`: skill entries.
5. `warnings`: non-blocking warnings (for example path exists but is not a skill repo). Public mode sanitizes local absolute paths.

## 2. Skill field semantics

Each `skills[]` item includes:
1. `id`: stable routing ID used by `--only <skill-id>`.
2. `displayName`: human-readable name.
3. `npm.name` / `npm.version`: default package coordinate and version.
4. `repository.https`: github fallback when npm flow fails.
5. `description`: high-level summary for routing.
6. `description_zh`: optional Chinese description, preferred by Chinese rendering and fallback to `description` when missing.
7. `capabilities`: short capability sentences for intent matching.
8. `artifacts`: boolean availability flags of required artifacts.
9. `setupCommands`: recommended setup command map.
10. `clientSupport`: support level matrix by client type.
11. `openclawToolCount`: number of OpenClaw tools.
12. `dependsOn`: optional direct dependency skill id list for composition/order-aware execution.
13. `sourcePath`: local-only optional field, omitted in public catalog by default.

## 3. `artifacts` semantics

1. `skillMd: true`
- Means target repo has `SKILL.md` and AI can extract capabilities/limits/safety rules.

2. `mcpServer: true`
- Means MCP entry is present via `src/mcp/server.ts` or equivalent `scripts.mcp`.

3. `openclaw: true`
- Means `openclaw.json` is present for OpenClaw tool descriptions.

## 4. `clientSupport` enum semantics

1. `native`
- Usable out-of-box, usually with official artifacts and setup commands.

2. `native-setup`
- Natively supported but requires setup command execution first.

3. `manual-mcp`
- MCP-compatible but requires manual configuration.

4. `manual-cli-or-mcp`
- Can be connected manually via CLI or MCP.

5. `manual`
- Usable manually, no standard one-click setup path.

6. `unsupported`
- Not supported for that client at the moment.

## 5. `capabilities` writing guidelines

Recommended style:
1. Start with action verbs (for example `Query block status`, `Create wallet`).
2. One capability sentence should describe one action.
3. Avoid vague wording such as `handle everything`.
4. Include boundary hints such as `read-only` and `simulate/send`.

## 6. Modes and compatibility

1. Public mode (default)
- Command: `bun run catalog:generate`
- Output: `skills-catalog.json`
- Characteristic: no `sourcePath`, warnings are path-sanitized, suitable for external AI consumption.

2. Local mode (path debugging)
- Command: `bun run catalog:generate:local`
- Output: `skills-catalog.local.json`
- Characteristic: includes `sourcePath`, intended for local machine only.

3. Migration note (1.1.1 -> 1.2.0)
- Added optional `dependsOn` to describe direct cross-skill dependencies.
- Optional `description_zh` (introduced in `1.1.1`) remains supported.
- Existing consumers should ignore unknown fields if not needed.

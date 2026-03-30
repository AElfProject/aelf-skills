[中文](CATALOG_SCHEMA.zh-CN.md) | English

# Catalog Schema Semantics (v1.4.0)

This document defines field semantics of `skills-catalog.json` for both AI and humans.

## 1. Top-level structure

```json
{
  "schemaVersion": "1.4.0",
  "generatedAt": "ISO-8601",
  "source": "workspace.json",
  "skills": [],
  "warnings": []
}
```

Field meanings:
1. `schemaVersion`: schema version, currently `1.4.0`.
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
5. `distributionSources`: machine-readable discovery sources (`githubRepo`, `npmPackage`, optional `clawhubId`).
6. `description`: high-level summary for routing.
7. `description_zh`: optional Chinese description, preferred by Chinese rendering and fallback to `description` when missing.
8. `capabilities`: short capability sentences for intent matching.
9. `artifacts`: boolean availability flags of required artifacts, including `ironclawWasm`.
10. `setupCommands`: compatibility display commands for humans/local repos.
11. `clientSupport`: support level matrix by client type, including `ironclaw`.
12. `clientInstall`: machine-executable activation contract for `openclaw`, plus a reserved compatibility slot for `ironclaw`.
13. `ironclawNative`: optional native IronClaw WASM artifact contract.
14. `clawhub`: optional ClawHub metadata describing discovery-shell vs runtime role.
15. `openclawToolCount`: number of OpenClaw tools.
16. `dependsOn`: optional direct dependency skill id list for composition/order-aware execution.
17. `sourcePath`: local-only optional field, omitted in public catalog by default.

## 3. `artifacts` semantics

1. `skillMd: true`
- Means target repo has `SKILL.md` and AI can extract capabilities/limits/safety rules.

2. `mcpServer: true`
- Means MCP entry is present via `src/mcp/server.ts` or equivalent `scripts.mcp`.

3. `openclaw: true`
- Means `openclaw.json` is present for OpenClaw tool descriptions.

4. `ironclawWasm: true`
- Means the repo ships an `ironclaw-wasm/` sidecar that can produce a native IronClaw WASM artifact.

## 4. `distributionSources` and `clientInstall`

1. `distributionSources`
- Describes where a host can discover a skill.
- `githubRepo` is for source lookup only, not final IronClaw activation.
- `npmPackage` is the default executable distribution coordinate.
- `clawhubId` is optional and only present when OpenClaw managed install is available.

2. `clientInstall.openclaw`
- `managed-install`: host should use ClawHub / managed install, no local command required.
- `package-setup`: host should execute `installCommand`, typically `bunx -p <pkg> <setup-bin> openclaw`.

3. `clientInstall.ironclaw`
- Reserved compatibility field in the current wasm-only rollout.
- Hosts must treat `mode: unsupported` as the only executable-safe value today.
- Final IronClaw activation must come from `ironclawNative`, not `clientInstall.ironclaw`.
- `requiresTrustPromotion` is reserved for future rollout work and is not consumed today.

4. `ironclawNative`
- Native IronClaw runtime contract for WASM tools.
- `artifactUrl` / `capabilitiesUrl` point at GitHub Release assets.
- `installCommand` is intentionally local-path based (for example `ironclaw tool install ./tool.wasm`); the host should download the assets first, then execute locally.
- `stateModel: isolated` means the native tool keeps its own IronClaw workspace state and does not share the Bun/MCP runtime store.

## 5. `clientSupport` enum semantics

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

## 6. `capabilities` writing guidelines

Recommended style:
1. Start with action verbs (for example `Query block status`, `Create wallet`).
2. One capability sentence should describe one action.
3. Avoid vague wording such as `handle everything`.
4. Include boundary hints such as `read-only` and `simulate/send`.

## 7. Modes and compatibility

1. Public mode (default)
- Command: `bun run catalog:generate`
- Output: `skills-catalog.json`
- Characteristic: no `sourcePath`, warnings are path-sanitized, suitable for external AI consumption.

2. Local mode (path debugging)
- Command: `bun run catalog:generate:local`
- Output: `skills-catalog.local.json`
- Characteristic: includes `sourcePath`, intended for local machine only.

3. Additive note (1.4.0)
- Added `artifacts.ironclawWasm` to signal native IronClaw sidecars.
- Added `ironclawNative` for native WASM artifact discovery and install contracts.
- Added `clawhub` role metadata to distinguish discovery-shell vs runtime delivery.
- `clientInstall.ironclaw` remains in schema for backward compatibility, but the current rollout keeps it `unsupported`.
- Existing consumers should ignore unknown fields if not needed.

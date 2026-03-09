中文 | [English](CATALOG_SCHEMA.md)

# Catalog Schema 语义说明（v1.3.0）

本文档定义 `skills-catalog.json` 的字段语义，供 AI 与开发者统一理解。

## 1. 顶层结构

```json
{
  "schemaVersion": "1.3.0",
  "generatedAt": "ISO-8601",
  "source": "workspace.json",
  "skills": [],
  "warnings": []
}
```

字段说明：
1. `schemaVersion`：schema 版本。当前为 `1.3.0`。
2. `generatedAt`：生成时间（UTC ISO 字符串）。
3. `source`：catalog 的输入来源文件名。
4. `skills`：技能数组。
5. `warnings`：非阻断告警（例如路径存在但不是 skill 仓）。公开模式默认做路径脱敏，不暴露本机绝对路径。

## 2. skill 字段语义

每个 `skills[]` 包含：
1. `id`：稳定的路由 ID，用于 `--only <skill-id>`。
2. `displayName`：面向人类展示名称。
3. `npm.name` / `npm.version`：默认下载坐标与版本。
4. `repository.https`：npm 失败时 github fallback 地址。
5. `description`：技能简介（用于高层路由）。
6. `description_zh`：可选中文描述。中文界面优先使用，缺失时回退 `description`。
7. `capabilities`：能力短句列表（用于 intent 匹配）。
8. `artifacts`：能力产物存在性布尔值。
9. `setupCommands`：推荐 setup 命令映射，可包含 `ironclaw`。
10. `clientSupport`：客户端支持级别矩阵，包含 `ironclaw`。
11. `openclawToolCount`：OpenClaw 工具数量。
12. `dependsOn`：可选直接依赖 skill id 列表，用于编排顺序与组合执行。
13. `sourcePath`：仅本地模式可选字段，公开 catalog 默认不含。

## 3. artifacts 语义

1. `skillMd: true`
- 意味着目标仓存在 `SKILL.md`，可提取能力、限制与安全规则。

2. `mcpServer: true`
- 意味着存在 `src/mcp/server.ts` 或等价 `scripts.mcp` 能力入口。

3. `openclaw: true`
- 意味着存在 `openclaw.json` 可用于 OpenClaw 工具描述。

## 4. clientSupport 枚举语义

1. `native`
- 开箱即用，通常有官方产物 + setup 命令。

2. `native-setup`
- 有原生支持，但需要先执行 setup 命令注入配置。

3. `manual-mcp`
- 支持 MCP，但需手工配置，不保证一键 setup。

4. `manual-cli-or-mcp`
- 可通过 CLI 或 MCP 手工接入。

5. `manual`
- 可手工使用，但无标准自动 setup 路径。

6. `unsupported`
- 当前不支持该客户端。

## 5. capabilities 写法规范

建议：
1. 使用动词开头的短句（例如 `Query block status`、`Create wallet`）。
2. 一条能力描述一个动作，不混合多个独立流程。
3. 避免模糊词（如 `handle everything`）。
4. 包含边界词（如 `read-only`、`simulate/send`）。

## 6. 模式与兼容性

1. 公开模式（默认）
- 命令：`bun run catalog:generate`
- 输出：`skills-catalog.json`
- 特点：不包含 `sourcePath`，warnings 经过路径脱敏，适合外部 AI 消费。

2. 本地模式（路径调试）
- 命令：`bun run catalog:generate:local`
- 输出：`skills-catalog.local.json`
- 特点：包含 `sourcePath`，仅适用于本机环境。

3. 迁移说明（1.2.0 -> 1.3.0）
- 新增 `setupCommands.ironclaw`，用于表达 trusted skill setup 命令。
- 新增 `clientSupport.ironclaw`，用于表达 IronClaw 支持级别。
- 旧消费者如暂不使用新增字段，需按“忽略未知字段”兼容读取。

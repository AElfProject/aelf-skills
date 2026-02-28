中文 | [English](SKILL_TEMPLATE.md)

# SKILL.md 模板

以下模板满足 `docs/AI_SKILL_CONTRACT.zh-CN.md` 的最低结构要求。

```md
---
name: "<skill-id>"
description: "<英文一句话描述>"
description_zh: "<中文一句话描述，可选但推荐>"
---

# <展示名称>

## When to use
- 描述该 skill 适用的核心场景和用户意图。

## Capabilities
- 能力 1
- 能力 2

## Safe usage rules
- 敏感信息处理规则。
- 写操作前的确认要求。

## Limits / Non-goals
- 明确该 skill 不做什么。
- 已知限制和风险边界。
```

最低检查项：
1. front matter 包含 `name` 和 `description`。
2. 存在 `## Capabilities` 且为列表。
3. 存在 `## Limits / Non-goals`。

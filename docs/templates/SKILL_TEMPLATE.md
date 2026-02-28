[中文](SKILL_TEMPLATE.zh-CN.md) | English

# SKILL.md Template

Use this template as the minimum structure required by `docs/AI_SKILL_CONTRACT.md`.

```md
---
name: "<skill-id>"
description: "<one-line English description>"
description_zh: "<one-line Chinese description, optional but recommended>"
---

# <Display Name>

## When to use
- Describe the primary intent and audience.

## Capabilities
- Capability 1
- Capability 2

## Safe usage rules
- Sensitive data handling.
- Confirmation requirements for write actions.

## Limits / Non-goals
- What this skill does not do.
- Known constraints and risk boundaries.
```

Minimum checks:
1. Front matter has `name` and `description`.
2. `## Capabilities` section exists and uses bullet items.
3. `## Limits / Non-goals` section exists.

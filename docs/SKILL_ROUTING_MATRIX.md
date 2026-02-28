[中文](SKILL_ROUTING_MATRIX.zh-CN.md) | English

# Skill Routing Matrix (Intent -> Skill)

Use this matrix to route user intents across multiple skills.

## 1. General routing table

| User Intent | Recommended Skill | Alternative Skill | Selection Rule |
|---|---|---|---|
| Wallet lifecycle, asset query, transfer | `portkey-eoa-agent-skills` | `portkey-ca-agent-skills` | Default to EOA; switch to CA when CA identity/guardian flow is required |
| CA registration/recovery/guardian/CA identity tx | `portkey-ca-agent-skills` | `portkey-eoa-agent-skills` | If CA status or guardian flow is involved, choose CA |
| Chain status/block/tx details, contract view/send | `aelf-node-skill` | `aelfscan-skill` | Prefer aelf-node for direct node capabilities or send workflows |
| Explorer analytics on address/token/NFT/statistics | `aelfscan-skill` | `aelf-node-skill` | Prefer aelfscan for aggregated explorer analytics |
| DEX quote/swap/liquidity | `awaken-agent-skills` | `portkey-eoa-agent-skills` or `portkey-ca-agent-skills` | Trade execution depends on wallet skill as signer source |
| eForest token/NFT marketplace actions | `eforest-agent-skills` | `portkey-eoa-agent-skills` or `portkey-ca-agent-skills` | eForest handles domain actions, wallet skills provide signing identity |
| TomorrowDAO governance/BP/resource operations | `tomorrowdao-agent-skills` | `portkey-ca-agent-skills` | Use tomorrowdao for governance domain; wallet skills supplement identity management |

## 2. Key ambiguity decisions

### 2.1 `portkey-eoa` vs `portkey-ca`

1. Default to `portkey-eoa-agent-skills`.
2. Switch to `portkey-ca-agent-skills` when these signals appear:
- `CA wallet`
- `guardian`
- `register/recover`
- `CA hash / CA address`

### 2.2 `aelf-node` vs `aelfscan`

1. Choose `aelf-node-skill` for raw chain interaction (node read/send/fee/view).
2. Choose `aelfscan-skill` for explorer-level analytics and search.
3. For “analyze then verify” tasks, use `aelfscan` first, then `aelf-node`.

### 2.3 wallet skill composition with `awaken/eforest`

1. `awaken-agent-skills` and `eforest-agent-skills` handle domain operations.
2. Signing identity should come from wallet skills:
- standard private key flows: `portkey-eoa-agent-skills`
- CA identity flows: `portkey-ca-agent-skills`

## 3. Fallback strategy

1. If intent is ambiguous, start with read-only operations to gather context.
2. Before any write action, confirm identity mode (EOA/CA) and network settings.
3. If still ambiguous, return “recommended + alternative + reason” instead of forcing a single choice.

Recommended output format:
```text
Recommended: <skill-id>
Alternative: <skill-id>
Reason: <why recommended path is preferred under current signals>
```

Example (EOA/CA ambiguity):
```text
Recommended: portkey-eoa-agent-skills
Alternative: portkey-ca-agent-skills
Reason: No CA/guardian signals detected; default to EOA path.
```

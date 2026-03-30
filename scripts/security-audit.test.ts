import { describe, expect, test } from 'bun:test';
import { collectIssues } from './security-audit.ts';
import type { SkillsCatalog } from './lib/types.ts';

function buildCatalog(command: string): SkillsCatalog {
  return {
    schemaVersion: '1.4.0',
    generatedAt: '2026-03-10T00:00:00.000Z',
    source: 'test',
    warnings: [],
    skills: [
      {
        id: 'fixture',
        displayName: 'Fixture',
        npm: { name: '@fixture/skill', version: '0.1.0' },
        repository: { https: 'https://github.com/fixture/skill.git' },
        distributionSources: { npmPackage: '@fixture/skill' },
        description: 'fixture',
        capabilities: [],
        artifacts: {
          skillMd: true,
          mcpServer: true,
          openclaw: false,
          ironclawWasm: false,
        },
        setupCommands: {
          install: command,
        },
        clientSupport: {
          openclaw: 'unsupported',
          cursor: 'manual-mcp',
          claude_desktop: 'manual-mcp',
          ironclaw: 'unsupported',
          claude_code: 'manual-mcp',
          codex: 'manual-cli-or-mcp',
        },
        clientInstall: {
          openclaw: { source: 'none', mode: 'unsupported' },
          ironclaw: { source: 'none', mode: 'unsupported' },
        },
        openclawToolCount: 0,
      },
    ],
  };
}

describe('security-audit risk patterns', () => {
  test('detects && command chaining', () => {
    const issues = collectIssues(buildCatalog('bun install && bun run setup'));
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('multi-command chain with &&');
  });

  test('detects eval execution', () => {
    const issues = collectIssues(buildCatalog('eval ./script.sh'));
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('eval execution');
  });
});

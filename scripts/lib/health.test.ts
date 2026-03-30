import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { runHealthCheck } from './health.ts';
import type { SkillCatalogEntry, SkillsCatalog } from './types.ts';

const ROOT_DIR = path.resolve(import.meta.dir, '..', '..');
const FIXTURE_SKILL_DIR = path.join(ROOT_DIR, 'testdata', 'skills', 'fixture-core-skill');

function buildFixtureSkill(overrides: Partial<SkillCatalogEntry> = {}): SkillCatalogEntry {
  return {
    id: 'fixture-core-skill',
    displayName: 'Fixture Core Skill',
    npm: {
      name: '@fixture/core-skill',
      version: '0.1.0',
    },
    repository: {
      https: 'https://github.com/fixture/core-skill.git',
    },
    distributionSources: {
      githubRepo: 'https://github.com/fixture/core-skill.git',
      npmPackage: '@fixture/core-skill',
      clawhubId: 'fixture-core-skill',
    },
    description: 'Fixture core skill for tests.',
    capabilities: ['fixture'],
    artifacts: {
      skillMd: true,
      mcpServer: true,
      openclaw: true,
      ironclawWasm: true,
    },
    setupCommands: {
      install: 'bun install',
      openclaw: 'bun run setup openclaw',
    },
    clientSupport: {
      openclaw: 'native',
      cursor: 'native-setup',
      claude_desktop: 'native-setup',
      ironclaw: 'native',
      claude_code: 'manual-mcp',
      codex: 'manual-cli-or-mcp',
    },
    clientInstall: {
      openclaw: {
        source: 'clawhub',
        mode: 'managed-install',
      },
      ironclaw: {
        source: 'none',
        mode: 'unsupported',
      },
    },
    ironclawNative: {
      runtime: 'wasm-tool',
      distribution: 'github-release',
      artifactUrl: 'https://github.com/fixture/core-skill/releases/download/v0.1.0/fixture-core-skill.wasm',
      capabilitiesUrl:
        'https://github.com/fixture/core-skill/releases/download/v0.1.0/fixture-core-skill.capabilities.json',
      installCommand: 'ironclaw tool install ./fixture-core-skill.wasm',
      stateModel: 'isolated',
      stability: 'experimental',
    },
    clawhub: {
      slug: 'fixture-core-skill',
      role: 'discovery-shell',
    },
    openclawToolCount: 1,
    sourcePath: FIXTURE_SKILL_DIR,
    ...overrides,
  };
}

function buildCatalog(skills: SkillCatalogEntry[]): SkillsCatalog {
  return {
    schemaVersion: '1.4.0',
    generatedAt: '2026-03-10T00:00:00.000Z',
    source: 'test',
    skills,
    warnings: [],
  };
}

describe('health severity gate', () => {
  test('treats illegal ironclaw support levels as fail', () => {
    const report = runHealthCheck(
      buildCatalog([
        buildFixtureSkill({
          clientSupport: {
            openclaw: 'native',
            cursor: 'native-setup',
            claude_desktop: 'native-setup',
            ironclaw: 'manual',
            claude_code: 'manual-mcp',
            codex: 'manual-cli-or-mcp',
          },
          artifacts: {
            skillMd: true,
            mcpServer: true,
            openclaw: true,
            ironclawWasm: false,
          },
          ironclawNative: undefined,
        }),
      ]),
    );

    expect(report.results[0].status).toBe('fail');
    expect(report.results[0].issues).toContainEqual({
      message: 'ironclaw support must be native or unsupported in wasm-only rollout',
      severity: 'fail',
    });
  });
});

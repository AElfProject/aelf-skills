import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCatalog } from './catalog.ts';

const PREVIOUS_SKILLS_BASE = process.env.SKILLS_BASE;
const ROOT_DIR = path.resolve(import.meta.dir, '..', '..');
const FIXTURE_ROOT = path.join(ROOT_DIR, 'testdata');
const FIXTURE_WORKSPACE = path.join(FIXTURE_ROOT, 'workspace.ci.json');
const TEMP_DIRS: string[] = [];

afterEach(() => {
  while (TEMP_DIRS.length > 0) {
    rmSync(TEMP_DIRS.pop()!, { recursive: true, force: true });
  }
  if (PREVIOUS_SKILLS_BASE === undefined) {
    delete process.env.SKILLS_BASE;
    return;
  }
  process.env.SKILLS_BASE = PREVIOUS_SKILLS_BASE;
});

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  TEMP_DIRS.push(dir);
  return dir;
}

describe('catalog distribution contract', () => {
  test('buildCatalog emits machine-readable discovery and activation fields', () => {
    process.env.SKILLS_BASE = FIXTURE_ROOT;

    const catalog = buildCatalog({
      workspacePath: FIXTURE_WORKSPACE,
      includeLocalPaths: true,
    });

    const coreSkill = catalog.skills.find(skill => skill.id === 'fixture-core-skill');
    const nodeSkill = catalog.skills.find(skill => skill.id === 'fixture-node-skill');

    expect(coreSkill).toBeDefined();
    expect(nodeSkill).toBeDefined();

    expect(coreSkill?.distributionSources).toEqual(
      expect.objectContaining({
        npmPackage: '@fixture/core-skill',
        clawhubId: 'fixture-core-skill',
      }),
    );
    expect(coreSkill?.artifacts.ironclawWasm).toBe(true);
    expect(coreSkill?.clientSupport.ironclaw).toBe('native');
    expect(coreSkill?.clawhub).toEqual({
      slug: 'fixture-core-skill',
      role: 'discovery-shell',
    });
    expect(coreSkill?.ironclawNative).toEqual({
      runtime: 'wasm-tool',
      distribution: 'github-release',
      artifactUrl: 'https://github.com/fixture/core-skill/releases/download/v0.1.0/fixture-core-skill.wasm',
      capabilitiesUrl:
        'https://github.com/fixture/core-skill/releases/download/v0.1.0/fixture-core-skill.capabilities.json',
      installCommand: 'ironclaw tool install ./fixture-core-skill.wasm',
      stateModel: 'isolated',
      stability: 'experimental',
    });
    expect(coreSkill?.clientInstall.openclaw).toEqual({
      source: 'clawhub',
      mode: 'managed-install',
    });
    expect(coreSkill?.clientInstall.ironclaw).toEqual({
      source: 'none',
      mode: 'unsupported',
    });

    expect(nodeSkill?.distributionSources).toEqual(
      expect.objectContaining({
        npmPackage: '@fixture/node-skill',
      }),
    );
    expect(nodeSkill?.artifacts.ironclawWasm).toBe(false);
    expect(nodeSkill?.clientSupport.ironclaw).toBe('unsupported');
    expect(nodeSkill?.dependsOn).toEqual(['fixture-core-skill']);
    expect(nodeSkill?.clientInstall.openclaw.installCommand).toBe(
      'bunx -p @fixture/node-skill fixture-node-setup openclaw',
    );
    expect(nodeSkill?.clientInstall.ironclaw).toEqual({
      source: 'none',
      mode: 'unsupported',
    });
  });

  test('fails on dependency cycles', () => {
    const tempDir = createTempDir('aelf-skills-cycle-');
    const skillADir = path.join(tempDir, 'skill-a');
    const skillBDir = path.join(tempDir, 'skill-b');
    mkdirSync(skillADir, { recursive: true });
    mkdirSync(skillBDir, { recursive: true });
    writeFileSync(
      path.join(skillADir, 'package.json'),
      JSON.stringify({
        name: '@fixture/skill-a',
        version: '0.1.0',
        repository: { url: 'https://github.com/fixture/skill-a.git' },
      }),
    );
    writeFileSync(path.join(skillADir, 'SKILL.md'), '---\nname: "skill-a"\ndescription: "A"\n---\n\n# A');
    writeFileSync(
      path.join(skillBDir, 'package.json'),
      JSON.stringify({
        name: '@fixture/skill-b',
        version: '0.1.0',
        repository: { url: 'https://github.com/fixture/skill-b.git' },
      }),
    );
    writeFileSync(path.join(skillBDir, 'SKILL.md'), '---\nname: "skill-b"\ndescription: "B"\n---\n\n# B');
    const workspacePath = path.join(tempDir, 'workspace.json');
    writeFileSync(
      workspacePath,
      JSON.stringify({
        projects: [
          { path: skillADir, dependsOn: ['skill-b'] },
          { path: skillBDir, dependsOn: ['skill-a'] },
        ],
      }),
    );

    expect(() =>
      buildCatalog({
        workspacePath,
        includeLocalPaths: true,
      }),
    ).toThrow(/Dependency cycle detected/);
  });

  test('warns and skips ironclawNative when multiple capabilities files exist', () => {
    const tempDir = createTempDir('aelf-skills-multi-caps-');
    const skillDir = path.join(tempDir, 'skill');
    const wasmDir = path.join(skillDir, 'ironclaw-wasm');
    mkdirSync(wasmDir, { recursive: true });
    writeFileSync(
      path.join(skillDir, 'package.json'),
      JSON.stringify({
        name: '@fixture/multi-caps',
        version: '0.1.0',
        repository: { url: 'https://github.com/fixture/multi-caps.git' },
      }),
    );
    writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: "multi-caps"\ndescription: "Multi caps"\n---\n\n# Multi Caps',
    );
    writeFileSync(
      path.join(wasmDir, 'Cargo.toml'),
      '[package]\nname = "fixture_multi_caps"\nversion = "0.1.0"\nedition = "2021"\n\n[lib]\ncrate-type = ["cdylib"]\n',
    );
    writeFileSync(path.join(wasmDir, 'first.capabilities.json'), '{"version":"0.1.0"}');
    writeFileSync(path.join(wasmDir, 'second.capabilities.json'), '{"version":"0.1.0"}');
    const workspacePath = path.join(tempDir, 'workspace.json');
    writeFileSync(
      workspacePath,
      JSON.stringify({
        projects: [{ path: skillDir }],
      }),
    );

    const catalog = buildCatalog({
      workspacePath,
      includeLocalPaths: true,
    });
    const skill = catalog.skills.find(entry => entry.id === 'multi-caps');

    expect(skill?.ironclawNative).toBeUndefined();
    expect(skill?.clientSupport.ironclaw).toBe('unsupported');
    expect(catalog.warnings.join('\n')).toContain('multiple IronClaw capabilities files found');
  });
});

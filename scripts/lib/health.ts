import path from 'node:path';
import { existsSync } from 'node:fs';
import type { SkillCatalogEntry, SkillsCatalog } from './types.ts';
import { commandExists, readJsonFile } from './utils.ts';

interface PackageJsonLike {
  scripts?: Record<string, string>;
  bin?: string | Record<string, string>;
}

export interface HealthIssue {
  message: string;
  severity: 'warn' | 'fail';
}

export interface SkillHealthResult {
  id: string;
  skillDir: string;
  status: 'pass' | 'warn' | 'fail';
  issues: HealthIssue[];
  checks: {
    packageJson: boolean;
    setupScript: boolean;
    setupBin: boolean;
    mcpServer: boolean;
    openclawJson: boolean;
    ironclawWasm: boolean;
    cliScript: boolean;
  };
}

export interface HealthSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
}

export interface HealthCheckReport {
  generatedAt: string;
  commandAvailability: Record<string, boolean>;
  summary: HealthSummary;
  results: SkillHealthResult[];
}

export interface RunHealthCheckOptions {
  skillsRoot?: string;
  onlyIds?: string[];
}

export function runHealthCheck(catalog: SkillsCatalog, options: RunHealthCheckOptions = {}): HealthCheckReport {
  const selected = selectSkills(catalog.skills, options.onlyIds || []);

  const commandAvailability: Record<string, boolean> = {
    bun: commandExists('bun'),
    npm: commandExists('npm'),
    git: commandExists('git'),
    tar: commandExists('tar'),
  };

  const results = selected.map(skill => checkSkill(skill, resolveSkillDir(skill, options.skillsRoot)));
  const summary = results.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.status] += 1;
      return acc;
    },
    { total: 0, pass: 0, warn: 0, fail: 0 } as HealthSummary,
  );

  return {
    generatedAt: new Date().toISOString(),
    commandAvailability,
    summary,
    results,
  };
}

export function printHealthReport(report: HealthCheckReport): void {
  console.log('\n[Health Check] Command availability');
  for (const [name, ok] of Object.entries(report.commandAvailability)) {
    console.log(`  - ${name}: ${ok ? 'OK' : 'MISSING'}`);
  }

  console.log('\n[Health Check] Skill matrix');
  console.log('| Skill ID | Status | package.json | setup | setup-bin | MCP | OpenClaw | IronClaw WASM | CLI |');
  console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|');

  for (const row of report.results) {
    console.log(
      `| ${row.id} | ${row.status.toUpperCase()} | ${toFlag(row.checks.packageJson)} | ${toFlag(row.checks.setupScript)} | ${toFlag(row.checks.setupBin)} | ${toFlag(row.checks.mcpServer)} | ${toFlag(row.checks.openclawJson)} | ${toFlag(row.checks.ironclawWasm)} | ${toFlag(row.checks.cliScript)} |`,
    );
  }

  const summary = report.summary;
  console.log(
    `\n[Health Check] Summary: total=${summary.total}, pass=${summary.pass}, warn=${summary.warn}, fail=${summary.fail}`,
  );

  const hasIssues = report.results.some(row => row.issues.length > 0);
  if (hasIssues) {
    console.log('\n[Health Check] Issues');
    for (const row of report.results) {
      if (row.issues.length === 0) continue;
      for (const issue of row.issues) {
        console.log(`  - ${row.id} [${issue.severity.toUpperCase()}]: ${issue.message}`);
      }
    }
  }
}

function checkSkill(skill: SkillCatalogEntry, skillDir: string): SkillHealthResult {
  if (!skillDir) {
    return {
      id: skill.id,
      skillDir: '(unresolved)',
      status: 'fail',
      issues: [
        {
          message: 'local source path missing; provide --skills-root or use local-path catalog mode',
          severity: 'fail',
        },
      ],
      checks: {
        packageJson: false,
        setupScript: false,
        setupBin: false,
        mcpServer: false,
        openclawJson: false,
        ironclawWasm: false,
        cliScript: false,
      },
    };
  }

  const packagePath = path.join(skillDir, 'package.json');
  const mcpPath = path.join(skillDir, 'src', 'mcp', 'server.ts');
  const openclawPath = path.join(skillDir, 'openclaw.json');
  const ironclawWasmPath = path.join(skillDir, 'ironclaw-wasm', 'Cargo.toml');

  const checks = {
    packageJson: existsSync(packagePath),
    setupScript: false,
    setupBin: false,
    mcpServer: existsSync(mcpPath),
    openclawJson: existsSync(openclawPath),
    ironclawWasm: existsSync(ironclawWasmPath),
    cliScript: false,
  };

  const issues: HealthIssue[] = [];

  let pkgScripts: Record<string, string> = {};
  if (!checks.packageJson) {
    issues.push({ message: 'package.json missing', severity: 'fail' });
  } else {
    try {
      const pkg = readJsonFile<PackageJsonLike>(packagePath);
      pkgScripts = pkg.scripts || {};
      checks.setupScript =
        Boolean(pkgScripts.setup) ||
        existsSync(path.join(skillDir, 'bin', 'setup.ts')) ||
        existsSync(path.join(skillDir, 'bin', 'setup.js'));
      checks.setupBin = hasSetupBinary(pkg);
      checks.mcpServer = checks.mcpServer || Boolean(pkgScripts.mcp);
      checks.cliScript = Boolean(pkgScripts.cli);
    } catch {
      issues.push({ message: 'package.json parse failed', severity: 'fail' });
    }
  }

  validateExpectedSupport(skill, checks, issues);

  let status: SkillHealthResult['status'] = 'pass';
  if (issues.length > 0) {
    status = issues.some(issue => issue.severity === 'fail') ? 'fail' : 'warn';
  }

  return {
    id: skill.id,
    skillDir,
    status,
    issues,
    checks,
  };
}

function validateExpectedSupport(
  skill: SkillCatalogEntry,
  checks: SkillHealthResult['checks'],
  issues: HealthIssue[],
): void {
  if (skill.clientSupport.openclaw === 'native' && !checks.openclawJson) {
    issues.push({ message: 'declared openclaw native but openclaw.json missing', severity: 'fail' });
  }

  const needsSetup =
    skill.clientSupport.cursor === 'native-setup' ||
    skill.clientSupport.claude_desktop === 'native-setup';
  if (needsSetup && !checks.setupScript) {
    issues.push({ message: 'declared native-setup but setup command not available', severity: 'fail' });
  }
  if (needsSetup && !checks.setupBin) {
    issues.push({ message: 'declared native-setup but npm installer bin is missing', severity: 'fail' });
  }

  const needsMcp =
    skill.clientSupport.cursor !== 'unsupported' ||
    skill.clientSupport.claude_desktop !== 'unsupported' ||
    skill.clientSupport.claude_code !== 'unsupported';
  if (needsMcp && !checks.mcpServer) {
    issues.push({ message: 'MCP support declared but src/mcp/server.ts missing', severity: 'fail' });
  }

  const needsCli = skill.clientSupport.codex === 'manual-cli-or-mcp';
  if (needsCli && !checks.mcpServer && !checks.cliScript) {
    issues.push({
      message: 'codex support declared but neither MCP nor CLI script is available',
      severity: 'fail',
    });
  }

  if (
    skill.clientSupport.ironclaw !== 'native' &&
    skill.clientSupport.ironclaw !== 'unsupported'
  ) {
    issues.push({
      message: 'ironclaw support must be native or unsupported in wasm-only rollout',
      severity: 'fail',
    });
  }

  if (skill.clientSupport.ironclaw === 'native') {
    if (!skill.artifacts.ironclawWasm) {
      issues.push({
        message: 'ironclaw native declared but artifacts.ironclawWasm is false',
        severity: 'fail',
      });
    }
    if (!checks.ironclawWasm) {
      issues.push({
        message: 'ironclaw native declared but ironclaw-wasm/Cargo.toml missing',
        severity: 'fail',
      });
    }
    if (!skill.ironclawNative) {
      issues.push({
        message: 'ironclaw native declared but ironclawNative contract missing',
        severity: 'fail',
      });
    } else {
      if (!skill.ironclawNative.artifactUrl) {
        issues.push({ message: 'ironclaw native declared but artifactUrl missing', severity: 'fail' });
      }
      if (!skill.ironclawNative.capabilitiesUrl) {
        issues.push({
          message: 'ironclaw native declared but capabilitiesUrl missing',
          severity: 'fail',
        });
      }
      if (!skill.ironclawNative.installCommand) {
        issues.push({
          message: 'ironclaw native declared but installCommand missing',
          severity: 'fail',
        });
      }
    }

    if (skill.clientInstall.ironclaw.mode !== 'unsupported') {
      issues.push({
        message: 'ironclaw native declared but clientInstall.ironclaw must stay unsupported',
        severity: 'fail',
      });
    }
  }

  if (
    skill.clientSupport.ironclaw === 'unsupported' &&
    skill.clientInstall.ironclaw.mode !== 'unsupported'
  ) {
    issues.push({
      message: 'ironclaw unsupported declared but clientInstall.ironclaw is still executable',
      severity: 'fail',
    });
  }

  if (skill.clientSupport.openclaw === 'native') {
    if (skill.clientInstall.openclaw.mode === 'managed-install') {
      if (!skill.distributionSources.clawhubId) {
        issues.push({
          message: 'openclaw managed-install declared but distributionSources.clawhubId missing',
          severity: 'fail',
        });
      }
    } else if (skill.clientInstall.openclaw.mode === 'package-setup') {
      if (!skill.distributionSources.npmPackage) {
        issues.push({
          message: 'openclaw package-setup declared but distributionSources.npmPackage missing',
          severity: 'fail',
        });
      }
      if (!skill.clientInstall.openclaw.installCommand) {
        issues.push({
          message: 'openclaw package-setup declared but installCommand missing',
          severity: 'fail',
        });
      }
    } else {
      issues.push({
        message: 'openclaw native support declared but clientInstall.openclaw is not executable',
        severity: 'fail',
      });
    }
  }
}

function hasSetupBinary(pkg: PackageJsonLike): boolean {
  if (!pkg.bin) return false;
  if (typeof pkg.bin === 'string') {
    return isSetupTarget(pkg.bin);
  }
  return Object.values(pkg.bin).some(target => isSetupTarget(target));
}

function isSetupTarget(target: string): boolean {
  const normalized = target.replace(/\\/g, '/').replace(/^\.\//, '');
  return normalized === 'bin/setup.js' || normalized === 'bin/setup.ts';
}

function resolveSkillDir(skill: SkillCatalogEntry, skillsRoot?: string): string {
  if (skillsRoot) return path.join(path.resolve(skillsRoot), skill.id);
  if (skill.sourcePath) return skill.sourcePath;
  return '';
}

function selectSkills(skills: SkillCatalogEntry[], onlyIds: string[]): SkillCatalogEntry[] {
  if (onlyIds.length === 0) return skills;
  const set = new Set(onlyIds);
  return skills.filter(skill => set.has(skill.id));
}

function toFlag(value: boolean): string {
  return value ? 'Y' : 'N';
}

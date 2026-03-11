export type ClientSupportLevel =
  | 'native'
  | 'native-setup'
  | 'manual-mcp'
  | 'manual-cli-or-mcp'
  | 'manual'
  | 'unsupported';

export interface SkillSetupCommands {
  install: string;
  list?: string;
  openclaw?: string;
  cursor?: string;
  claudeDesktop?: string;
  ironclaw?: string;
}

export interface SkillDistributionSources {
  githubRepo?: string;
  npmPackage?: string;
  clawhubId?: string;
}

export type ClientInstallSource = 'clawhub' | 'npm' | 'none';

export type ClientInstallMode =
  | 'managed-install'
  | 'package-setup'
  | 'trusted-local-install'
  | 'unsupported';

export interface SkillClientInstallEntry {
  source: ClientInstallSource;
  mode: ClientInstallMode;
  installCommand?: string;
  /** Reserved for future trust-promotion flows; current rollout does not consume this field. */
  requiresTrustPromotion?: boolean;
}

export interface SkillClientInstall {
  openclaw: SkillClientInstallEntry;
  ironclaw: SkillClientInstallEntry;
}

export interface SkillArtifacts {
  skillMd: boolean;
  mcpServer: boolean;
  openclaw: boolean;
  ironclawWasm: boolean;
}

export interface SkillIronclawNative {
  runtime: 'wasm-tool';
  distribution: 'github-release';
  artifactUrl: string;
  capabilitiesUrl: string;
  installCommand: string;
  stateModel: 'isolated';
  stability: 'experimental' | 'stable';
}

export interface SkillClawhub {
  slug: string;
  role: 'discovery-shell' | 'runtime-skill';
}

export interface SkillClientSupport {
  openclaw: ClientSupportLevel;
  cursor: ClientSupportLevel;
  claude_desktop: ClientSupportLevel;
  ironclaw: ClientSupportLevel;
  claude_code: ClientSupportLevel;
  codex: ClientSupportLevel;
}

export interface SkillRepository {
  https?: string;
}

export interface SkillNpm {
  name: string;
  version: string;
}

export interface SkillCatalogEntry {
  id: string;
  displayName: string;
  npm: SkillNpm;
  repository: SkillRepository;
  distributionSources: SkillDistributionSources;
  description: string;
  description_zh?: string;
  capabilities: string[];
  artifacts: SkillArtifacts;
  setupCommands: SkillSetupCommands;
  clientSupport: SkillClientSupport;
  clientInstall: SkillClientInstall;
  ironclawNative?: SkillIronclawNative;
  clawhub?: SkillClawhub;
  openclawToolCount: number;
  dependsOn?: string[];
  sourcePath?: string;
}

export interface SkillsCatalog {
  schemaVersion: '1.4.0';
  generatedAt: string;
  source: string;
  skills: SkillCatalogEntry[];
  warnings: string[];
}

export interface WorkspaceProject {
  path: string;
  dependsOn?: string[];
}

export interface WorkspaceConfig {
  projects: WorkspaceProject[];
}

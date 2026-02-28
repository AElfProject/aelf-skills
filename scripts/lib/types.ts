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
}

export interface SkillArtifacts {
  skillMd: boolean;
  mcpServer: boolean;
  openclaw: boolean;
}

export interface SkillClientSupport {
  openclaw: ClientSupportLevel;
  cursor: ClientSupportLevel;
  claude_desktop: ClientSupportLevel;
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
  description: string;
  description_zh?: string;
  capabilities: string[];
  artifacts: SkillArtifacts;
  setupCommands: SkillSetupCommands;
  clientSupport: SkillClientSupport;
  openclawToolCount: number;
  dependsOn?: string[];
  sourcePath?: string;
}

export interface SkillsCatalog {
  schemaVersion: '1.2.0';
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

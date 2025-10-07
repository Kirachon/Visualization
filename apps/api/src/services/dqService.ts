export type DQRuleType = 'completeness' | 'accuracy' | 'consistency' | 'timeliness';

export interface DQRule {
  id: string;
  assetId: string; // e.g., "table:users" or "column:users.email"
  type: DQRuleType;
  config: any; // rule-specific config (e.g., { nullThreshold: 0.05 })
  schedule?: string; // cron expression
  ownerId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDQRuleInput {
  assetId: string;
  type: DQRuleType;
  config: any;
  schedule?: string;
  ownerId?: string;
  enabled?: boolean;
}

export interface UpdateDQRuleInput {
  config?: any;
  schedule?: string;
  enabled?: boolean;
}

export interface DQResult {
  id: string;
  ruleId: string;
  status: 'pass' | 'fail' | 'error';
  metrics: any; // rule-specific metrics
  at: string;
}

export interface DQProfile {
  id: string;
  assetId: string;
  stats: {
    count?: number;
    distinct?: number;
    nullPercent?: number;
    min?: any;
    max?: any;
    avg?: number;
    stddev?: number;
    patterns?: string[];
  };
  at: string;
}

export interface DQScore {
  id: string;
  assetId: string;
  score: number; // 0-100
  at: string;
}

function validateRuleType(type: DQRuleType): void {
  const validTypes: DQRuleType[] = ['completeness', 'accuracy', 'consistency', 'timeliness'];
  if (!validTypes.includes(type)) {
    throw new Error('Invalid rule type');
  }
}

export class DQService {
  private rules: Map<string, DQRule> = new Map();
  private results: Map<string, DQResult> = new Map();
  private profiles: Map<string, DQProfile> = new Map();
  private scores: Map<string, DQScore> = new Map();
  private ruleIdCounter = 1;
  private resultIdCounter = 1;
  private profileIdCounter = 1;
  private scoreIdCounter = 1;

  // Rules CRUD
  listRules(assetId?: string): DQRule[] {
    const all = Array.from(this.rules.values());
    return assetId ? all.filter(r => r.assetId === assetId) : all;
  }

  getRule(id: string): DQRule | undefined {
    return this.rules.get(id);
  }

  createRule(input: CreateDQRuleInput): DQRule {
    if (!input.assetId || !input.type || !input.config) {
      throw new Error('assetId, type, and config are required');
    }
    validateRuleType(input.type);

    const id = `dqr_${this.ruleIdCounter++}`;
    const now = new Date().toISOString();
    const rule: DQRule = {
      id,
      assetId: input.assetId,
      type: input.type,
      config: input.config,
      schedule: input.schedule,
      ownerId: input.ownerId,
      enabled: input.enabled !== undefined ? input.enabled : true,
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(id, rule);
    return rule;
  }

  updateRule(id: string, input: UpdateDQRuleInput): DQRule {
    const existing = this.rules.get(id);
    if (!existing) throw new Error('Rule not found');

    const updated: DQRule = {
      ...existing,
      config: input.config ?? existing.config,
      schedule: input.schedule !== undefined ? input.schedule : existing.schedule,
      enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
      updatedAt: new Date().toISOString(),
    };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): void {
    if (!this.rules.has(id)) throw new Error('Rule not found');
    this.rules.delete(id);
  }

  // Results
  listResults(assetId?: string, ruleId?: string): DQResult[] {
    let all = Array.from(this.results.values());
    if (ruleId) {
      all = all.filter(r => r.ruleId === ruleId);
    } else if (assetId) {
      const ruleIds = this.listRules(assetId).map(r => r.id);
      all = all.filter(r => ruleIds.includes(r.ruleId));
    }
    return all.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }

  // Mock rule evaluation
  evaluateRule(ruleId: string): DQResult {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new Error('Rule not found');

    const resultId = `dqres_${this.resultIdCounter++}`;
    // Mock evaluation: randomly pass/fail
    const status = Math.random() > 0.2 ? 'pass' : 'fail';
    const metrics = {
      evaluated: true,
      ruleType: rule.type,
      threshold: rule.config.threshold || 0.95,
      actual: status === 'pass' ? 0.98 : 0.85,
    };
    const result: DQResult = {
      id: resultId,
      ruleId,
      status,
      metrics,
      at: new Date().toISOString(),
    };
    this.results.set(resultId, result);
    return result;
  }

  // Profiling
  profileAsset(assetId: string): DQProfile {
    const profileId = `dqp_${this.profileIdCounter++}`;
    // Mock profiling stats
    const stats = {
      count: 10000,
      distinct: 9500,
      nullPercent: 0.02,
      min: 1,
      max: 10000,
      avg: 5000,
      stddev: 2886,
      patterns: ['email', 'phone'],
    };
    const profile: DQProfile = {
      id: profileId,
      assetId,
      stats,
      at: new Date().toISOString(),
    };
    this.profiles.set(profileId, profile);
    return profile;
  }

  listProfiles(assetId?: string): DQProfile[] {
    const all = Array.from(this.profiles.values());
    return assetId ? all.filter(p => p.assetId === assetId) : all;
  }

  // Scoring
  computeScore(assetId: string): DQScore {
    const scoreId = `dqs_${this.scoreIdCounter++}`;
    // Mock score: average of recent results
    const results = this.listResults(assetId).slice(0, 10);
    const passCount = results.filter(r => r.status === 'pass').length;
    const score = results.length > 0 ? Math.round((passCount / results.length) * 100) : 100;
    const scoreObj: DQScore = {
      id: scoreId,
      assetId,
      score,
      at: new Date().toISOString(),
    };
    this.scores.set(scoreId, scoreObj);
    return scoreObj;
  }

  listScores(assetId?: string): DQScore[] {
    const all = Array.from(this.scores.values());
    return assetId ? all.filter(s => s.assetId === assetId) : all;
  }
}

export const dqService = new DQService();


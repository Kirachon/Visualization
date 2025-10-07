import { dqService, DQService } from '../dqService.js';

describe('dqService', () => {
  let service: DQService;

  beforeEach(() => {
    service = new DQService();
  });

  describe('createRule', () => {
    it('creates a rule with valid inputs', () => {
      const input = {
        assetId: 'table:users',
        type: 'completeness' as const,
        config: { nullThreshold: 0.05 },
      };
      const rule = service.createRule(input);
      expect(rule.id).toBeDefined();
      expect(rule.type).toBe('completeness');
      expect(rule.enabled).toBe(true);
    });

    it('rejects invalid rule type', () => {
      const input = {
        assetId: 'table:users',
        type: 'invalid' as any,
        config: {},
      };
      expect(() => service.createRule(input)).toThrow(/Invalid rule type/);
    });

    it('rejects missing required fields', () => {
      expect(() => service.createRule({} as any)).toThrow(/required/);
    });
  });

  describe('listRules', () => {
    it('returns all rules', () => {
      service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      service.createRule({ assetId: 'table:orders', type: 'accuracy', config: {} });
      const rules = service.listRules();
      expect(rules.length).toBe(2);
    });

    it('filters by assetId', () => {
      service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      service.createRule({ assetId: 'table:orders', type: 'accuracy', config: {} });
      const rules = service.listRules('table:users');
      expect(rules.length).toBe(1);
      expect(rules[0].assetId).toBe('table:users');
    });
  });

  describe('updateRule', () => {
    it('updates rule config', () => {
      const created = service.createRule({ assetId: 'table:users', type: 'completeness', config: { threshold: 0.9 } });
      const updated = service.updateRule(created.id, { config: { threshold: 0.95 } });
      expect(updated.config.threshold).toBe(0.95);
    });

    it('throws for non-existent rule', () => {
      expect(() => service.updateRule('nonexistent', { enabled: false })).toThrow(/not found/);
    });
  });

  describe('deleteRule', () => {
    it('deletes existing rule', () => {
      const created = service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      service.deleteRule(created.id);
      expect(service.getRule(created.id)).toBeUndefined();
    });

    it('throws for non-existent rule', () => {
      expect(() => service.deleteRule('nonexistent')).toThrow(/not found/);
    });
  });

  describe('evaluateRule', () => {
    it('creates a result with pass/fail status', () => {
      const rule = service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      const result = service.evaluateRule(rule.id);
      expect(result.id).toBeDefined();
      expect(result.ruleId).toBe(rule.id);
      expect(['pass', 'fail']).toContain(result.status);
    });

    it('throws for non-existent rule', () => {
      expect(() => service.evaluateRule('nonexistent')).toThrow(/not found/);
    });
  });

  describe('listResults', () => {
    it('returns results for assetId', () => {
      const rule = service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      service.evaluateRule(rule.id);
      service.evaluateRule(rule.id);
      const results = service.listResults('table:users');
      expect(results.length).toBe(2);
    });

    it('filters by ruleId', () => {
      const rule1 = service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      const rule2 = service.createRule({ assetId: 'table:users', type: 'accuracy', config: {} });
      service.evaluateRule(rule1.id);
      service.evaluateRule(rule2.id);
      const results = service.listResults(undefined, rule1.id);
      expect(results.length).toBe(1);
      expect(results[0].ruleId).toBe(rule1.id);
    });
  });

  describe('profileAsset', () => {
    it('creates a profile with stats', () => {
      const profile = service.profileAsset('table:users');
      expect(profile.id).toBeDefined();
      expect(profile.assetId).toBe('table:users');
      expect(profile.stats.count).toBeDefined();
      expect(profile.stats.nullPercent).toBeDefined();
    });
  });

  describe('computeScore', () => {
    it('computes score based on results', () => {
      const rule = service.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      service.evaluateRule(rule.id);
      const score = service.computeScore('table:users');
      expect(score.id).toBeDefined();
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });
  });
});


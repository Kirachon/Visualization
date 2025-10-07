import { getTransform, listTransforms, validateTransformConfig } from '../transformRegistry.js';

describe('transformRegistry', () => {
  describe('listTransforms', () => {
    it('returns array of all available transforms', () => {
      const transforms = listTransforms();
      expect(Array.isArray(transforms)).toBe(true);
      expect(transforms.length).toBeGreaterThan(0);
      
      // Check that each transform has required fields
      transforms.forEach(t => {
        expect(t.name).toBeDefined();
        expect(typeof t.name).toBe('string');
        expect(t.description).toBeDefined();
        expect(t.configSchema).toBeDefined();
        expect(typeof t.validate).toBe('function');
      });
    });

    it('includes expected common transforms', () => {
      const transforms = listTransforms();
      const names = transforms.map(t => t.name);
      
      expect(names).toContain('filter');
      expect(names).toContain('map');
      expect(names).toContain('aggregate');
      expect(names).toContain('join');
      expect(names).toContain('dedupe');
      expect(names).toContain('sort');
      expect(names).toContain('limit');
    });
  });

  describe('getTransform', () => {
    it('returns transform definition for valid name', () => {
      const filter = getTransform('filter');
      expect(filter).toBeDefined();
      expect(filter?.name).toBe('filter');
      expect(filter?.description.toLowerCase()).toContain('filter');
    });

    it('returns undefined for unknown transform', () => {
      const unknown = getTransform('nonexistent');
      expect(unknown).toBeUndefined();
    });
  });

  describe('validateTransformConfig - filter', () => {
    it('validates correct filter config', () => {
      const errors = validateTransformConfig('filter', { condition: 'age > 18' });
      expect(errors).toEqual([]);
    });

    it('rejects filter config missing condition', () => {
      const errors = validateTransformConfig('filter', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/condition/i);
    });

    it('rejects filter config with non-string condition', () => {
      const errors = validateTransformConfig('filter', { condition: 123 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/string/i);
    });
  });

  describe('validateTransformConfig - map', () => {
    it('validates correct map config', () => {
      const errors = validateTransformConfig('map', {
        mappings: { fullName: 'firstName + " " + lastName' },
      });
      expect(errors).toEqual([]);
    });

    it('rejects map config missing mappings', () => {
      const errors = validateTransformConfig('map', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/mappings/i);
    });

    it('rejects map config with non-object mappings', () => {
      const errors = validateTransformConfig('map', { mappings: 'invalid' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/object/i);
    });
  });

  describe('validateTransformConfig - aggregate', () => {
    it('validates correct aggregate config', () => {
      const errors = validateTransformConfig('aggregate', {
        groupBy: ['category'],
        aggregations: { totalSales: 'SUM(amount)' },
      });
      expect(errors).toEqual([]);
    });

    it('rejects aggregate config missing groupBy', () => {
      const errors = validateTransformConfig('aggregate', {
        aggregations: { totalSales: 'SUM(amount)' },
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/groupBy/i);
    });

    it('rejects aggregate config with non-array groupBy', () => {
      const errors = validateTransformConfig('aggregate', {
        groupBy: 'category',
        aggregations: { totalSales: 'SUM(amount)' },
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/array/i);
    });
  });

  describe('validateTransformConfig - join', () => {
    it('validates correct join config', () => {
      const errors = validateTransformConfig('join', {
        leftKey: 'id',
        rightKey: 'userId',
        joinType: 'inner',
      });
      expect(errors).toEqual([]);
    });

    it('rejects join config with invalid joinType', () => {
      const errors = validateTransformConfig('join', {
        leftKey: 'id',
        rightKey: 'userId',
        joinType: 'invalid',
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/inner|left|right|full/i);
    });

    it('rejects join config missing required fields', () => {
      const errors = validateTransformConfig('join', { leftKey: 'id' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/rightKey|joinType/i);
    });
  });

  describe('validateTransformConfig - dedupe', () => {
    it('validates correct dedupe config', () => {
      const errors = validateTransformConfig('dedupe', {
        keys: ['email'],
        keepFirst: true,
      });
      expect(errors).toEqual([]);
    });

    it('validates dedupe config without optional keepFirst', () => {
      const errors = validateTransformConfig('dedupe', { keys: ['email'] });
      expect(errors).toEqual([]);
    });

    it('rejects dedupe config missing keys', () => {
      const errors = validateTransformConfig('dedupe', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/keys/i);
    });
  });

  describe('validateTransformConfig - sort', () => {
    it('validates correct sort config', () => {
      const errors = validateTransformConfig('sort', {
        fields: ['name', '-age'],
      });
      expect(errors).toEqual([]);
    });

    it('rejects sort config missing fields', () => {
      const errors = validateTransformConfig('sort', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/fields/i);
    });
  });

  describe('validateTransformConfig - limit', () => {
    it('validates correct limit config', () => {
      const errors = validateTransformConfig('limit', {
        count: 100,
        offset: 10,
      });
      expect(errors).toEqual([]);
    });

    it('validates limit config without optional offset', () => {
      const errors = validateTransformConfig('limit', { count: 100 });
      expect(errors).toEqual([]);
    });

    it('rejects limit config with non-number count', () => {
      const errors = validateTransformConfig('limit', { count: '100' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/number/i);
    });
  });

  describe('validateTransformConfig - select', () => {
    it('validates correct select config', () => {
      const errors = validateTransformConfig('select', {
        fields: ['name', 'email', 'age'],
      });
      expect(errors).toEqual([]);
    });

    it('rejects select config missing fields', () => {
      const errors = validateTransformConfig('select', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/fields/i);
    });
  });

  describe('validateTransformConfig - rename', () => {
    it('validates correct rename config', () => {
      const errors = validateTransformConfig('rename', {
        mappings: { oldName: 'newName', firstName: 'givenName' },
      });
      expect(errors).toEqual([]);
    });

    it('rejects rename config missing mappings', () => {
      const errors = validateTransformConfig('rename', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/mappings/i);
    });
  });

  describe('validateTransformConfig - union', () => {
    it('validates correct union config', () => {
      const errors = validateTransformConfig('union', {
        deduplicateAfter: true,
      });
      expect(errors).toEqual([]);
    });

    it('validates union config with no properties (all optional)', () => {
      const errors = validateTransformConfig('union', {});
      expect(errors).toEqual([]);
    });
  });

  describe('validateTransformConfig - unknown transform', () => {
    it('returns error for unknown transform name', () => {
      const errors = validateTransformConfig('nonexistent', {});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/unknown/i);
    });
  });

  describe('validateTransformConfig - invalid config object', () => {
    it('rejects null config', () => {
      const errors = validateTransformConfig('filter', null);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/object/i);
    });

    it('rejects non-object config', () => {
      const errors = validateTransformConfig('filter', 'invalid');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(' ')).toMatch(/object/i);
    });
  });
});


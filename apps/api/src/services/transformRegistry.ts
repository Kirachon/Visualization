/**
 * Transform Registry
 * 
 * Provides a catalog of available transform operations for ETL pipelines.
 * Each transform has a name, description, and configuration schema.
 * Validation logic ensures transform configs are correct before execution.
 */

export interface TransformConfigSchema {
  type: 'object';
  required?: string[];
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: any[];
    items?: any;
  }>;
}

export interface TransformDefinition {
  name: string;
  description: string;
  configSchema: TransformConfigSchema;
  /**
   * Validate a config object against this transform's schema.
   * Returns array of error messages (empty if valid).
   */
  validate: (config: any) => string[];
}

/**
 * Simple JSON schema validator for transform configs.
 * Returns array of error messages (empty if valid).
 */
function validateConfig(config: any, schema: TransformConfigSchema, transformName: string): string[] {
  const errors: string[] = [];
  
  if (!config || typeof config !== 'object') {
    return [`${transformName} config must be an object`];
  }
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in config)) {
        errors.push(`${transformName} missing required field: ${field}`);
      }
    }
  }
  
  // Check field types and enums
  for (const [field, fieldSchema] of Object.entries(schema.properties)) {
    if (field in config) {
      const value = config[field];
      const expectedType = fieldSchema.type;
      
      // Type checking
      if (expectedType === 'string' && typeof value !== 'string') {
        errors.push(`${transformName}.${field} must be a string`);
      } else if (expectedType === 'number' && typeof value !== 'number') {
        errors.push(`${transformName}.${field} must be a number`);
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${transformName}.${field} must be a boolean`);
      } else if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`${transformName}.${field} must be an array`);
      } else if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`${transformName}.${field} must be an object`);
      }
      
      // Enum validation
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(`${transformName}.${field} must be one of: ${fieldSchema.enum.join(', ')}`);
      }
    }
  }
  
  return errors;
}

// Transform definitions
const transforms: Record<string, TransformDefinition> = {
  filter: {
    name: 'filter',
    description: 'Filter rows based on a condition expression',
    configSchema: {
      type: 'object',
      required: ['condition'],
      properties: {
        condition: {
          type: 'string',
          description: 'Boolean expression to filter rows (e.g., "age > 18")',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.filter.configSchema, 'filter'),
  },
  
  map: {
    name: 'map',
    description: 'Transform each row by applying expressions to fields',
    configSchema: {
      type: 'object',
      required: ['mappings'],
      properties: {
        mappings: {
          type: 'object',
          description: 'Field mappings (e.g., {"fullName": "firstName + \' \' + lastName"})',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.map.configSchema, 'map'),
  },
  
  aggregate: {
    name: 'aggregate',
    description: 'Group rows and compute aggregations',
    configSchema: {
      type: 'object',
      required: ['groupBy', 'aggregations'],
      properties: {
        groupBy: {
          type: 'array',
          description: 'Fields to group by',
        },
        aggregations: {
          type: 'object',
          description: 'Aggregation functions (e.g., {"totalSales": "SUM(amount)"})',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.aggregate.configSchema, 'aggregate'),
  },
  
  join: {
    name: 'join',
    description: 'Join two datasets on specified keys',
    configSchema: {
      type: 'object',
      required: ['leftKey', 'rightKey', 'joinType'],
      properties: {
        leftKey: {
          type: 'string',
          description: 'Key field from left dataset',
        },
        rightKey: {
          type: 'string',
          description: 'Key field from right dataset',
        },
        joinType: {
          type: 'string',
          description: 'Type of join',
          enum: ['inner', 'left', 'right', 'full'],
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.join.configSchema, 'join'),
  },
  
  dedupe: {
    name: 'dedupe',
    description: 'Remove duplicate rows based on specified fields',
    configSchema: {
      type: 'object',
      required: ['keys'],
      properties: {
        keys: {
          type: 'array',
          description: 'Fields to use for deduplication',
        },
        keepFirst: {
          type: 'boolean',
          description: 'Keep first occurrence (true) or last (false)',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.dedupe.configSchema, 'dedupe'),
  },
  
  sort: {
    name: 'sort',
    description: 'Sort rows by specified fields',
    configSchema: {
      type: 'object',
      required: ['fields'],
      properties: {
        fields: {
          type: 'array',
          description: 'Fields to sort by (e.g., ["name", "-age"] for descending age)',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.sort.configSchema, 'sort'),
  },
  
  limit: {
    name: 'limit',
    description: 'Limit the number of rows',
    configSchema: {
      type: 'object',
      required: ['count'],
      properties: {
        count: {
          type: 'number',
          description: 'Maximum number of rows to return',
        },
        offset: {
          type: 'number',
          description: 'Number of rows to skip',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.limit.configSchema, 'limit'),
  },
  
  select: {
    name: 'select',
    description: 'Select specific fields from rows',
    configSchema: {
      type: 'object',
      required: ['fields'],
      properties: {
        fields: {
          type: 'array',
          description: 'Fields to include in output',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.select.configSchema, 'select'),
  },
  
  rename: {
    name: 'rename',
    description: 'Rename fields in rows',
    configSchema: {
      type: 'object',
      required: ['mappings'],
      properties: {
        mappings: {
          type: 'object',
          description: 'Field rename mappings (e.g., {"oldName": "newName"})',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.rename.configSchema, 'rename'),
  },
  
  union: {
    name: 'union',
    description: 'Combine rows from multiple datasets',
    configSchema: {
      type: 'object',
      properties: {
        deduplicateAfter: {
          type: 'boolean',
          description: 'Remove duplicates after union',
        },
      },
    },
    validate: (config) => validateConfig(config, transforms.union.configSchema, 'union'),
  },
};

/**
 * Get a transform definition by name.
 * Returns undefined if not found.
 */
export function getTransform(name: string): TransformDefinition | undefined {
  return transforms[name];
}

/**
 * List all available transforms.
 * Returns array of transform definitions.
 */
export function listTransforms(): TransformDefinition[] {
  return Object.values(transforms);
}

/**
 * Validate a transform node's config against its registered definition.
 * Returns array of error messages (empty if valid).
 */
export function validateTransformConfig(transformName: string, config: any): string[] {
  const transform = getTransform(transformName);
  if (!transform) {
    return [`Unknown transform: ${transformName}`];
  }
  return transform.validate(config);
}


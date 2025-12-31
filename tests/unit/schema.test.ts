/**
 * @file Schema validation tests
 * @description Tests for JSON Schema validation using AJV
 *
 * Tests cover:
 * - Schema registration and retrieval
 * - Node validation against registered schemas
 * - Edge validation against registered schemas
 * - Validation error handling and reporting
 * - Custom error classes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SchemaRegistry,
  Validator,
  ValidationError,
  SchemaNotFoundError,
  InvalidSchemaError,
  type ValidationResult,
  type SchemaDefinition,
} from '../../src/schema/index.js';
import type { Node, Edge } from '../../src/types/index.js';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry();
  });

  describe('registerNodeSchema', () => {
    it('should register a schema for a node type', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      registry.registerNodeSchema('Person', personSchema);

      expect(registry.hasNodeSchema('Person')).toBe(true);
    });

    it('should allow overwriting an existing schema', () => {
      const schemaV1: SchemaDefinition = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };

      const schemaV2: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
      };

      registry.registerNodeSchema('Person', schemaV1);
      registry.registerNodeSchema('Person', schemaV2);

      const schema = registry.getNodeSchema('Person');
      expect(schema).toEqual(schemaV2);
    });
  });

  describe('registerEdgeSchema', () => {
    it('should register a schema for an edge type', () => {
      const knowsSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          since: { type: 'string' },
          strength: { type: 'number', minimum: 0, maximum: 1 },
        },
      };

      registry.registerEdgeSchema('KNOWS', knowsSchema);

      expect(registry.hasEdgeSchema('KNOWS')).toBe(true);
    });
  });

  describe('getNodeSchema', () => {
    it('should return the registered schema for a node type', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      registry.registerNodeSchema('Person', personSchema);

      expect(registry.getNodeSchema('Person')).toEqual(personSchema);
    });

    it('should return undefined for unregistered node type', () => {
      expect(registry.getNodeSchema('Unknown')).toBeUndefined();
    });
  });

  describe('getEdgeSchema', () => {
    it('should return the registered schema for an edge type', () => {
      const knowsSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          since: { type: 'string' },
        },
      };

      registry.registerEdgeSchema('KNOWS', knowsSchema);

      expect(registry.getEdgeSchema('KNOWS')).toEqual(knowsSchema);
    });

    it('should return undefined for unregistered edge type', () => {
      expect(registry.getEdgeSchema('UNKNOWN')).toBeUndefined();
    });
  });

  describe('hasNodeSchema', () => {
    it('should return true for registered node types', () => {
      registry.registerNodeSchema('Person', { type: 'object' });
      expect(registry.hasNodeSchema('Person')).toBe(true);
    });

    it('should return false for unregistered node types', () => {
      expect(registry.hasNodeSchema('Unknown')).toBe(false);
    });
  });

  describe('hasEdgeSchema', () => {
    it('should return true for registered edge types', () => {
      registry.registerEdgeSchema('KNOWS', { type: 'object' });
      expect(registry.hasEdgeSchema('KNOWS')).toBe(true);
    });

    it('should return false for unregistered edge types', () => {
      expect(registry.hasEdgeSchema('UNKNOWN')).toBe(false);
    });
  });

  describe('removeNodeSchema', () => {
    it('should remove a registered node schema', () => {
      registry.registerNodeSchema('Person', { type: 'object' });
      expect(registry.hasNodeSchema('Person')).toBe(true);

      registry.removeNodeSchema('Person');
      expect(registry.hasNodeSchema('Person')).toBe(false);
    });

    it('should not throw when removing non-existent schema', () => {
      expect(() => registry.removeNodeSchema('Unknown')).not.toThrow();
    });
  });

  describe('removeEdgeSchema', () => {
    it('should remove a registered edge schema', () => {
      registry.registerEdgeSchema('KNOWS', { type: 'object' });
      expect(registry.hasEdgeSchema('KNOWS')).toBe(true);

      registry.removeEdgeSchema('KNOWS');
      expect(registry.hasEdgeSchema('KNOWS')).toBe(false);
    });
  });

  describe('listNodeTypes', () => {
    it('should return all registered node types', () => {
      registry.registerNodeSchema('Person', { type: 'object' });
      registry.registerNodeSchema('Company', { type: 'object' });
      registry.registerNodeSchema('Product', { type: 'object' });

      const types = registry.listNodeTypes();
      expect(types).toHaveLength(3);
      expect(types).toContain('Person');
      expect(types).toContain('Company');
      expect(types).toContain('Product');
    });

    it('should return empty array when no schemas registered', () => {
      expect(registry.listNodeTypes()).toEqual([]);
    });
  });

  describe('listEdgeTypes', () => {
    it('should return all registered edge types', () => {
      registry.registerEdgeSchema('KNOWS', { type: 'object' });
      registry.registerEdgeSchema('WORKS_AT', { type: 'object' });

      const types = registry.listEdgeTypes();
      expect(types).toHaveLength(2);
      expect(types).toContain('KNOWS');
      expect(types).toContain('WORKS_AT');
    });
  });

  describe('clear', () => {
    it('should remove all registered schemas', () => {
      registry.registerNodeSchema('Person', { type: 'object' });
      registry.registerNodeSchema('Company', { type: 'object' });
      registry.registerEdgeSchema('WORKS_AT', { type: 'object' });

      registry.clear();

      expect(registry.listNodeTypes()).toEqual([]);
      expect(registry.listEdgeTypes()).toEqual([]);
    });
  });
});

describe('Validator', () => {
  let registry: SchemaRegistry;
  let validator: Validator;

  beforeEach(() => {
    registry = new SchemaRegistry();
    validator = new Validator(registry);
  });

  describe('validateNode', () => {
    it('should return valid result for node matching schema', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
        additionalProperties: true,
      };

      registry.registerNodeSchema('Person', personSchema);

      const node: Node<{ name: string; age: number }> = {
        id: 'person-1',
        type: 'Person',
        properties: { name: 'Alice', age: 30 },
      };

      const result = validator.validateNode(node);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid result for node missing required properties', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      };

      registry.registerNodeSchema('Person', personSchema);

      const node: Node<{ name: string }> = {
        id: 'person-1',
        type: 'Person',
        properties: { name: 'Alice' },
      };

      const result = validator.validateNode(node);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('age');
    });

    it('should return invalid result for node with wrong property type', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      registry.registerNodeSchema('Person', personSchema);

      const node: Node<{ name: string; age: string }> = {
        id: 'person-1',
        type: 'Person',
        properties: { name: 'Alice', age: 'thirty' as unknown as string },
      };

      const result = validator.validateNode(node);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should pass validation when no schema is registered (permissive mode)', () => {
      const node: Node<{ anything: string }> = {
        id: 'node-1',
        type: 'Unregistered',
        properties: { anything: 'goes' },
      };

      const result = validator.validateNode(node);

      expect(result.valid).toBe(true);
    });

    it('should fail validation when no schema and strict mode is enabled', () => {
      const strictValidator = new Validator(registry, { strict: true });

      const node: Node<{ anything: string }> = {
        id: 'node-1',
        type: 'Unregistered',
        properties: { anything: 'goes' },
      };

      const result = strictValidator.validateNode(node);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('No schema registered');
    });

    it('should validate complex nested schemas', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              zipCode: { type: 'string', pattern: '^\\d{5}$' },
            },
            required: ['city'],
          },
        },
        required: ['name'],
      };

      registry.registerNodeSchema('Person', personSchema);

      const validNode: Node = {
        id: 'person-1',
        type: 'Person',
        properties: {
          name: 'Alice',
          address: { city: 'New York', street: '123 Main St', zipCode: '10001' },
        },
      };

      const invalidNode: Node = {
        id: 'person-2',
        type: 'Person',
        properties: {
          name: 'Bob',
          address: { street: '456 Oak Ave', zipCode: 'invalid' },
        },
      };

      expect(validator.validateNode(validNode).valid).toBe(true);

      const result = validator.validateNode(invalidNode);
      expect(result.valid).toBe(false);
    });

    it('should validate array properties', () => {
      const personSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
        },
        required: ['name', 'tags'],
      };

      registry.registerNodeSchema('Person', personSchema);

      const validNode: Node = {
        id: 'person-1',
        type: 'Person',
        properties: { name: 'Alice', tags: ['developer', 'designer'] },
      };

      const invalidNode: Node = {
        id: 'person-2',
        type: 'Person',
        properties: { name: 'Bob', tags: [] },
      };

      expect(validator.validateNode(validNode).valid).toBe(true);
      expect(validator.validateNode(invalidNode).valid).toBe(false);
    });
  });

  describe('validateEdge', () => {
    it('should return valid result for edge matching schema', () => {
      const knowsSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          since: { type: 'string' },
          strength: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['since'],
      };

      registry.registerEdgeSchema('KNOWS', knowsSchema);

      const edge: Edge<{ since: string; strength: number }> = {
        id: 'edge-1',
        type: 'KNOWS',
        source: 'person-1',
        target: 'person-2',
        properties: { since: '2020-01-01', strength: 0.8 },
      };

      const result = validator.validateEdge(edge);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid result for edge missing required properties', () => {
      const knowsSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          since: { type: 'string' },
        },
        required: ['since'],
      };

      registry.registerEdgeSchema('KNOWS', knowsSchema);

      const edge: Edge<Record<string, never>> = {
        id: 'edge-1',
        type: 'KNOWS',
        source: 'person-1',
        target: 'person-2',
        properties: {},
      };

      const result = validator.validateEdge(edge);

      expect(result.valid).toBe(false);
    });

    it('should validate numeric constraints', () => {
      const ratedSchema: SchemaDefinition = {
        type: 'object',
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
        },
        required: ['rating'],
      };

      registry.registerEdgeSchema('RATED', ratedSchema);

      const validEdge: Edge<{ rating: number }> = {
        id: 'edge-1',
        type: 'RATED',
        source: 'user-1',
        target: 'product-1',
        properties: { rating: 4 },
      };

      const invalidEdge: Edge<{ rating: number }> = {
        id: 'edge-2',
        type: 'RATED',
        source: 'user-1',
        target: 'product-2',
        properties: { rating: 10 },
      };

      expect(validator.validateEdge(validEdge).valid).toBe(true);
      expect(validator.validateEdge(invalidEdge).valid).toBe(false);
    });

    it('should pass validation when no schema is registered (permissive mode)', () => {
      const edge: Edge<{ custom: string }> = {
        id: 'edge-1',
        type: 'UNREGISTERED',
        source: 'a',
        target: 'b',
        properties: { custom: 'value' },
      };

      const result = validator.validateEdge(edge);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateNodeOrThrow', () => {
    it('should not throw for valid node', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      registry.registerNodeSchema('Person', schema);

      const node: Node<{ name: string }> = {
        id: 'person-1',
        type: 'Person',
        properties: { name: 'Alice' },
      };

      expect(() => validator.validateNodeOrThrow(node)).not.toThrow();
    });

    it('should throw ValidationError for invalid node', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      registry.registerNodeSchema('Person', schema);

      const node: Node<Record<string, never>> = {
        id: 'person-1',
        type: 'Person',
        properties: {},
      };

      expect(() => validator.validateNodeOrThrow(node)).toThrow(ValidationError);
    });

    it('should include validation details in thrown error', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      registry.registerNodeSchema('Person', schema);

      const node: Node<Record<string, never>> = {
        id: 'person-1',
        type: 'Person',
        properties: {},
      };

      try {
        validator.validateNodeOrThrow(node);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.length).toBeGreaterThan(0);
        expect(validationError.entityId).toBe('person-1');
        expect(validationError.entityType).toBe('Person');
      }
    });
  });

  describe('validateEdgeOrThrow', () => {
    it('should not throw for valid edge', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { weight: { type: 'number' } },
      };

      registry.registerEdgeSchema('LINKS', schema);

      const edge: Edge<{ weight: number }> = {
        id: 'edge-1',
        type: 'LINKS',
        source: 'a',
        target: 'b',
        properties: { weight: 1.5 },
      };

      expect(() => validator.validateEdgeOrThrow(edge)).not.toThrow();
    });

    it('should throw ValidationError for invalid edge', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { weight: { type: 'number' } },
        required: ['weight'],
      };

      registry.registerEdgeSchema('LINKS', schema);

      const edge: Edge<Record<string, never>> = {
        id: 'edge-1',
        type: 'LINKS',
        source: 'a',
        target: 'b',
        properties: {},
      };

      expect(() => validator.validateEdgeOrThrow(edge)).toThrow(ValidationError);
    });
  });
});

describe('ValidationResult', () => {
  it('should have correct structure for valid result', () => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
    };

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should have correct structure for invalid result', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [
        {
          path: '/properties/name',
          message: "must have required property 'name'",
          keyword: 'required',
        },
      ],
    };

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe('/properties/name');
    expect(result.errors[0].message).toContain('name');
    expect(result.errors[0].keyword).toBe('required');
  });
});

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should have correct error name', () => {
      const error = new ValidationError(
        'Validation failed',
        [{ path: '/name', message: 'required', keyword: 'required' }],
        'node-1',
        'Person'
      );

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
    });

    it('should include validation errors', () => {
      const errors = [
        { path: '/name', message: 'required', keyword: 'required' },
        { path: '/age', message: 'must be number', keyword: 'type' },
      ];

      const error = new ValidationError('Validation failed', errors, 'node-1', 'Person');

      expect(error.errors).toEqual(errors);
      expect(error.errors).toHaveLength(2);
    });

    it('should include entity information', () => {
      const error = new ValidationError(
        'Validation failed',
        [],
        'person-123',
        'Person'
      );

      expect(error.entityId).toBe('person-123');
      expect(error.entityType).toBe('Person');
    });

    it('should be instanceof Error', () => {
      const error = new ValidationError('test', [], 'id', 'type');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('SchemaNotFoundError', () => {
    it('should have correct error name', () => {
      const error = new SchemaNotFoundError('Person', 'node');

      expect(error.name).toBe('SchemaNotFoundError');
    });

    it('should include schema type and entity kind', () => {
      const error = new SchemaNotFoundError('KNOWS', 'edge');

      expect(error.schemaType).toBe('KNOWS');
      expect(error.entityKind).toBe('edge');
    });

    it('should have descriptive message', () => {
      const error = new SchemaNotFoundError('Person', 'node');

      expect(error.message).toContain('Person');
      expect(error.message).toContain('node');
    });

    it('should be instanceof Error', () => {
      const error = new SchemaNotFoundError('Type', 'node');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SchemaNotFoundError);
    });
  });
});

describe('Schema Definition Types', () => {
  it('should support basic JSON Schema types', () => {
    const registry = new SchemaRegistry();

    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        stringProp: { type: 'string' },
        numberProp: { type: 'number' },
        booleanProp: { type: 'boolean' },
        nullProp: { type: 'null' },
        arrayProp: { type: 'array', items: { type: 'string' } },
        objectProp: {
          type: 'object',
          properties: {
            nested: { type: 'string' },
          },
        },
      },
    };

    expect(() => registry.registerNodeSchema('Complex', schema)).not.toThrow();
  });

  it('should support JSON Schema formats', () => {
    const registry = new SchemaRegistry();
    const validator = new Validator(registry, { validateFormats: true });

    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        date: { type: 'string', format: 'date' },
        uri: { type: 'string', format: 'uri' },
      },
    };

    registry.registerNodeSchema('Contact', schema);

    const validNode: Node = {
      id: 'contact-1',
      type: 'Contact',
      properties: {
        email: 'test@example.com',
        date: '2023-12-30',
        uri: 'https://example.com',
      },
    };

    const invalidNode: Node = {
      id: 'contact-2',
      type: 'Contact',
      properties: {
        email: 'not-an-email',
        date: 'not-a-date',
        uri: 'not-a-uri',
      },
    };

    expect(validator.validateNode(validNode).valid).toBe(true);
    expect(validator.validateNode(invalidNode).valid).toBe(false);
  });

  it('should support enum constraints', () => {
    const registry = new SchemaRegistry();
    const validator = new Validator(registry);

    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      },
      required: ['status'],
    };

    registry.registerNodeSchema('Account', schema);

    const validNode: Node = {
      id: 'account-1',
      type: 'Account',
      properties: { status: 'active' },
    };

    const invalidNode: Node = {
      id: 'account-2',
      type: 'Account',
      properties: { status: 'unknown' },
    };

    expect(validator.validateNode(validNode).valid).toBe(true);
    expect(validator.validateNode(invalidNode).valid).toBe(false);
  });

  it('should support string constraints', () => {
    const registry = new SchemaRegistry();
    const validator = new Validator(registry);

    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          minLength: 3,
          maxLength: 20,
          pattern: '^[a-zA-Z0-9_]+$',
        },
      },
      required: ['username'],
    };

    registry.registerNodeSchema('User', schema);

    const validNode: Node = {
      id: 'user-1',
      type: 'User',
      properties: { username: 'alice_123' },
    };

    const tooShort: Node = {
      id: 'user-2',
      type: 'User',
      properties: { username: 'ab' },
    };

    const invalidPattern: Node = {
      id: 'user-3',
      type: 'User',
      properties: { username: 'alice@123' },
    };

    expect(validator.validateNode(validNode).valid).toBe(true);
    expect(validator.validateNode(tooShort).valid).toBe(false);
    expect(validator.validateNode(invalidPattern).valid).toBe(false);
  });
});

describe('Validator Cache Management', () => {
  let registry: SchemaRegistry;
  let validator: Validator;

  beforeEach(() => {
    registry = new SchemaRegistry();
    validator = new Validator(registry);
  });

  describe('clearCache', () => {
    it('should clear all cached validators', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };

      registry.registerNodeSchema('Person', schema);
      registry.registerEdgeSchema('KNOWS', schema);

      // First validation compiles and caches the validator
      const node: Node = { id: 'n1', type: 'Person', properties: { name: 'Alice' } };
      const edge: Edge = { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: { name: 'test' } };

      validator.validateNode(node);
      validator.validateEdge(edge);

      // Clear cache and re-validate (should recompile)
      validator.clearCache();

      const result1 = validator.validateNode(node);
      const result2 = validator.validateEdge(edge);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('clearCacheForType', () => {
    it('should clear cache for specific node type', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };

      registry.registerNodeSchema('Person', schema);

      const node: Node = { id: 'n1', type: 'Person', properties: { name: 'Alice' } };
      validator.validateNode(node);

      // Clear only node cache for Person
      validator.clearCacheForType('Person', 'node');

      const result = validator.validateNode(node);
      expect(result.valid).toBe(true);
    });

    it('should clear cache for specific edge type', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { weight: { type: 'number' } },
      };

      registry.registerEdgeSchema('LINKS', schema);

      const edge: Edge = { id: 'e1', type: 'LINKS', source: 'a', target: 'b', properties: { weight: 1 } };
      validator.validateEdge(edge);

      // Clear only edge cache for LINKS
      validator.clearCacheForType('LINKS', 'edge');

      const result = validator.validateEdge(edge);
      expect(result.valid).toBe(true);
    });

    it('should clear cache for both node and edge types by default', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: { data: { type: 'string' } },
      };

      registry.registerNodeSchema('Item', schema);
      registry.registerEdgeSchema('Item', schema);

      const node: Node = { id: 'n1', type: 'Item', properties: { data: 'test' } };
      const edge: Edge = { id: 'e1', type: 'Item', source: 'a', target: 'b', properties: { data: 'test' } };

      validator.validateNode(node);
      validator.validateEdge(edge);

      // Clear both caches for Item (default behavior)
      validator.clearCacheForType('Item');

      expect(validator.validateNode(node).valid).toBe(true);
      expect(validator.validateEdge(edge).valid).toBe(true);
    });
  });
});

describe('Strict Mode Edge Validation', () => {
  it('should fail validation when no schema and strict mode is enabled for edges', () => {
    const registry = new SchemaRegistry();
    const strictValidator = new Validator(registry, { strict: true });

    const edge: Edge = {
      id: 'edge-1',
      type: 'UNREGISTERED',
      source: 'a',
      target: 'b',
      properties: { anything: 'goes' },
    };

    const result = strictValidator.validateEdge(edge);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('No schema registered');
  });
});

describe('ValidationError Advanced', () => {
  describe('toDetailedString', () => {
    it('should return formatted string with all error details', () => {
      const errors = [
        { path: '/name', message: 'is required', keyword: 'required' },
        { path: '/age', message: 'must be number', keyword: 'type' },
      ];

      const error = new ValidationError(
        'Validation failed for Person',
        errors,
        'person-123',
        'Person'
      );

      const detailed = error.toDetailedString();

      expect(detailed).toContain('Validation failed for Person');
      expect(detailed).toContain('Entity ID: person-123');
      expect(detailed).toContain('Entity Type: Person');
      expect(detailed).toContain('/name: is required (required)');
      expect(detailed).toContain('/age: must be number (type)');
    });

    it('should handle empty errors array', () => {
      const error = new ValidationError(
        'Empty validation error',
        [],
        'node-1',
        'Type'
      );

      const detailed = error.toDetailedString();

      expect(detailed).toContain('Empty validation error');
      expect(detailed).toContain('Entity ID: node-1');
      expect(detailed).toContain('Errors:');
    });
  });
});

describe('InvalidSchemaError', () => {
  it('should have correct error name', () => {
    const error = new InvalidSchemaError('Person', 'Invalid JSON Schema syntax');

    expect(error.name).toBe('InvalidSchemaError');
  });

  it('should include schema type and reason', () => {
    const error = new InvalidSchemaError('Address', 'Missing type field');

    expect(error.schemaType).toBe('Address');
    expect(error.reason).toBe('Missing type field');
  });

  it('should have descriptive message', () => {
    const error = new InvalidSchemaError('Person', 'Properties must be an object');

    expect(error.message).toContain('Person');
    expect(error.message).toContain('Properties must be an object');
  });

  it('should be instanceof Error', () => {
    const error = new InvalidSchemaError('Type', 'reason');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(InvalidSchemaError);
  });
});

describe('SchemaRegistry Size Properties', () => {
  it('should return correct size for combined schemas', () => {
    const registry = new SchemaRegistry();

    expect(registry.size).toBe(0);

    registry.registerNodeSchema('Person', { type: 'object' });
    expect(registry.size).toBe(1);

    registry.registerNodeSchema('Company', { type: 'object' });
    expect(registry.size).toBe(2);

    registry.registerEdgeSchema('KNOWS', { type: 'object' });
    expect(registry.size).toBe(3);
  });

  it('should return correct nodeSchemaCount', () => {
    const registry = new SchemaRegistry();

    expect(registry.nodeSchemaCount).toBe(0);

    registry.registerNodeSchema('Person', { type: 'object' });
    registry.registerNodeSchema('Company', { type: 'object' });

    expect(registry.nodeSchemaCount).toBe(2);
  });

  it('should return correct edgeSchemaCount', () => {
    const registry = new SchemaRegistry();

    expect(registry.edgeSchemaCount).toBe(0);

    registry.registerEdgeSchema('KNOWS', { type: 'object' });
    registry.registerEdgeSchema('WORKS_AT', { type: 'object' });
    registry.registerEdgeSchema('OWNS', { type: 'object' });

    expect(registry.edgeSchemaCount).toBe(3);
  });
});

/**
 * @file Bundle module tests
 * @description Unit tests for JSON bundle serialization (import/export)
 *
 * @module tests/unit/bundle
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Bundle,
  BundleMetadata,
  exportBundle,
  importBundle,
  validateBundle,
  BundleValidationResult,
  BUNDLE_VERSION,
} from '../../src/bundle/index.js';
import { MemoryStorage } from '../../src/storage/index.js';
import { SchemaRegistry } from '../../src/schema/index.js';
import type { Node, Edge, GraphData } from '../../src/types/index.js';
import type { SchemaDefinition } from '../../src/schema/index.js';

describe('Bundle module', () => {
  let storage: MemoryStorage;
  let schemaRegistry: SchemaRegistry;

  beforeEach(() => {
    storage = new MemoryStorage();
    schemaRegistry = new SchemaRegistry();
  });

  describe('Bundle type definition', () => {
    it('should define Bundle with version field', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
      };
      expect(bundle.version).toBe('1.0.0');
    });

    it('should define Bundle with nodes and edges', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: { name: 'Alice' } },
        ],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} },
        ],
      };
      expect(bundle.nodes).toHaveLength(1);
      expect(bundle.edges).toHaveLength(1);
    });

    it('should define Bundle with optional schemas', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: {
          nodes: {
            Person: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          },
          edges: {
            KNOWS: {
              type: 'object',
              properties: { since: { type: 'string' } },
            },
          },
        },
      };
      expect(bundle.schemas?.nodes?.Person).toBeDefined();
      expect(bundle.schemas?.edges?.KNOWS).toBeDefined();
    });

    it('should define Bundle with optional metadata', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        metadata: {
          createdAt: '2025-12-30T00:00:00Z',
          name: 'Test Bundle',
          description: 'A test bundle',
          custom: { author: 'Test' },
        },
      };
      expect(bundle.metadata?.name).toBe('Test Bundle');
      expect(bundle.metadata?.createdAt).toBeDefined();
    });

    it('should export BUNDLE_VERSION constant as 1.0.0', () => {
      expect(BUNDLE_VERSION).toBe('1.0.0');
    });
  });

  describe('exportBundle()', () => {
    it('should export empty storage as bundle with version', () => {
      const bundle = exportBundle(storage);
      expect(bundle.version).toBe('1.0.0');
      expect(bundle.nodes).toEqual([]);
      expect(bundle.edges).toEqual([]);
    });

    it('should export nodes from storage', () => {
      storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
      storage.addNode({ id: 'n2', type: 'Person', properties: { name: 'Bob' } });

      const bundle = exportBundle(storage);
      expect(bundle.nodes).toHaveLength(2);
      expect(bundle.nodes.find((n) => n.id === 'n1')).toBeDefined();
      expect(bundle.nodes.find((n) => n.id === 'n2')).toBeDefined();
    });

    it('should export edges from storage', () => {
      storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
      storage.addNode({ id: 'n2', type: 'Person', properties: { name: 'Bob' } });
      storage.addEdge({
        id: 'e1',
        type: 'KNOWS',
        source: 'n1',
        target: 'n2',
        properties: { since: '2020' },
      });

      const bundle = exportBundle(storage);
      expect(bundle.edges).toHaveLength(1);
      expect(bundle.edges[0]).toEqual({
        id: 'e1',
        type: 'KNOWS',
        source: 'n1',
        target: 'n2',
        properties: { since: '2020' },
      });
    });

    it('should export schemas from registry', () => {
      schemaRegistry.registerNodeSchema('Person', {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      });
      schemaRegistry.registerEdgeSchema('KNOWS', {
        type: 'object',
        properties: { since: { type: 'string' } },
      });

      const bundle = exportBundle(storage, { schemaRegistry });
      expect(bundle.schemas?.nodes?.Person).toBeDefined();
      expect(bundle.schemas?.edges?.KNOWS).toBeDefined();
    });

    it('should export without schemas when registry not provided', () => {
      storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });

      const bundle = exportBundle(storage);
      expect(bundle.schemas).toBeUndefined();
    });

    it('should include metadata when provided', () => {
      const metadata: BundleMetadata = {
        name: 'Test Bundle',
        description: 'A bundle for testing',
        createdAt: '2025-12-30T00:00:00Z',
      };

      const bundle = exportBundle(storage, { metadata });
      expect(bundle.metadata?.name).toBe('Test Bundle');
      expect(bundle.metadata?.description).toBe('A bundle for testing');
    });

    it('should auto-generate createdAt in metadata if not provided', () => {
      const bundle = exportBundle(storage, { metadata: { name: 'Test' } });
      expect(bundle.metadata?.createdAt).toBeDefined();
      // Should be a valid ISO date string
      expect(() => new Date(bundle.metadata!.createdAt!)).not.toThrow();
    });

    it('should preserve node properties types', () => {
      storage.addNode({
        id: 'n1',
        type: 'Data',
        properties: {
          string: 'test',
          number: 42,
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
          null: null,
        },
      });

      const bundle = exportBundle(storage);
      const node = bundle.nodes.find((n) => n.id === 'n1');
      expect(node?.properties).toEqual({
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
      });
    });
  });

  describe('importBundle()', () => {
    it('should import empty bundle into storage', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
      };

      importBundle(storage, bundle);
      expect(storage.nodeCount()).toBe(0);
      expect(storage.edgeCount()).toBe(0);
    });

    it('should import nodes into storage', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: { name: 'Alice' } },
          { id: 'n2', type: 'Person', properties: { name: 'Bob' } },
        ],
        edges: [],
      };

      importBundle(storage, bundle);
      expect(storage.nodeCount()).toBe(2);
      expect(storage.getNode('n1')?.properties).toEqual({ name: 'Alice' });
      expect(storage.getNode('n2')?.properties).toEqual({ name: 'Bob' });
    });

    it('should import edges into storage', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: { name: 'Alice' } },
          { id: 'n2', type: 'Person', properties: { name: 'Bob' } },
        ],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} },
        ],
      };

      importBundle(storage, bundle);
      expect(storage.edgeCount()).toBe(1);
      expect(storage.getEdge('e1')).toBeDefined();
    });

    it('should import schemas into registry', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: {
          nodes: {
            Person: {
              type: 'object',
              properties: { name: { type: 'string' } },
            },
          },
          edges: {
            KNOWS: {
              type: 'object',
              properties: { since: { type: 'string' } },
            },
          },
        },
      };

      importBundle(storage, bundle, { schemaRegistry });
      expect(schemaRegistry.hasNodeSchema('Person')).toBe(true);
      expect(schemaRegistry.hasEdgeSchema('KNOWS')).toBe(true);
    });

    it('should clear storage before import by default', () => {
      storage.addNode({ id: 'existing', type: 'Old', properties: {} });

      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [{ id: 'new', type: 'New', properties: {} }],
        edges: [],
      };

      importBundle(storage, bundle);
      expect(storage.hasNode('existing')).toBe(false);
      expect(storage.hasNode('new')).toBe(true);
    });

    it('should merge with existing data when merge option is true', () => {
      storage.addNode({ id: 'existing', type: 'Old', properties: {} });

      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [{ id: 'new', type: 'New', properties: {} }],
        edges: [],
      };

      importBundle(storage, bundle, { merge: true });
      expect(storage.hasNode('existing')).toBe(true);
      expect(storage.hasNode('new')).toBe(true);
    });

    it('should throw on duplicate node IDs during merge', () => {
      storage.addNode({ id: 'n1', type: 'Old', properties: {} });

      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 'New', properties: {} }],
        edges: [],
      };

      expect(() => importBundle(storage, bundle, { merge: true })).toThrow();
    });

    it('should throw on invalid edge references', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 'Person', properties: {} }],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n999', properties: {} },
        ],
      };

      expect(() => importBundle(storage, bundle)).toThrow();
    });

    it('should return imported counts', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} },
        ],
      };

      const result = importBundle(storage, bundle);
      expect(result.nodesImported).toBe(2);
      expect(result.edgesImported).toBe(1);
    });

    it('should return schemas imported count', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: {
          nodes: { Person: { type: 'object' } },
          edges: { KNOWS: { type: 'object' } },
        },
      };

      const result = importBundle(storage, bundle, { schemaRegistry });
      expect(result.schemasImported).toBe(2);
    });
  });

  describe('validateBundle()', () => {
    it('should validate a correct bundle as valid', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: { name: 'Alice' } },
          { id: 'n2', type: 'Person', properties: { name: 'Bob' } },
        ],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} },
        ],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing version', () => {
      const bundle = {
        nodes: [],
        edges: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('version'))).toBe(true);
    });

    it('should detect invalid version format', () => {
      const bundle: Bundle = {
        version: 'invalid' as '1.0.0',
        nodes: [],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('version'))).toBe(true);
    });

    it('should detect missing nodes array', () => {
      const bundle = {
        version: '1.0.0',
        edges: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('nodes'))).toBe(true);
    });

    it('should detect missing edges array', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('edges'))).toBe(true);
    });

    it('should detect node without id', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ type: 'Person', properties: {} }],
        edges: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('nodes[0]'))).toBe(true);
    });

    it('should detect node without type', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', properties: {} }],
        edges: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('nodes[0]'))).toBe(true);
    });

    it('should detect node without properties', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 'Person' }],
        edges: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('nodes[0]'))).toBe(true);
    });

    it('should detect duplicate node IDs', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n1', type: 'Person', properties: {} },
        ],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.toLowerCase().includes('duplicate'))).toBe(true);
    });

    it('should detect edge without id', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ type: 'KNOWS', source: 'n1', target: 'n2', properties: {} }],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('edges[0]'))).toBe(true);
    });

    it('should detect edge with missing source node', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 'Person', properties: {} }],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n999', target: 'n1', properties: {} },
        ],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('source'))).toBe(true);
    });

    it('should detect edge with missing target node', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 'Person', properties: {} }],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n999', properties: {} },
        ],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('target'))).toBe(true);
    });

    it('should detect duplicate edge IDs', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [
          { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} },
          { id: 'e1', type: 'KNOWS', source: 'n2', target: 'n1', properties: {} },
        ],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.toLowerCase().includes('duplicate'))).toBe(true);
    });

    it('should validate schemas structure', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: {
          nodes: {
            Person: { type: 'object' },
          },
          edges: {
            KNOWS: { type: 'object' },
          },
        },
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(true);
    });

    it('should provide detailed error information', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1' }], // missing type and properties
        edges: [],
      } as unknown as Bundle;

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('path');
      expect(result.errors[0]).toHaveProperty('message');
    });
  });

  describe('BundleValidationResult', () => {
    it('should provide warnings array for non-critical issues', () => {
      const bundle: Bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Round-trip serialization', () => {
    it('should preserve data through export and import', () => {
      // Set up initial data
      storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice', age: 30 } });
      storage.addNode({ id: 'n2', type: 'Person', properties: { name: 'Bob', age: 25 } });
      storage.addEdge({
        id: 'e1',
        type: 'KNOWS',
        source: 'n1',
        target: 'n2',
        properties: { since: '2020' },
      });

      schemaRegistry.registerNodeSchema('Person', {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      });

      // Export
      const bundle = exportBundle(storage, { schemaRegistry });

      // Import into fresh storage
      const newStorage = new MemoryStorage();
      const newRegistry = new SchemaRegistry();
      importBundle(newStorage, bundle, { schemaRegistry: newRegistry });

      // Verify data preserved
      expect(newStorage.nodeCount()).toBe(2);
      expect(newStorage.edgeCount()).toBe(1);
      expect(newStorage.getNode('n1')?.properties).toEqual({ name: 'Alice', age: 30 });
      expect(newRegistry.hasNodeSchema('Person')).toBe(true);
    });

    it('should handle JSON serialization correctly', () => {
      storage.addNode({
        id: 'n1',
        type: 'Complex',
        properties: {
          nested: { deep: { value: [1, 2, 3] } },
          date: '2025-12-30T00:00:00Z',
          nullValue: null,
        },
      });

      const bundle = exportBundle(storage);
      const json = JSON.stringify(bundle);
      const parsed = JSON.parse(json) as Bundle;

      const newStorage = new MemoryStorage();
      importBundle(newStorage, parsed);

      const node = newStorage.getNode('n1');
      expect(node?.properties.nested).toEqual({ deep: { value: [1, 2, 3] } });
      expect(node?.properties.nullValue).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty schema registries', () => {
      const bundle = exportBundle(storage, { schemaRegistry: new SchemaRegistry() });
      expect(bundle.schemas).toBeUndefined();
    });

    it('should handle nodes with empty properties', () => {
      storage.addNode({ id: 'n1', type: 'Empty', properties: {} });

      const bundle = exportBundle(storage);
      expect(bundle.nodes[0].properties).toEqual({});
    });

    it('should handle self-referencing edges', () => {
      storage.addNode({ id: 'n1', type: 'Node', properties: {} });
      storage.addEdge({
        id: 'e1',
        type: 'SELF',
        source: 'n1',
        target: 'n1',
        properties: {},
      });

      const bundle = exportBundle(storage);
      const result = validateBundle(bundle);
      expect(result.valid).toBe(true);
    });

    it('should handle special characters in string properties', () => {
      storage.addNode({
        id: 'n1',
        type: 'Special',
        properties: {
          text: 'Hello "World"! \\n Tab:\t Newline:\n Unicode: \u00e9',
        },
      });

      const bundle = exportBundle(storage);
      const json = JSON.stringify(bundle);
      const parsed = JSON.parse(json) as Bundle;

      const newStorage = new MemoryStorage();
      importBundle(newStorage, parsed);

      const node = newStorage.getNode('n1');
      expect(node?.properties.text).toBe(
        'Hello "World"! \\n Tab:\t Newline:\n Unicode: \u00e9'
      );
    });

    it('should handle large numbers correctly', () => {
      storage.addNode({
        id: 'n1',
        type: 'Numbers',
        properties: {
          large: Number.MAX_SAFE_INTEGER,
          small: Number.MIN_SAFE_INTEGER,
          float: 3.14159265358979,
        },
      });

      const bundle = exportBundle(storage);
      const newStorage = new MemoryStorage();
      importBundle(newStorage, bundle);

      const node = newStorage.getNode('n1');
      expect(node?.properties.large).toBe(Number.MAX_SAFE_INTEGER);
      expect(node?.properties.small).toBe(Number.MIN_SAFE_INTEGER);
      expect(node?.properties.float).toBe(3.14159265358979);
    });
  });

  describe('Validator edge cases', () => {
    it('should reject null as bundle', () => {
      const result = validateBundle(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Bundle must be an object');
    });

    it('should reject non-object as bundle', () => {
      const result = validateBundle('not an object');
      expect(result.valid).toBe(false);
    });

    it('should reject nodes array with non-object elements', () => {
      const bundle = {
        version: '1.0.0',
        nodes: ['not an object'],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Node must be an object')).toBe(true);
    });

    it('should reject edges array with non-object elements', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
        edges: ['not an object'],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Edge must be an object')).toBe(true);
    });

    it('should reject node with non-string id', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ id: 123, type: 'Person', properties: {} }],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Node id must be a string')).toBe(true);
    });

    it('should reject node with non-string type', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 123, properties: {} }],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Node type must be a string')).toBe(true);
    });

    it('should reject node with null properties', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [{ id: 'n1', type: 'Person', properties: null }],
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Node properties must be an object')).toBe(true);
    });

    it('should reject edge with non-string id', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 123, type: 'KNOWS', source: 'n1', target: 'n2', properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Edge id must be a string')).toBe(true);
    });

    it('should reject edge with non-string type', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 123, source: 'n1', target: 'n2', properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Edge type must be a string')).toBe(true);
    });

    it('should reject edge with non-string source', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 'KNOWS', source: 123, target: 'n2', properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Edge source must be a string')).toBe(true);
    });

    it('should reject edge with non-string target', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 'KNOWS', source: 'n1', target: 123, properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Edge target must be a string')).toBe(true);
    });

    it('should reject edge with null properties', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: null }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'Edge properties must be an object')).toBe(true);
    });

    it('should reject non-array nodes', () => {
      const bundle = {
        version: '1.0.0',
        nodes: 'not an array',
        edges: [],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'nodes must be an array')).toBe(true);
    });

    it('should reject non-array edges', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
        edges: 'not an array',
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'edges must be an array')).toBe(true);
    });

    it('should reject non-object schemas', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: 'not an object',
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'schemas must be an object')).toBe(true);
    });

    it('should reject non-object schemas.nodes', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: {
          nodes: 'not an object',
        },
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'schemas.nodes must be an object')).toBe(true);
    });

    it('should reject non-object schemas.edges', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        schemas: {
          edges: 'not an object',
        },
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'schemas.edges must be an object')).toBe(true);
    });

    it('should reject non-object metadata', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [],
        edges: [],
        metadata: 'not an object',
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message === 'metadata must be an object')).toBe(true);
    });

    it('should handle edge with missing type field', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2', properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('type'))).toBe(true);
    });

    it('should handle edge with missing source field', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 'KNOWS', target: 'n2', properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('source'))).toBe(true);
    });

    it('should handle edge with missing target field', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 'KNOWS', source: 'n1', properties: {} }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('target'))).toBe(true);
    });

    it('should handle edge with missing properties field', () => {
      const bundle = {
        version: '1.0.0',
        nodes: [
          { id: 'n1', type: 'Person', properties: {} },
          { id: 'n2', type: 'Person', properties: {} },
        ],
        edges: [{ id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2' }],
      };

      const result = validateBundle(bundle);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('properties'))).toBe(true);
    });
  });
});

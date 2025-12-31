/**
 * @file Integration tests for the Graph class
 * @description Comprehensive end-to-end tests for the Graph API
 *
 * @module tests/integration/graph
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from '../../src/core/Graph.js';
import type { Node, Edge, Relationship, NodeFilter, EdgeFilter } from '../../src/types/index.js';
import type { SchemaDefinition } from '../../src/schema/index.js';
import type { TraverseOptions, FindPathOptions } from '../../src/operations/index.js';
import { TraverseDirection } from '../../src/operations/index.js';

/**
 * Test fixtures and helpers
 */
interface PersonProps {
  name: string;
  age: number;
}

interface CompanyProps {
  name: string;
  industry: string;
}

interface KnowsProps {
  since: string;
  strength: number;
}

interface WorksAtProps {
  role: string;
  startDate: string;
}

const personSchema: SchemaDefinition = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'number', minimum: 0 },
  },
  required: ['name'],
};

const companySchema: SchemaDefinition = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    industry: { type: 'string' },
  },
  required: ['name'],
};

const knowsSchema: SchemaDefinition = {
  type: 'object',
  properties: {
    since: { type: 'string' },
    strength: { type: 'number', minimum: 0, maximum: 1 },
  },
};

const worksAtSchema: SchemaDefinition = {
  type: 'object',
  properties: {
    role: { type: 'string' },
    startDate: { type: 'string' },
  },
  required: ['role'],
};

describe('Graph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  // ============================================================
  // Construction and Configuration
  // ============================================================

  describe('constructor', () => {
    it('should create an empty graph', () => {
      expect(graph.nodeCount).toBe(0);
      expect(graph.edgeCount).toBe(0);
    });

    it('should accept optional configuration', () => {
      const configuredGraph = new Graph({
        strictValidation: true,
        validateFormats: true,
      });
      expect(configuredGraph.nodeCount).toBe(0);
    });
  });

  // ============================================================
  // Node Operations
  // ============================================================

  describe('node operations', () => {
    describe('addNode', () => {
      it('should add a node to the graph', () => {
        const node: Node<PersonProps> = {
          id: 'person-1',
          type: 'Person',
          properties: { name: 'Alice', age: 30 },
        };

        graph.addNode(node);

        expect(graph.nodeCount).toBe(1);
        expect(graph.hasNode('person-1')).toBe(true);
      });

      it('should throw if node ID already exists', () => {
        const node: Node<PersonProps> = {
          id: 'person-1',
          type: 'Person',
          properties: { name: 'Alice', age: 30 },
        };

        graph.addNode(node);

        expect(() => graph.addNode(node)).toThrow();
      });

      it('should validate node against registered schema', () => {
        graph.registerSchema('Person', personSchema);

        const validNode: Node<PersonProps> = {
          id: 'person-1',
          type: 'Person',
          properties: { name: 'Alice', age: 30 },
        };

        expect(() => graph.addNode(validNode)).not.toThrow();

        const invalidNode: Node<Record<string, unknown>> = {
          id: 'person-2',
          type: 'Person',
          properties: { age: 30 }, // missing required 'name'
        };

        const strictGraph = new Graph({ strictValidation: true });
        strictGraph.registerSchema('Person', personSchema);
        expect(() => strictGraph.addNode(invalidNode)).toThrow();
      });
    });

    describe('getNode', () => {
      it('should return a node by ID', () => {
        const node: Node<PersonProps> = {
          id: 'person-1',
          type: 'Person',
          properties: { name: 'Alice', age: 30 },
        };

        graph.addNode(node);

        const retrieved = graph.getNode('person-1');
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe('person-1');
        expect(retrieved?.properties).toEqual({ name: 'Alice', age: 30 });
      });

      it('should return undefined for non-existent node', () => {
        expect(graph.getNode('non-existent')).toBeUndefined();
      });
    });

    describe('removeNode', () => {
      it('should remove a node from the graph', () => {
        graph.addNode({
          id: 'person-1',
          type: 'Person',
          properties: { name: 'Alice', age: 30 },
        });

        expect(graph.removeNode('person-1')).toBe(true);
        expect(graph.hasNode('person-1')).toBe(false);
        expect(graph.nodeCount).toBe(0);
      });

      it('should return false for non-existent node', () => {
        expect(graph.removeNode('non-existent')).toBe(false);
      });

      it('should remove connected edges when node is removed', () => {
        graph.addNode({ id: 'n1', type: 'Person', properties: { name: 'A', age: 25 } });
        graph.addNode({ id: 'n2', type: 'Person', properties: { name: 'B', age: 30 } });
        graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} });

        expect(graph.edgeCount).toBe(1);
        graph.removeNode('n1');
        expect(graph.edgeCount).toBe(0);
      });
    });

    describe('findNodes', () => {
      beforeEach(() => {
        graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'Alice', age: 30 } });
        graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'Bob', age: 25 } });
        graph.addNode({ id: 'c1', type: 'Company', properties: { name: 'Acme', industry: 'Tech' } });
      });

      it('should return all nodes when no filter provided', () => {
        const nodes = graph.findNodes();
        expect(nodes).toHaveLength(3);
      });

      it('should filter by type', () => {
        const people = graph.findNodes({ type: 'Person' });
        expect(people).toHaveLength(2);
        expect(people.every((n) => n.type === 'Person')).toBe(true);
      });

      it('should filter by ID', () => {
        const nodes = graph.findNodes({ id: 'p1' });
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('p1');
      });

      it('should filter by properties', () => {
        const nodes = graph.findNodes({ properties: { age: 30 } });
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('p1');
      });

      it('should combine filters with AND logic', () => {
        const nodes = graph.findNodes({ type: 'Person', properties: { age: 25 } });
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('p2');
      });
    });
  });

  // ============================================================
  // Edge Operations
  // ============================================================

  describe('edge operations', () => {
    beforeEach(() => {
      graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'Alice', age: 30 } });
      graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'Bob', age: 25 } });
      graph.addNode({ id: 'p3', type: 'Person', properties: { name: 'Carol', age: 35 } });
    });

    describe('addEdge', () => {
      it('should add an edge between existing nodes', () => {
        const edge: Edge<KnowsProps> = {
          id: 'e1',
          type: 'KNOWS',
          source: 'p1',
          target: 'p2',
          properties: { since: '2020-01-01', strength: 0.8 },
        };

        graph.addEdge(edge);

        expect(graph.edgeCount).toBe(1);
        expect(graph.hasEdge('e1')).toBe(true);
      });

      it('should throw if source node does not exist', () => {
        const edge: Edge<KnowsProps> = {
          id: 'e1',
          type: 'KNOWS',
          source: 'non-existent',
          target: 'p2',
          properties: { since: '2020-01-01', strength: 0.8 },
        };

        expect(() => graph.addEdge(edge)).toThrow();
      });

      it('should throw if target node does not exist', () => {
        const edge: Edge<KnowsProps> = {
          id: 'e1',
          type: 'KNOWS',
          source: 'p1',
          target: 'non-existent',
          properties: { since: '2020-01-01', strength: 0.8 },
        };

        expect(() => graph.addEdge(edge)).toThrow();
      });

      it('should throw if edge ID already exists', () => {
        graph.addEdge({
          id: 'e1',
          type: 'KNOWS',
          source: 'p1',
          target: 'p2',
          properties: {},
        });

        expect(() =>
          graph.addEdge({
            id: 'e1',
            type: 'KNOWS',
            source: 'p2',
            target: 'p3',
            properties: {},
          })
        ).toThrow();
      });
    });

    describe('getEdge', () => {
      it('should return an edge by ID', () => {
        graph.addEdge({
          id: 'e1',
          type: 'KNOWS',
          source: 'p1',
          target: 'p2',
          properties: { since: '2020' },
        });

        const edge = graph.getEdge('e1');
        expect(edge).toBeDefined();
        expect(edge?.id).toBe('e1');
        expect(edge?.source).toBe('p1');
        expect(edge?.target).toBe('p2');
      });

      it('should return undefined for non-existent edge', () => {
        expect(graph.getEdge('non-existent')).toBeUndefined();
      });
    });

    describe('removeEdge', () => {
      it('should remove an edge from the graph', () => {
        graph.addEdge({
          id: 'e1',
          type: 'KNOWS',
          source: 'p1',
          target: 'p2',
          properties: {},
        });

        expect(graph.removeEdge('e1')).toBe(true);
        expect(graph.hasEdge('e1')).toBe(false);
        expect(graph.edgeCount).toBe(0);
      });

      it('should return false for non-existent edge', () => {
        expect(graph.removeEdge('non-existent')).toBe(false);
      });
    });

    describe('findEdges', () => {
      beforeEach(() => {
        graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'p1', target: 'p2', properties: {} });
        graph.addEdge({ id: 'e2', type: 'KNOWS', source: 'p2', target: 'p3', properties: {} });
        graph.addEdge({ id: 'e3', type: 'WORKS_WITH', source: 'p1', target: 'p3', properties: {} });
      });

      it('should return all edges when no filter provided', () => {
        const edges = graph.findEdges();
        expect(edges).toHaveLength(3);
      });

      it('should filter by type', () => {
        const edges = graph.findEdges({ type: 'KNOWS' });
        expect(edges).toHaveLength(2);
        expect(edges.every((e) => e.type === 'KNOWS')).toBe(true);
      });

      it('should filter by source', () => {
        const edges = graph.findEdges({ source: 'p1' });
        expect(edges).toHaveLength(2);
      });

      it('should filter by target', () => {
        const edges = graph.findEdges({ target: 'p3' });
        expect(edges).toHaveLength(2);
      });

      it('should combine filters with AND logic', () => {
        const edges = graph.findEdges({ type: 'KNOWS', source: 'p1' });
        expect(edges).toHaveLength(1);
        expect(edges[0].id).toBe('e1');
      });
    });
  });

  // ============================================================
  // Schema Operations
  // ============================================================

  describe('schema operations', () => {
    describe('registerSchema', () => {
      it('should register a schema for a node type', () => {
        graph.registerSchema('Person', personSchema);
        expect(graph.hasSchema('Person')).toBe(true);
      });

      it('should overwrite existing schema', () => {
        graph.registerSchema('Person', personSchema);
        graph.registerSchema('Person', { type: 'object' });
        expect(graph.hasSchema('Person')).toBe(true);
      });
    });

    describe('registerEdgeSchema', () => {
      it('should register a schema for an edge type', () => {
        graph.registerEdgeSchema('KNOWS', knowsSchema);
        expect(graph.hasEdgeSchema('KNOWS')).toBe(true);
      });
    });

    describe('registerRelationship', () => {
      it('should register a relationship constraint', () => {
        const relationship: Relationship = {
          type: 'KNOWS',
          sourceType: 'Person',
          targetType: 'Person',
        };

        graph.registerRelationship(relationship);
        expect(graph.hasRelationship('KNOWS')).toBe(true);
      });

      it('should validate edges against relationship constraints', () => {
        graph.registerSchema('Person', personSchema);
        graph.registerSchema('Company', companySchema);

        graph.registerRelationship({
          type: 'KNOWS',
          sourceType: 'Person',
          targetType: 'Person',
        });

        graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'Alice', age: 30 } });
        graph.addNode({ id: 'c1', type: 'Company', properties: { name: 'Acme', industry: 'Tech' } });

        // This should work in permissive mode but log warning
        // In strict mode, this would throw
        graph.addEdge({
          id: 'e1',
          type: 'KNOWS',
          source: 'p1',
          target: 'c1',
          properties: {},
        });

        expect(graph.hasEdge('e1')).toBe(true);
      });
    });

    describe('validation with strict mode', () => {
      it('should reject invalid nodes in strict mode', () => {
        const strictGraph = new Graph({ strictValidation: true });
        strictGraph.registerSchema('Person', personSchema);

        expect(() =>
          strictGraph.addNode({
            id: 'p1',
            type: 'Person',
            properties: { age: -5 }, // missing name, invalid age
          })
        ).toThrow();
      });

      it('should reject invalid edges in strict mode', () => {
        const strictGraph = new Graph({ strictValidation: true });
        // Register Person schema so nodes can be added in strict mode
        strictGraph.registerSchema('Person', {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name'],
        });
        strictGraph.registerEdgeSchema('KNOWS', {
          type: 'object',
          properties: {
            strength: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['strength'],
        });

        strictGraph.addNode({ id: 'p1', type: 'Person', properties: { name: 'A', age: 20 } });
        strictGraph.addNode({ id: 'p2', type: 'Person', properties: { name: 'B', age: 25 } });

        expect(() =>
          strictGraph.addEdge({
            id: 'e1',
            type: 'KNOWS',
            source: 'p1',
            target: 'p2',
            properties: { strength: 2 }, // invalid: > 1
          })
        ).toThrow();
      });
    });
  });

  // ============================================================
  // Graph Operations
  // ============================================================

  describe('graph operations', () => {
    /**
     * Test graph structure:
     *
     *   A --KNOWS--> B --KNOWS--> C
     *   |            |
     *   +--KNOWS---->D--KNOWS--->E
     */
    beforeEach(() => {
      graph.addNode({ id: 'A', type: 'Person', properties: { name: 'A', age: 25 } });
      graph.addNode({ id: 'B', type: 'Person', properties: { name: 'B', age: 30 } });
      graph.addNode({ id: 'C', type: 'Person', properties: { name: 'C', age: 35 } });
      graph.addNode({ id: 'D', type: 'Person', properties: { name: 'D', age: 40 } });
      graph.addNode({ id: 'E', type: 'Person', properties: { name: 'E', age: 45 } });

      graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'A', target: 'B', properties: {} });
      graph.addEdge({ id: 'e2', type: 'KNOWS', source: 'B', target: 'C', properties: {} });
      graph.addEdge({ id: 'e3', type: 'KNOWS', source: 'A', target: 'D', properties: {} });
      graph.addEdge({ id: 'e4', type: 'KNOWS', source: 'B', target: 'D', properties: {} });
      graph.addEdge({ id: 'e5', type: 'KNOWS', source: 'D', target: 'E', properties: {} });
    });

    describe('traverse', () => {
      it('should traverse all reachable nodes from start', () => {
        const visited = graph.traverse('A');
        expect(visited).toContain('A');
        expect(visited).toContain('B');
        expect(visited).toContain('C');
        expect(visited).toContain('D');
        expect(visited).toContain('E');
      });

      it('should respect maxDepth option', () => {
        const visited = graph.traverse('A', { maxDepth: 1 });
        expect(visited).toContain('A');
        expect(visited).toContain('B');
        expect(visited).toContain('D');
        expect(visited).not.toContain('C');
        expect(visited).not.toContain('E');
      });

      it('should respect direction option', () => {
        const outgoing = graph.traverse('B', { direction: TraverseDirection.Outgoing });
        expect(outgoing).toContain('B');
        expect(outgoing).toContain('C');
        expect(outgoing).toContain('D');
        expect(outgoing).not.toContain('A');

        const incoming = graph.traverse('B', { direction: TraverseDirection.Incoming });
        expect(incoming).toContain('B');
        expect(incoming).toContain('A');
        expect(incoming).not.toContain('C');
      });

      it('should throw for non-existent start node', () => {
        expect(() => graph.traverse('non-existent')).toThrow();
      });
    });

    describe('findPath', () => {
      it('should find shortest path between nodes', () => {
        const path = graph.findPath('A', 'E');
        expect(path).toBeDefined();
        expect(path).toEqual(['A', 'D', 'E']);
      });

      it('should return null when no path exists', () => {
        // Add isolated node
        graph.addNode({ id: 'Z', type: 'Person', properties: { name: 'Z', age: 50 } });
        const path = graph.findPath('A', 'Z');
        expect(path).toBeNull();
      });

      it('should return single node path for same source and target', () => {
        const path = graph.findPath('A', 'A');
        expect(path).toEqual(['A']);
      });

      it('should respect maxDepth option', () => {
        const path = graph.findPath('A', 'E', { maxDepth: 1 });
        expect(path).toBeNull(); // No path within depth 1
      });

      it('should throw for non-existent nodes', () => {
        expect(() => graph.findPath('non-existent', 'A')).toThrow();
        expect(() => graph.findPath('A', 'non-existent')).toThrow();
      });
    });
  });

  // ============================================================
  // Bundle Operations
  // ============================================================

  describe('bundle operations', () => {
    beforeEach(() => {
      graph.registerSchema('Person', personSchema);
      graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'Alice', age: 30 } });
      graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'Bob', age: 25 } });
      graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'p1', target: 'p2', properties: {} });
    });

    describe('export', () => {
      it('should export graph to bundle', () => {
        const bundle = graph.export();

        expect(bundle.version).toBe('1.0.0');
        expect(bundle.nodes).toHaveLength(2);
        expect(bundle.edges).toHaveLength(1);
      });

      it('should include schemas in export', () => {
        const bundle = graph.export({ includeSchemas: true });

        expect(bundle.schemas).toBeDefined();
        expect(bundle.schemas?.nodes?.Person).toBeDefined();
      });

      it('should include metadata in export', () => {
        const bundle = graph.export({
          metadata: { name: 'Test Graph', description: 'A test graph' },
        });

        expect(bundle.metadata).toBeDefined();
        expect(bundle.metadata?.name).toBe('Test Graph');
      });
    });

    describe('import', () => {
      it('should import bundle into empty graph', () => {
        const bundle = graph.export({ includeSchemas: true });

        const newGraph = new Graph();
        const result = newGraph.import(bundle);

        expect(result.nodesImported).toBe(2);
        expect(result.edgesImported).toBe(1);
        expect(newGraph.nodeCount).toBe(2);
        expect(newGraph.edgeCount).toBe(1);
      });

      it('should import schemas from bundle', () => {
        const bundle = graph.export({ includeSchemas: true });

        const newGraph = new Graph();
        const result = newGraph.import(bundle, { importSchemas: true });

        expect(result.schemasImported).toBeGreaterThan(0);
        expect(newGraph.hasSchema('Person')).toBe(true);
      });

      it('should merge with existing data when merge option is true', () => {
        const bundle = graph.export();

        const newGraph = new Graph();
        newGraph.addNode({ id: 'existing', type: 'Other', properties: {} });

        newGraph.import(bundle, { merge: true });

        expect(newGraph.hasNode('existing')).toBe(true);
        expect(newGraph.hasNode('p1')).toBe(true);
        expect(newGraph.nodeCount).toBe(3);
      });

      it('should throw on duplicate IDs when merging', () => {
        const bundle = graph.export();

        const newGraph = new Graph();
        newGraph.addNode({ id: 'p1', type: 'Other', properties: {} });

        expect(() => newGraph.import(bundle, { merge: true })).toThrow();
      });

      it('should clear existing data by default', () => {
        const bundle = graph.export();

        const newGraph = new Graph();
        newGraph.addNode({ id: 'existing', type: 'Other', properties: {} });

        newGraph.import(bundle);

        expect(newGraph.hasNode('existing')).toBe(false);
        expect(newGraph.hasNode('p1')).toBe(true);
      });
    });
  });

  // ============================================================
  // Utility Methods
  // ============================================================

  describe('utility methods', () => {
    describe('clear', () => {
      it('should remove all nodes and edges', () => {
        graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'A', age: 20 } });
        graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'B', age: 25 } });
        graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'p1', target: 'p2', properties: {} });

        graph.clear();

        expect(graph.nodeCount).toBe(0);
        expect(graph.edgeCount).toBe(0);
      });
    });

    describe('nodeCount and edgeCount', () => {
      it('should return correct counts', () => {
        expect(graph.nodeCount).toBe(0);
        expect(graph.edgeCount).toBe(0);

        graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'A', age: 20 } });
        expect(graph.nodeCount).toBe(1);

        graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'B', age: 25 } });
        expect(graph.nodeCount).toBe(2);

        graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'p1', target: 'p2', properties: {} });
        expect(graph.edgeCount).toBe(1);
      });
    });

    describe('hasNode and hasEdge', () => {
      it('should correctly check existence', () => {
        graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'A', age: 20 } });
        graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'B', age: 25 } });
        graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'p1', target: 'p2', properties: {} });

        expect(graph.hasNode('p1')).toBe(true);
        expect(graph.hasNode('non-existent')).toBe(false);
        expect(graph.hasEdge('e1')).toBe(true);
        expect(graph.hasEdge('non-existent')).toBe(false);
      });
    });
  });

  // ============================================================
  // End-to-End Scenarios
  // ============================================================

  describe('end-to-end scenarios', () => {
    it('should support a complete social network workflow', () => {
      // 1. Set up schemas
      graph.registerSchema('Person', personSchema);
      graph.registerSchema('Company', companySchema);
      graph.registerEdgeSchema('KNOWS', knowsSchema);
      graph.registerEdgeSchema('WORKS_AT', worksAtSchema);

      // 2. Register relationships
      graph.registerRelationship({
        type: 'KNOWS',
        sourceType: 'Person',
        targetType: 'Person',
      });
      graph.registerRelationship({
        type: 'WORKS_AT',
        sourceType: 'Person',
        targetType: 'Company',
      });

      // 3. Add nodes
      graph.addNode({ id: 'alice', type: 'Person', properties: { name: 'Alice', age: 30 } });
      graph.addNode({ id: 'bob', type: 'Person', properties: { name: 'Bob', age: 25 } });
      graph.addNode({ id: 'carol', type: 'Person', properties: { name: 'Carol', age: 35 } });
      graph.addNode({ id: 'acme', type: 'Company', properties: { name: 'Acme', industry: 'Tech' } });

      // 4. Add edges
      graph.addEdge({
        id: 'e1',
        type: 'KNOWS',
        source: 'alice',
        target: 'bob',
        properties: { since: '2020-01-01', strength: 0.9 },
      });
      graph.addEdge({
        id: 'e2',
        type: 'KNOWS',
        source: 'bob',
        target: 'carol',
        properties: { since: '2021-06-15', strength: 0.7 },
      });
      graph.addEdge({
        id: 'e3',
        type: 'WORKS_AT',
        source: 'alice',
        target: 'acme',
        properties: { role: 'Engineer', startDate: '2019-03-01' },
      });
      graph.addEdge({
        id: 'e4',
        type: 'WORKS_AT',
        source: 'bob',
        target: 'acme',
        properties: { role: 'Manager', startDate: '2018-01-15' },
      });

      // 5. Query the graph
      const people = graph.findNodes({ type: 'Person' });
      expect(people).toHaveLength(3);

      const acmeEmployees = graph.findEdges({ type: 'WORKS_AT', target: 'acme' });
      expect(acmeEmployees).toHaveLength(2);

      // 6. Traverse
      const aliceNetwork = graph.traverse('alice');
      expect(aliceNetwork).toContain('bob');
      expect(aliceNetwork).toContain('carol');
      expect(aliceNetwork).toContain('acme');

      // 7. Find path
      const pathToCarol = graph.findPath('alice', 'carol');
      expect(pathToCarol).toEqual(['alice', 'bob', 'carol']);

      // 8. Export
      const bundle = graph.export({
        includeSchemas: true,
        metadata: { name: 'Social Network', createdAt: '2025-12-30T00:00:00Z' },
      });
      expect(bundle.nodes).toHaveLength(4);
      expect(bundle.edges).toHaveLength(4);
      expect(bundle.schemas?.nodes?.Person).toBeDefined();

      // 9. Import into new graph
      const newGraph = new Graph();
      const result = newGraph.import(bundle, { importSchemas: true });
      expect(result.nodesImported).toBe(4);
      expect(result.edgesImported).toBe(4);
      expect(newGraph.hasSchema('Person')).toBe(true);

      // 10. Verify imported graph
      const importedPath = newGraph.findPath('alice', 'carol');
      expect(importedPath).toEqual(['alice', 'bob', 'carol']);
    });

    it('should handle graph modifications correctly', () => {
      // Build initial graph
      graph.addNode({ id: 'n1', type: 'Person', properties: { name: 'Node1', age: 20 } });
      graph.addNode({ id: 'n2', type: 'Person', properties: { name: 'Node2', age: 25 } });
      graph.addNode({ id: 'n3', type: 'Person', properties: { name: 'Node3', age: 30 } });
      graph.addEdge({ id: 'e1', type: 'LINK', source: 'n1', target: 'n2', properties: {} });
      graph.addEdge({ id: 'e2', type: 'LINK', source: 'n2', target: 'n3', properties: {} });

      // Path exists initially
      expect(graph.findPath('n1', 'n3')).toEqual(['n1', 'n2', 'n3']);

      // Remove middle node
      graph.removeNode('n2');

      // Path no longer exists
      expect(graph.findPath('n1', 'n3')).toBeNull();

      // Add new path
      graph.addEdge({ id: 'e3', type: 'LINK', source: 'n1', target: 'n3', properties: {} });
      expect(graph.findPath('n1', 'n3')).toEqual(['n1', 'n3']);
    });

    it('should support cyclic graphs', () => {
      graph.addNode({ id: 'a', type: 'Node', properties: {} });
      graph.addNode({ id: 'b', type: 'Node', properties: {} });
      graph.addNode({ id: 'c', type: 'Node', properties: {} });
      graph.addEdge({ id: 'e1', type: 'NEXT', source: 'a', target: 'b', properties: {} });
      graph.addEdge({ id: 'e2', type: 'NEXT', source: 'b', target: 'c', properties: {} });
      graph.addEdge({ id: 'e3', type: 'NEXT', source: 'c', target: 'a', properties: {} }); // cycle

      // Traverse should handle cycles without infinite loop
      const visited = graph.traverse('a');
      expect(visited).toHaveLength(3);
      expect(visited).toContain('a');
      expect(visited).toContain('b');
      expect(visited).toContain('c');
    });
  });
});

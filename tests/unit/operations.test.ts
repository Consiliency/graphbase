/**
 * Unit tests for graph operations.
 *
 * @module tests/unit/operations
 *
 * @remarks
 * Tests cover all graph operation functions:
 * - Query operations: findNodes(), findEdges()
 * - Traversal operations: traverse(), neighbors(), degree()
 * - Path operations: findPath()
 * - Subgraph operations: subgraph()
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from '../../src/storage/index.js';
import type { Storage } from '../../src/storage/index.js';
import type { Node, Edge } from '../../src/types/index.js';

// Import operations to be implemented
import {
  findNodes,
  findEdges,
  traverse,
  neighbors,
  degree,
  findPath,
  subgraph,
  TraverseDirection,
} from '../../src/operations/index.js';

describe('Graph Operations', () => {
  let storage: Storage;

  /**
   * Test graph structure:
   *
   *     A --KNOWS--> B --KNOWS--> C
   *     |            |
   *   OWNS         KNOWS
   *     |            |
   *     v            v
   *     D            E --WORKS_WITH--> F
   *
   * Node types: A,B,C = Person; D,E,F = Asset
   */
  beforeEach(() => {
    storage = new MemoryStorage();

    // Add Person nodes
    storage.addNode({ id: 'A', type: 'Person', properties: { name: 'Alice', age: 30 } });
    storage.addNode({ id: 'B', type: 'Person', properties: { name: 'Bob', age: 25 } });
    storage.addNode({ id: 'C', type: 'Person', properties: { name: 'Charlie', age: 35 } });

    // Add Asset nodes
    storage.addNode({ id: 'D', type: 'Asset', properties: { name: 'Car', value: 20000 } });
    storage.addNode({ id: 'E', type: 'Asset', properties: { name: 'House', value: 500000 } });
    storage.addNode({ id: 'F', type: 'Asset', properties: { name: 'Boat', value: 50000 } });

    // Add edges
    storage.addEdge({ id: 'e1', type: 'KNOWS', source: 'A', target: 'B', properties: { since: 2020 } });
    storage.addEdge({ id: 'e2', type: 'KNOWS', source: 'B', target: 'C', properties: { since: 2021 } });
    storage.addEdge({ id: 'e3', type: 'OWNS', source: 'A', target: 'D', properties: { purchaseYear: 2022 } });
    storage.addEdge({ id: 'e4', type: 'KNOWS', source: 'B', target: 'E', properties: { since: 2019 } });
    storage.addEdge({ id: 'e5', type: 'WORKS_WITH', source: 'E', target: 'F', properties: { project: 'Alpha' } });
  });

  // ============================================================
  // Query Operations
  // ============================================================

  describe('findNodes()', () => {
    it('should return all nodes when no filter provided', () => {
      const nodes = findNodes(storage);
      expect(nodes).toHaveLength(6);
    });

    it('should filter nodes by type', () => {
      const people = findNodes(storage, { type: 'Person' });
      expect(people).toHaveLength(3);
      expect(people.every((n) => n.type === 'Person')).toBe(true);
    });

    it('should filter nodes by id', () => {
      const nodes = findNodes(storage, { id: 'A' });
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('A');
    });

    it('should filter nodes by properties', () => {
      const nodes = findNodes(storage, { properties: { age: 30 } });
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('A');
    });

    it('should combine multiple filter criteria with AND', () => {
      const nodes = findNodes(storage, { type: 'Person', properties: { age: 25 } });
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('B');
    });

    it('should return empty array when no nodes match', () => {
      const nodes = findNodes(storage, { type: 'NonExistent' });
      expect(nodes).toHaveLength(0);
    });

    it('should handle partial property matches', () => {
      const nodes = findNodes(storage, { properties: { name: 'Alice' } });
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('A');
    });
  });

  describe('findEdges()', () => {
    it('should return all edges when no filter provided', () => {
      const edges = findEdges(storage);
      expect(edges).toHaveLength(5);
    });

    it('should filter edges by type', () => {
      const edges = findEdges(storage, { type: 'KNOWS' });
      expect(edges).toHaveLength(3);
      expect(edges.every((e) => e.type === 'KNOWS')).toBe(true);
    });

    it('should filter edges by source', () => {
      const edges = findEdges(storage, { source: 'A' });
      expect(edges).toHaveLength(2);
      expect(edges.every((e) => e.source === 'A')).toBe(true);
    });

    it('should filter edges by target', () => {
      const edges = findEdges(storage, { target: 'B' });
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('A');
    });

    it('should filter edges by source and target', () => {
      const edges = findEdges(storage, { source: 'A', target: 'B' });
      expect(edges).toHaveLength(1);
      expect(edges[0].type).toBe('KNOWS');
    });

    it('should filter edges by properties', () => {
      const edges = findEdges(storage, { properties: { since: 2020 } });
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('e1');
    });

    it('should combine multiple filter criteria with AND', () => {
      const edges = findEdges(storage, { type: 'KNOWS', source: 'B' });
      expect(edges).toHaveLength(2);
    });

    it('should return empty array when no edges match', () => {
      const edges = findEdges(storage, { type: 'MARRIED_TO' });
      expect(edges).toHaveLength(0);
    });

    it('should filter edges by id', () => {
      const edges = findEdges(storage, { id: 'e1' });
      expect(edges).toHaveLength(1);
      expect(edges[0].type).toBe('KNOWS');
    });
  });

  // ============================================================
  // Traversal Operations
  // ============================================================

  describe('traverse()', () => {
    it('should traverse outgoing edges by default', () => {
      const visited = traverse(storage, 'A');
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('D');
    });

    it('should traverse outgoing edges with explicit direction', () => {
      const visited = traverse(storage, 'A', { direction: TraverseDirection.Outgoing });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).toContain('D');
      expect(visited).toContain('E');
      expect(visited).toContain('F');
    });

    it('should traverse incoming edges only', () => {
      const visited = traverse(storage, 'C', { direction: TraverseDirection.Incoming });
      expect(visited).toContain('C');
      expect(visited).toContain('B');
      expect(visited).toContain('A');
      expect(visited).not.toContain('D');
    });

    it('should traverse both directions', () => {
      const visited = traverse(storage, 'B', { direction: TraverseDirection.Both });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).toContain('D');
      expect(visited).toContain('E');
    });

    it('should respect max depth limit', () => {
      const visited = traverse(storage, 'A', { maxDepth: 1 });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('D');
      expect(visited).not.toContain('C');
      expect(visited).not.toContain('E');
    });

    it('should filter by edge type', () => {
      const visited = traverse(storage, 'A', { edgeTypes: ['KNOWS'] });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).toContain('E');
      expect(visited).not.toContain('D');
      expect(visited).not.toContain('F');
    });

    it('should filter by node type', () => {
      const visited = traverse(storage, 'A', { nodeTypes: ['Person'] });
      expect(visited).toContain('A');
      expect(visited).toContain('B');
      expect(visited).toContain('C');
      expect(visited).not.toContain('D');
      expect(visited).not.toContain('E');
    });

    it('should return only start node for isolated traversal', () => {
      storage.addNode({ id: 'Z', type: 'Isolated', properties: {} });
      const visited = traverse(storage, 'Z');
      expect(visited).toEqual(['Z']);
    });

    it('should throw error for non-existent start node', () => {
      expect(() => traverse(storage, 'NonExistent')).toThrow();
    });

    it('should handle cycles without infinite loop', () => {
      // Add a cycle: C -> A
      storage.addEdge({ id: 'e6', type: 'KNOWS', source: 'C', target: 'A', properties: {} });
      const visited = traverse(storage, 'A', { direction: TraverseDirection.Outgoing });
      // Should visit each node exactly once
      expect(new Set(visited).size).toBe(visited.length);
    });
  });

  describe('neighbors()', () => {
    it('should return outgoing neighbors by default', () => {
      const neighborIds = neighbors(storage, 'A');
      expect(neighborIds).toContain('B');
      expect(neighborIds).toContain('D');
      expect(neighborIds).toHaveLength(2);
    });

    it('should return incoming neighbors', () => {
      const neighborIds = neighbors(storage, 'B', TraverseDirection.Incoming);
      expect(neighborIds).toContain('A');
      expect(neighborIds).toHaveLength(1);
    });

    it('should return both incoming and outgoing neighbors', () => {
      const neighborIds = neighbors(storage, 'B', TraverseDirection.Both);
      expect(neighborIds).toContain('A');
      expect(neighborIds).toContain('C');
      expect(neighborIds).toContain('E');
      expect(neighborIds).toHaveLength(3);
    });

    it('should return empty array for node with no neighbors', () => {
      storage.addNode({ id: 'Z', type: 'Isolated', properties: {} });
      const neighborIds = neighbors(storage, 'Z');
      expect(neighborIds).toHaveLength(0);
    });

    it('should throw error for non-existent node', () => {
      expect(() => neighbors(storage, 'NonExistent')).toThrow();
    });

    it('should not include duplicates when same node is reached via multiple edges', () => {
      // Add another edge from A to B
      storage.addEdge({ id: 'e7', type: 'WORKS_WITH', source: 'A', target: 'B', properties: {} });
      const neighborIds = neighbors(storage, 'A');
      // B should appear only once
      expect(neighborIds.filter((id) => id === 'B')).toHaveLength(1);
    });
  });

  describe('degree()', () => {
    it('should return out-degree by default', () => {
      const deg = degree(storage, 'A');
      expect(deg).toBe(2); // A -> B, A -> D
    });

    it('should return in-degree', () => {
      const deg = degree(storage, 'B', TraverseDirection.Incoming);
      expect(deg).toBe(1); // A -> B
    });

    it('should return total degree (in + out)', () => {
      const deg = degree(storage, 'B', TraverseDirection.Both);
      expect(deg).toBe(3); // in: A->B (1), out: B->C, B->E (2)
    });

    it('should return 0 for isolated node', () => {
      storage.addNode({ id: 'Z', type: 'Isolated', properties: {} });
      expect(degree(storage, 'Z')).toBe(0);
      expect(degree(storage, 'Z', TraverseDirection.Incoming)).toBe(0);
      expect(degree(storage, 'Z', TraverseDirection.Both)).toBe(0);
    });

    it('should throw error for non-existent node', () => {
      expect(() => degree(storage, 'NonExistent')).toThrow();
    });
  });

  // ============================================================
  // Path Operations
  // ============================================================

  describe('findPath()', () => {
    it('should find a path between connected nodes', () => {
      const path = findPath(storage, 'A', 'C');
      expect(path).not.toBeNull();
      expect(path).toEqual(['A', 'B', 'C']);
    });

    it('should return single-element path for same source and target', () => {
      const path = findPath(storage, 'A', 'A');
      expect(path).toEqual(['A']);
    });

    it('should find shortest path (BFS)', () => {
      // Add a direct edge A -> C
      storage.addEdge({ id: 'e8', type: 'DIRECT', source: 'A', target: 'C', properties: {} });
      const path = findPath(storage, 'A', 'C');
      expect(path).toEqual(['A', 'C']); // Shortest path
    });

    it('should return null when no path exists', () => {
      // F has no outgoing edges, D has no incoming edges from F
      const path = findPath(storage, 'F', 'A');
      expect(path).toBeNull();
    });

    it('should find path through multiple hops', () => {
      const path = findPath(storage, 'A', 'F');
      expect(path).toEqual(['A', 'B', 'E', 'F']);
    });

    it('should respect max depth limit', () => {
      const path = findPath(storage, 'A', 'F', { maxDepth: 2 });
      expect(path).toBeNull(); // F is 3 hops away
    });

    it('should filter by edge types', () => {
      const path = findPath(storage, 'A', 'E', { edgeTypes: ['KNOWS'] });
      expect(path).toEqual(['A', 'B', 'E']);
    });

    it('should return null when path blocked by edge type filter', () => {
      const path = findPath(storage, 'A', 'D', { edgeTypes: ['KNOWS'] });
      expect(path).toBeNull(); // OWNS edge is filtered out
    });

    it('should throw error for non-existent source', () => {
      expect(() => findPath(storage, 'NonExistent', 'A')).toThrow();
    });

    it('should throw error for non-existent target', () => {
      expect(() => findPath(storage, 'A', 'NonExistent')).toThrow();
    });

    it('should handle bidirectional search', () => {
      const path = findPath(storage, 'A', 'C', { direction: TraverseDirection.Both });
      expect(path).toEqual(['A', 'B', 'C']);
    });

    it('should find path in reverse direction', () => {
      const path = findPath(storage, 'C', 'A', { direction: TraverseDirection.Incoming });
      expect(path).toEqual(['C', 'B', 'A']);
    });
  });

  // ============================================================
  // Subgraph Operations
  // ============================================================

  describe('subgraph()', () => {
    it('should extract subgraph with specified node IDs', () => {
      const sub = subgraph(storage, ['A', 'B']);
      expect(sub.nodes).toHaveLength(2);
      expect(sub.nodes.map((n) => n.id)).toContain('A');
      expect(sub.nodes.map((n) => n.id)).toContain('B');
    });

    it('should include edges between included nodes', () => {
      const sub = subgraph(storage, ['A', 'B']);
      expect(sub.edges).toHaveLength(1);
      expect(sub.edges[0].id).toBe('e1'); // A -> B
    });

    it('should exclude edges to/from excluded nodes', () => {
      const sub = subgraph(storage, ['A', 'D']);
      expect(sub.edges).toHaveLength(1);
      expect(sub.edges[0].id).toBe('e3'); // A -> D
      // e1 (A -> B) should not be included since B is not in the subgraph
    });

    it('should return empty subgraph for empty node list', () => {
      const sub = subgraph(storage, []);
      expect(sub.nodes).toHaveLength(0);
      expect(sub.edges).toHaveLength(0);
    });

    it('should skip non-existent nodes gracefully', () => {
      const sub = subgraph(storage, ['A', 'NonExistent', 'B']);
      expect(sub.nodes).toHaveLength(2);
      expect(sub.nodes.map((n) => n.id)).toContain('A');
      expect(sub.nodes.map((n) => n.id)).toContain('B');
    });

    it('should extract subgraph for traversal result', () => {
      const visited = traverse(storage, 'A', { maxDepth: 1 });
      const sub = subgraph(storage, visited);
      expect(sub.nodes).toHaveLength(3); // A, B, D
      expect(sub.edges).toHaveLength(2); // e1 (A->B), e3 (A->D)
    });

    it('should preserve node and edge properties', () => {
      const sub = subgraph(storage, ['A', 'B']);
      const nodeA = sub.nodes.find((n) => n.id === 'A');
      expect(nodeA?.properties).toEqual({ name: 'Alice', age: 30 });

      const edgeAB = sub.edges.find((e) => e.id === 'e1');
      expect(edgeAB?.properties).toEqual({ since: 2020 });
    });

    it('should handle single node with no edges', () => {
      storage.addNode({ id: 'Z', type: 'Isolated', properties: {} });
      const sub = subgraph(storage, ['Z']);
      expect(sub.nodes).toHaveLength(1);
      expect(sub.edges).toHaveLength(0);
    });

    it('should extract full graph when all nodes specified', () => {
      const allNodeIds = storage.getAllNodes().map((n) => n.id);
      const sub = subgraph(storage, allNodeIds);
      expect(sub.nodes).toHaveLength(6);
      expect(sub.edges).toHaveLength(5);
    });
  });
});

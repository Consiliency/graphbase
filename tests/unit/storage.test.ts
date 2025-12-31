/**
 * Storage layer unit tests
 *
 * @module tests/unit/storage
 *
 * Tests for:
 * - Storage interface contract
 * - MemoryStorage implementation
 * - createStorage() factory function
 * - Node CRUD operations
 * - Edge CRUD operations
 * - Filter-based queries
 * - Error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Node, Edge, NodeFilter, EdgeFilter } from '../../src/types/index.js';
import type { Storage } from '../../src/storage/interface.js';
import { MemoryStorage } from '../../src/storage/memory.js';
import { createStorage, StorageBackend } from '../../src/storage/factory.js';

// Test fixtures
interface PersonProps {
  name: string;
  age: number;
}

interface CompanyProps {
  name: string;
  industry: string;
}

interface WorksAtProps {
  since: string;
  role: string;
}

interface KnowsProps {
  since: string;
  strength: number;
}

const createPerson = (id: string, name: string, age: number): Node<PersonProps> => ({
  id,
  type: 'Person',
  properties: { name, age },
});

const createCompany = (id: string, name: string, industry: string): Node<CompanyProps> => ({
  id,
  type: 'Company',
  properties: { name, industry },
});

const createWorksAt = (
  id: string,
  personId: string,
  companyId: string,
  since: string,
  role: string
): Edge<WorksAtProps> => ({
  id,
  type: 'WORKS_AT',
  source: personId,
  target: companyId,
  properties: { since, role },
});

const createKnows = (
  id: string,
  sourceId: string,
  targetId: string,
  since: string,
  strength: number
): Edge<KnowsProps> => ({
  id,
  type: 'KNOWS',
  source: sourceId,
  target: targetId,
  properties: { since, strength },
});

describe('Storage Interface', () => {
  describe('MemoryStorage', () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new MemoryStorage();
    });

    describe('Node Operations', () => {
      describe('addNode()', () => {
        it('should add a node and return it', () => {
          const person = createPerson('p1', 'Alice', 30);
          const result = storage.addNode(person);

          expect(result).toEqual(person);
        });

        it('should add multiple nodes with different types', () => {
          const person = createPerson('p1', 'Alice', 30);
          const company = createCompany('c1', 'Acme', 'Tech');

          storage.addNode(person);
          storage.addNode(company);

          expect(storage.getNode('p1')).toEqual(person);
          expect(storage.getNode('c1')).toEqual(company);
        });

        it('should throw error when adding node with duplicate id', () => {
          const person1 = createPerson('p1', 'Alice', 30);
          const person2 = createPerson('p1', 'Bob', 25);

          storage.addNode(person1);

          expect(() => storage.addNode(person2)).toThrow('Node with id "p1" already exists');
        });
      });

      describe('getNode()', () => {
        it('should return a node by id', () => {
          const person = createPerson('p1', 'Alice', 30);
          storage.addNode(person);

          const result = storage.getNode('p1');
          expect(result).toEqual(person);
        });

        it('should return undefined for non-existent node', () => {
          const result = storage.getNode('non-existent');
          expect(result).toBeUndefined();
        });

        it('should return the exact node object stored', () => {
          const person = createPerson('p1', 'Alice', 30);
          storage.addNode(person);

          const result = storage.getNode('p1');
          expect(result).toEqual(person);
        });
      });

      describe('updateNode()', () => {
        it('should update a node and return the updated node', () => {
          const person = createPerson('p1', 'Alice', 30);
          storage.addNode(person);

          const updated = createPerson('p1', 'Alice', 31);
          const result = storage.updateNode(updated);

          expect(result).toEqual(updated);
          expect(storage.getNode('p1')).toEqual(updated);
        });

        it('should throw error when updating non-existent node', () => {
          const person = createPerson('p1', 'Alice', 30);

          expect(() => storage.updateNode(person)).toThrow('Node with id "p1" does not exist');
        });

        it('should allow changing node type', () => {
          const person = createPerson('p1', 'Alice', 30);
          storage.addNode(person);

          const company: Node = {
            id: 'p1',
            type: 'Company',
            properties: { name: 'Acme', industry: 'Tech' },
          };
          storage.updateNode(company);

          expect(storage.getNode('p1')?.type).toBe('Company');
        });
      });

      describe('deleteNode()', () => {
        it('should delete a node and return true', () => {
          const person = createPerson('p1', 'Alice', 30);
          storage.addNode(person);

          const result = storage.deleteNode('p1');

          expect(result).toBe(true);
          expect(storage.getNode('p1')).toBeUndefined();
        });

        it('should return false when deleting non-existent node', () => {
          const result = storage.deleteNode('non-existent');
          expect(result).toBe(false);
        });

        it('should delete edges connected to the node', () => {
          const alice = createPerson('p1', 'Alice', 30);
          const bob = createPerson('p2', 'Bob', 25);
          storage.addNode(alice);
          storage.addNode(bob);

          const knows = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          storage.addEdge(knows);

          storage.deleteNode('p1');

          expect(storage.getEdge('e1')).toBeUndefined();
        });

        it('should delete all edges where node is source or target', () => {
          const alice = createPerson('p1', 'Alice', 30);
          const bob = createPerson('p2', 'Bob', 25);
          const charlie = createPerson('p3', 'Charlie', 35);
          storage.addNode(alice);
          storage.addNode(bob);
          storage.addNode(charlie);

          const e1 = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          const e2 = createKnows('e2', 'p2', 'p3', '2021', 0.8);
          const e3 = createKnows('e3', 'p3', 'p2', '2021', 0.7);
          storage.addEdge(e1);
          storage.addEdge(e2);
          storage.addEdge(e3);

          // Delete Bob (middle node)
          storage.deleteNode('p2');

          expect(storage.getEdge('e1')).toBeUndefined();
          expect(storage.getEdge('e2')).toBeUndefined();
          expect(storage.getEdge('e3')).toBeUndefined();
        });
      });

      describe('findNodes()', () => {
        beforeEach(() => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          storage.addNode(createPerson('p2', 'Bob', 25));
          storage.addNode(createPerson('p3', 'Charlie', 30));
          storage.addNode(createCompany('c1', 'Acme', 'Tech'));
          storage.addNode(createCompany('c2', 'Beta', 'Finance'));
        });

        it('should return all nodes when no filter provided', () => {
          const result = storage.findNodes();
          expect(result).toHaveLength(5);
        });

        it('should filter nodes by id', () => {
          const filter: NodeFilter = { id: 'p1' };
          const result = storage.findNodes(filter);

          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('p1');
        });

        it('should filter nodes by type', () => {
          const filter: NodeFilter = { type: 'Person' };
          const result = storage.findNodes(filter);

          expect(result).toHaveLength(3);
          expect(result.every((n) => n.type === 'Person')).toBe(true);
        });

        it('should filter nodes by single property', () => {
          const filter: NodeFilter = { properties: { age: 30 } };
          const result = storage.findNodes(filter);

          expect(result).toHaveLength(2);
          expect(result.every((n) => n.properties.age === 30)).toBe(true);
        });

        it('should filter nodes by multiple properties', () => {
          const filter: NodeFilter = { properties: { name: 'Alice', age: 30 } };
          const result = storage.findNodes(filter);

          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('p1');
        });

        it('should combine type and property filters with AND logic', () => {
          const filter: NodeFilter = { type: 'Company', properties: { industry: 'Tech' } };
          const result = storage.findNodes(filter);

          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('c1');
        });

        it('should return empty array when no matches', () => {
          const filter: NodeFilter = { type: 'NonExistent' };
          const result = storage.findNodes(filter);

          expect(result).toEqual([]);
        });

        it('should return empty array for empty storage', () => {
          const emptyStorage = new MemoryStorage();
          const result = emptyStorage.findNodes();

          expect(result).toEqual([]);
        });
      });

      describe('getAllNodes()', () => {
        it('should return all nodes', () => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          storage.addNode(createPerson('p2', 'Bob', 25));

          const result = storage.getAllNodes();

          expect(result).toHaveLength(2);
        });

        it('should return empty array for empty storage', () => {
          const result = storage.getAllNodes();
          expect(result).toEqual([]);
        });
      });

      describe('hasNode()', () => {
        it('should return true for existing node', () => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          expect(storage.hasNode('p1')).toBe(true);
        });

        it('should return false for non-existent node', () => {
          expect(storage.hasNode('non-existent')).toBe(false);
        });
      });

      describe('nodeCount()', () => {
        it('should return 0 for empty storage', () => {
          expect(storage.nodeCount()).toBe(0);
        });

        it('should return correct count after adding nodes', () => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          storage.addNode(createPerson('p2', 'Bob', 25));

          expect(storage.nodeCount()).toBe(2);
        });

        it('should update count after deleting nodes', () => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          storage.addNode(createPerson('p2', 'Bob', 25));
          storage.deleteNode('p1');

          expect(storage.nodeCount()).toBe(1);
        });
      });
    });

    describe('Edge Operations', () => {
      beforeEach(() => {
        // Set up nodes for edge tests
        storage.addNode(createPerson('p1', 'Alice', 30));
        storage.addNode(createPerson('p2', 'Bob', 25));
        storage.addNode(createPerson('p3', 'Charlie', 35));
        storage.addNode(createCompany('c1', 'Acme', 'Tech'));
      });

      describe('addEdge()', () => {
        it('should add an edge and return it', () => {
          const edge = createWorksAt('e1', 'p1', 'c1', '2020', 'Engineer');
          const result = storage.addEdge(edge);

          expect(result).toEqual(edge);
        });

        it('should add multiple edges', () => {
          const e1 = createWorksAt('e1', 'p1', 'c1', '2020', 'Engineer');
          const e2 = createKnows('e2', 'p1', 'p2', '2019', 0.9);

          storage.addEdge(e1);
          storage.addEdge(e2);

          expect(storage.getEdge('e1')).toEqual(e1);
          expect(storage.getEdge('e2')).toEqual(e2);
        });

        it('should throw error when adding edge with duplicate id', () => {
          const e1 = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          const e2 = createKnows('e1', 'p2', 'p3', '2021', 0.8);

          storage.addEdge(e1);

          expect(() => storage.addEdge(e2)).toThrow('Edge with id "e1" already exists');
        });

        it('should throw error when source node does not exist', () => {
          const edge = createKnows('e1', 'non-existent', 'p2', '2020', 0.9);

          expect(() => storage.addEdge(edge)).toThrow(
            'Source node with id "non-existent" does not exist'
          );
        });

        it('should throw error when target node does not exist', () => {
          const edge = createKnows('e1', 'p1', 'non-existent', '2020', 0.9);

          expect(() => storage.addEdge(edge)).toThrow(
            'Target node with id "non-existent" does not exist'
          );
        });
      });

      describe('getEdge()', () => {
        it('should return an edge by id', () => {
          const edge = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          storage.addEdge(edge);

          const result = storage.getEdge('e1');
          expect(result).toEqual(edge);
        });

        it('should return undefined for non-existent edge', () => {
          const result = storage.getEdge('non-existent');
          expect(result).toBeUndefined();
        });
      });

      describe('updateEdge()', () => {
        it('should update an edge and return the updated edge', () => {
          const edge = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          storage.addEdge(edge);

          const updated: Edge<KnowsProps> = {
            id: 'e1',
            type: 'KNOWS',
            source: 'p1',
            target: 'p2',
            properties: { since: '2020', strength: 0.95 },
          };
          const result = storage.updateEdge(updated);

          expect(result).toEqual(updated);
          expect(storage.getEdge('e1')).toEqual(updated);
        });

        it('should throw error when updating non-existent edge', () => {
          const edge = createKnows('e1', 'p1', 'p2', '2020', 0.9);

          expect(() => storage.updateEdge(edge)).toThrow('Edge with id "e1" does not exist');
        });

        it('should throw error when new source node does not exist', () => {
          const edge = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          storage.addEdge(edge);

          const updated: Edge<KnowsProps> = {
            id: 'e1',
            type: 'KNOWS',
            source: 'non-existent',
            target: 'p2',
            properties: { since: '2020', strength: 0.95 },
          };

          expect(() => storage.updateEdge(updated)).toThrow(
            'Source node with id "non-existent" does not exist'
          );
        });

        it('should throw error when new target node does not exist', () => {
          const edge = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          storage.addEdge(edge);

          const updated: Edge<KnowsProps> = {
            id: 'e1',
            type: 'KNOWS',
            source: 'p1',
            target: 'non-existent',
            properties: { since: '2020', strength: 0.95 },
          };

          expect(() => storage.updateEdge(updated)).toThrow(
            'Target node with id "non-existent" does not exist'
          );
        });
      });

      describe('deleteEdge()', () => {
        it('should delete an edge and return true', () => {
          const edge = createKnows('e1', 'p1', 'p2', '2020', 0.9);
          storage.addEdge(edge);

          const result = storage.deleteEdge('e1');

          expect(result).toBe(true);
          expect(storage.getEdge('e1')).toBeUndefined();
        });

        it('should return false when deleting non-existent edge', () => {
          const result = storage.deleteEdge('non-existent');
          expect(result).toBe(false);
        });
      });

      describe('findEdges()', () => {
        beforeEach(() => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p2', 'p3', '2021', 0.8));
          storage.addEdge(createKnows('e3', 'p1', 'p3', '2022', 0.7));
          storage.addEdge(createWorksAt('e4', 'p1', 'c1', '2020', 'Engineer'));
        });

        it('should return all edges when no filter provided', () => {
          const result = storage.findEdges();
          expect(result).toHaveLength(4);
        });

        it('should filter edges by id', () => {
          const filter: EdgeFilter = { id: 'e1' };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('e1');
        });

        it('should filter edges by type', () => {
          const filter: EdgeFilter = { type: 'KNOWS' };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(3);
          expect(result.every((e) => e.type === 'KNOWS')).toBe(true);
        });

        it('should filter edges by source', () => {
          const filter: EdgeFilter = { source: 'p1' };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(3);
          expect(result.every((e) => e.source === 'p1')).toBe(true);
        });

        it('should filter edges by target', () => {
          const filter: EdgeFilter = { target: 'p3' };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(2);
          expect(result.every((e) => e.target === 'p3')).toBe(true);
        });

        it('should filter edges by source and target', () => {
          const filter: EdgeFilter = { source: 'p1', target: 'p2' };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('e1');
        });

        it('should filter edges by properties', () => {
          const filter: EdgeFilter = { properties: { strength: 0.9 } };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('e1');
        });

        it('should combine type and source filters with AND logic', () => {
          const filter: EdgeFilter = { type: 'KNOWS', source: 'p1' };
          const result = storage.findEdges(filter);

          expect(result).toHaveLength(2);
        });

        it('should return empty array when no matches', () => {
          const filter: EdgeFilter = { type: 'NON_EXISTENT' };
          const result = storage.findEdges(filter);

          expect(result).toEqual([]);
        });
      });

      describe('getAllEdges()', () => {
        it('should return all edges', () => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p2', 'p3', '2021', 0.8));

          const result = storage.getAllEdges();

          expect(result).toHaveLength(2);
        });

        it('should return empty array for storage with no edges', () => {
          const result = storage.getAllEdges();
          expect(result).toEqual([]);
        });
      });

      describe('hasEdge()', () => {
        it('should return true for existing edge', () => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          expect(storage.hasEdge('e1')).toBe(true);
        });

        it('should return false for non-existent edge', () => {
          expect(storage.hasEdge('non-existent')).toBe(false);
        });
      });

      describe('edgeCount()', () => {
        it('should return 0 for storage with no edges', () => {
          expect(storage.edgeCount()).toBe(0);
        });

        it('should return correct count after adding edges', () => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p2', 'p3', '2021', 0.8));

          expect(storage.edgeCount()).toBe(2);
        });

        it('should update count after deleting edges', () => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p2', 'p3', '2021', 0.8));
          storage.deleteEdge('e1');

          expect(storage.edgeCount()).toBe(1);
        });
      });

      describe('getEdgesFrom()', () => {
        beforeEach(() => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p1', 'p3', '2021', 0.8));
          storage.addEdge(createKnows('e3', 'p2', 'p3', '2022', 0.7));
        });

        it('should return all edges from a node', () => {
          const result = storage.getEdgesFrom('p1');

          expect(result).toHaveLength(2);
          expect(result.every((e) => e.source === 'p1')).toBe(true);
        });

        it('should return empty array for node with no outgoing edges', () => {
          const result = storage.getEdgesFrom('p3');
          expect(result).toEqual([]);
        });

        it('should return empty array for non-existent node', () => {
          const result = storage.getEdgesFrom('non-existent');
          expect(result).toEqual([]);
        });
      });

      describe('getEdgesTo()', () => {
        beforeEach(() => {
          storage.addEdge(createKnows('e1', 'p1', 'p3', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p2', 'p3', '2021', 0.8));
          storage.addEdge(createKnows('e3', 'p1', 'p2', '2022', 0.7));
        });

        it('should return all edges to a node', () => {
          const result = storage.getEdgesTo('p3');

          expect(result).toHaveLength(2);
          expect(result.every((e) => e.target === 'p3')).toBe(true);
        });

        it('should return empty array for node with no incoming edges', () => {
          const result = storage.getEdgesTo('p1');
          expect(result).toEqual([]);
        });

        it('should return empty array for non-existent node', () => {
          const result = storage.getEdgesTo('non-existent');
          expect(result).toEqual([]);
        });
      });

      describe('getEdgesBetween()', () => {
        beforeEach(() => {
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));
          storage.addEdge(createKnows('e2', 'p2', 'p1', '2021', 0.8));
          storage.addEdge(createKnows('e3', 'p1', 'p3', '2022', 0.7));
        });

        it('should return all edges between two nodes (both directions)', () => {
          const result = storage.getEdgesBetween('p1', 'p2');

          expect(result).toHaveLength(2);
        });

        it('should return empty array when no edges between nodes', () => {
          const result = storage.getEdgesBetween('p2', 'p3');
          expect(result).toEqual([]);
        });

        it('should return empty array for non-existent nodes', () => {
          const result = storage.getEdgesBetween('non-existent', 'p1');
          expect(result).toEqual([]);
        });
      });
    });

    describe('Bulk Operations', () => {
      describe('clear()', () => {
        it('should remove all nodes and edges', () => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          storage.addNode(createPerson('p2', 'Bob', 25));
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));

          storage.clear();

          expect(storage.nodeCount()).toBe(0);
          expect(storage.edgeCount()).toBe(0);
        });

        it('should work on empty storage', () => {
          expect(() => storage.clear()).not.toThrow();
        });
      });

      describe('getData()', () => {
        it('should return all nodes and edges as GraphData', () => {
          storage.addNode(createPerson('p1', 'Alice', 30));
          storage.addNode(createPerson('p2', 'Bob', 25));
          storage.addEdge(createKnows('e1', 'p1', 'p2', '2020', 0.9));

          const result = storage.getData();

          expect(result.nodes).toHaveLength(2);
          expect(result.edges).toHaveLength(1);
        });

        it('should return empty arrays for empty storage', () => {
          const result = storage.getData();

          expect(result.nodes).toEqual([]);
          expect(result.edges).toEqual([]);
        });
      });

      describe('setData()', () => {
        it('should replace all data with provided GraphData', () => {
          storage.addNode(createPerson('old1', 'OldPerson', 50));

          storage.setData({
            nodes: [
              createPerson('p1', 'Alice', 30),
              createPerson('p2', 'Bob', 25),
            ],
            edges: [createKnows('e1', 'p1', 'p2', '2020', 0.9)],
          });

          expect(storage.nodeCount()).toBe(2);
          expect(storage.edgeCount()).toBe(1);
          expect(storage.getNode('old1')).toBeUndefined();
        });

        it('should validate edge references', () => {
          expect(() =>
            storage.setData({
              nodes: [createPerson('p1', 'Alice', 30)],
              edges: [createKnows('e1', 'p1', 'non-existent', '2020', 0.9)],
            })
          ).toThrow('Target node with id "non-existent" does not exist');
        });
      });
    });
  });

  describe('createStorage Factory', () => {
    describe('StorageBackend enum', () => {
      it('should have Memory backend', () => {
        expect(StorageBackend.Memory).toBe('memory');
      });
    });

    describe('createStorage()', () => {
      it('should create MemoryStorage by default', () => {
        const storage = createStorage();
        expect(storage).toBeInstanceOf(MemoryStorage);
      });

      it('should create MemoryStorage when explicitly specified', () => {
        const storage = createStorage({ backend: StorageBackend.Memory });
        expect(storage).toBeInstanceOf(MemoryStorage);
      });

      it('should throw for unknown backend', () => {
        expect(() => createStorage({ backend: 'unknown' as StorageBackend })).toThrow(
          'Unknown storage backend: unknown'
        );
      });
    });
  });

  describe('Storage Export', () => {
    it('should be importable from storage/index.js', async () => {
      const storageModule = await import('../../src/storage/index.js');

      expect(storageModule.MemoryStorage).toBeDefined();
      expect(storageModule.createStorage).toBeDefined();
      expect(storageModule.StorageBackend).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import type {
  Node,
  Edge,
  Relationship,
  GraphData,
  NodeFilter,
  EdgeFilter,
} from '../../src/types';

describe('Type System', () => {
  describe('Node<T>', () => {
    it('should support generic properties', () => {
      interface PersonProps {
        name: string;
        age: number;
      }

      const node: Node<PersonProps> = {
        id: 'person-1',
        type: 'Person',
        properties: {
          name: 'Alice',
          age: 30,
        },
      };

      expect(node.id).toBe('person-1');
      expect(node.type).toBe('Person');
      expect(node.properties.name).toBe('Alice');
      expect(node.properties.age).toBe(30);
    });

    it('should require id, type, and properties', () => {
      interface EmptyProps {}

      const node: Node<EmptyProps> = {
        id: 'test-1',
        type: 'Test',
        properties: {},
      };

      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('properties');
    });

    it('should support optional metadata', () => {
      interface BasicProps {
        value: string;
      }

      const nodeWithMetadata: Node<BasicProps> & { metadata?: Record<string, unknown> } = {
        id: 'node-1',
        type: 'Basic',
        properties: { value: 'test' },
        metadata: { createdAt: '2025-12-30' },
      };

      expect(nodeWithMetadata.metadata).toBeDefined();
      expect(nodeWithMetadata.metadata?.createdAt).toBe('2025-12-30');
    });
  });

  describe('Edge<T>', () => {
    it('should support generic properties', () => {
      interface EdgeProps {
        weight: number;
        label: string;
      }

      const edge: Edge<EdgeProps> = {
        id: 'edge-1',
        type: 'CONNECTS',
        source: 'node-1',
        target: 'node-2',
        properties: {
          weight: 1.5,
          label: 'connection',
        },
      };

      expect(edge.id).toBe('edge-1');
      expect(edge.type).toBe('CONNECTS');
      expect(edge.source).toBe('node-1');
      expect(edge.target).toBe('node-2');
      expect(edge.properties.weight).toBe(1.5);
      expect(edge.properties.label).toBe('connection');
    });

    it('should require id, type, source, target, and properties', () => {
      interface EmptyProps {}

      const edge: Edge<EmptyProps> = {
        id: 'edge-1',
        type: 'LINKS',
        source: 'a',
        target: 'b',
        properties: {},
      };

      expect(edge).toHaveProperty('id');
      expect(edge).toHaveProperty('type');
      expect(edge).toHaveProperty('source');
      expect(edge).toHaveProperty('target');
      expect(edge).toHaveProperty('properties');
    });
  });

  describe('Relationship', () => {
    it('should define edge type relationships', () => {
      const relationship: Relationship = {
        type: 'KNOWS',
        sourceType: 'Person',
        targetType: 'Person',
      };

      expect(relationship.type).toBe('KNOWS');
      expect(relationship.sourceType).toBe('Person');
      expect(relationship.targetType).toBe('Person');
    });

    it('should support cross-type relationships', () => {
      const relationship: Relationship = {
        type: 'AUTHORED',
        sourceType: 'Person',
        targetType: 'Book',
      };

      expect(relationship.sourceType).toBe('Person');
      expect(relationship.targetType).toBe('Book');
    });

    it('should support optional description', () => {
      const relationship: Relationship & { description?: string } = {
        type: 'MANAGES',
        sourceType: 'Manager',
        targetType: 'Employee',
        description: 'Management hierarchy',
      };

      expect(relationship.description).toBe('Management hierarchy');
    });
  });

  describe('GraphData', () => {
    it('should contain nodes and edges arrays', () => {
      const graph: GraphData = {
        nodes: [
          { id: 'n1', type: 'A', properties: {} },
          { id: 'n2', type: 'B', properties: {} },
        ],
        edges: [
          { id: 'e1', type: 'LINKS', source: 'n1', target: 'n2', properties: {} },
        ],
      };

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.nodes[0].id).toBe('n1');
      expect(graph.edges[0].source).toBe('n1');
    });

    it('should allow empty graphs', () => {
      const emptyGraph: GraphData = {
        nodes: [],
        edges: [],
      };

      expect(emptyGraph.nodes).toHaveLength(0);
      expect(emptyGraph.edges).toHaveLength(0);
    });

    it('should support heterogeneous node types', () => {
      interface PersonProps {
        name: string;
      }
      interface BookProps {
        title: string;
      }

      const graph: GraphData = {
        nodes: [
          { id: 'p1', type: 'Person', properties: { name: 'Alice' } as PersonProps },
          { id: 'b1', type: 'Book', properties: { title: '1984' } as BookProps },
        ],
        edges: [],
      };

      expect(graph.nodes[0].type).toBe('Person');
      expect(graph.nodes[1].type).toBe('Book');
    });
  });

  describe('NodeFilter', () => {
    it('should filter by id', () => {
      const filter: NodeFilter = {
        id: 'node-1',
      };

      expect(filter.id).toBe('node-1');
    });

    it('should filter by type', () => {
      const filter: NodeFilter = {
        type: 'Person',
      };

      expect(filter.type).toBe('Person');
    });

    it('should filter by properties', () => {
      const filter: NodeFilter = {
        properties: {
          name: 'Alice',
          age: 30,
        },
      };

      expect(filter.properties).toHaveProperty('name', 'Alice');
      expect(filter.properties).toHaveProperty('age', 30);
    });

    it('should support combined filters', () => {
      const filter: NodeFilter = {
        type: 'Person',
        properties: {
          active: true,
        },
      };

      expect(filter.type).toBe('Person');
      expect(filter.properties?.active).toBe(true);
    });

    it('should allow empty filter', () => {
      const filter: NodeFilter = {};

      expect(Object.keys(filter)).toHaveLength(0);
    });
  });

  describe('EdgeFilter', () => {
    it('should filter by id', () => {
      const filter: EdgeFilter = {
        id: 'edge-1',
      };

      expect(filter.id).toBe('edge-1');
    });

    it('should filter by type', () => {
      const filter: EdgeFilter = {
        type: 'KNOWS',
      };

      expect(filter.type).toBe('KNOWS');
    });

    it('should filter by source', () => {
      const filter: EdgeFilter = {
        source: 'node-1',
      };

      expect(filter.source).toBe('node-1');
    });

    it('should filter by target', () => {
      const filter: EdgeFilter = {
        target: 'node-2',
      };

      expect(filter.target).toBe('node-2');
    });

    it('should filter by properties', () => {
      const filter: EdgeFilter = {
        properties: {
          weight: 1.0,
        },
      };

      expect(filter.properties?.weight).toBe(1.0);
    });

    it('should support combined filters', () => {
      const filter: EdgeFilter = {
        type: 'KNOWS',
        source: 'person-1',
        properties: {
          since: '2020',
        },
      };

      expect(filter.type).toBe('KNOWS');
      expect(filter.source).toBe('person-1');
      expect(filter.properties?.since).toBe('2020');
    });
  });

  describe('Type Safety', () => {
    it('should enforce strict typing on Node properties', () => {
      interface StrictProps {
        required: string;
      }

      const node: Node<StrictProps> = {
        id: 'strict-1',
        type: 'Strict',
        properties: {
          required: 'value',
        },
      };

      // TypeScript should enforce the shape
      expect(node.properties.required).toBe('value');
    });

    it('should enforce strict typing on Edge properties', () => {
      interface StrictEdgeProps {
        weight: number;
      }

      const edge: Edge<StrictEdgeProps> = {
        id: 'edge-1',
        type: 'WEIGHTED',
        source: 'a',
        target: 'b',
        properties: {
          weight: 2.5,
        },
      };

      expect(edge.properties.weight).toBe(2.5);
    });

    it('should allow unknown property types in filters', () => {
      const filter: NodeFilter = {
        properties: {
          stringProp: 'text',
          numberProp: 42,
          boolProp: true,
          arrayProp: [1, 2, 3],
          objectProp: { nested: 'value' },
        },
      };

      expect(filter.properties?.stringProp).toBe('text');
      expect(filter.properties?.numberProp).toBe(42);
      expect(filter.properties?.boolProp).toBe(true);
      expect(filter.properties?.arrayProp).toEqual([1, 2, 3]);
      expect(filter.properties?.objectProp).toEqual({ nested: 'value' });
    });
  });
});

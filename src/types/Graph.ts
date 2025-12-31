import type { Node } from './Node.js';
import type { Edge } from './Edge.js';

/**
 * GraphData represents the complete state of a graph.
 *
 * @remarks
 * GraphData is the core data structure containing all nodes and edges.
 * It is used for:
 * - Serialization and deserialization (import/export)
 * - Bulk operations on the graph
 * - Initializing graph instances
 *
 * The nodes and edges arrays use the base types with unknown properties.
 * Type safety is enforced at the individual node/edge level through generics.
 *
 * @example
 * ```typescript
 * const graphData: GraphData = {
 *   nodes: [
 *     { id: 'n1', type: 'Person', properties: { name: 'Alice' } },
 *     { id: 'n2', type: 'Person', properties: { name: 'Bob' } }
 *   ],
 *   edges: [
 *     {
 *       id: 'e1',
 *       type: 'KNOWS',
 *       source: 'n1',
 *       target: 'n2',
 *       properties: { since: '2020' }
 *     }
 *   ]
 * };
 * ```
 */
export interface GraphData {
  /**
   * Array of all nodes in the graph.
   * Each node must have a unique ID.
   */
  nodes: Node<Record<string, unknown>>[];

  /**
   * Array of all edges in the graph.
   * Each edge must have a unique ID and reference existing nodes.
   */
  edges: Edge<Record<string, unknown>>[];
}

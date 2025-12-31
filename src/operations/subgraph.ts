/**
 * Subgraph extraction operations.
 *
 * @module operations/subgraph
 *
 * @remarks
 * Provides functions to extract subsets of the graph as independent graph structures.
 * Useful for:
 * - Extracting local neighborhoods around specific nodes
 * - Creating snapshots of traversal results
 * - Isolating portions of the graph for analysis
 *
 * @example
 * ```typescript
 * import { subgraph } from './operations/subgraph.js';
 * import { traverse } from './operations/traverse.js';
 *
 * // Extract subgraph from traversal
 * const visited = traverse(storage, 'A', { maxDepth: 2 });
 * const sub = subgraph(storage, visited);
 * ```
 */

import type { Storage } from '../storage/index.js';
import type { Node, Edge, GraphData } from '../types/index.js';

/**
 * Extract a subgraph containing only the specified nodes and edges between them.
 *
 * @param storage - The storage instance to extract from
 * @param nodeIds - Array of node IDs to include in the subgraph
 * @returns GraphData containing the nodes and edges within the subgraph
 *
 * @remarks
 * - Only nodes with IDs in the nodeIds array are included
 * - Only edges where both source AND target are in nodeIds are included
 * - Non-existent node IDs are silently ignored
 * - The returned GraphData is a new object (not a reference to storage data)
 *
 * @example
 * ```typescript
 * // Extract specific nodes
 * const sub = subgraph(storage, ['A', 'B', 'C']);
 *
 * // Extract from traversal result
 * const visited = traverse(storage, 'A', { maxDepth: 2 });
 * const localGraph = subgraph(storage, visited);
 *
 * // Extract single node (no edges)
 * const isolated = subgraph(storage, ['A']);
 * ```
 */
export function subgraph(storage: Storage, nodeIds: string[]): GraphData {
  // Create a set for O(1) lookup
  const nodeIdSet = new Set(nodeIds);

  // Collect nodes that exist
  const nodes: Node<Record<string, unknown>>[] = [];
  for (const nodeId of nodeIds) {
    const node = storage.getNode(nodeId);
    if (node) {
      // Create a copy of the node to avoid mutations
      nodes.push({
        id: node.id,
        type: node.type,
        properties: { ...node.properties },
      });
    }
  }

  // Collect edges where both endpoints are in the subgraph
  const edges: Edge<Record<string, unknown>>[] = [];
  const allEdges = storage.getAllEdges();

  for (const edge of allEdges) {
    if (nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)) {
      // Create a copy of the edge to avoid mutations
      edges.push({
        id: edge.id,
        type: edge.type,
        source: edge.source,
        target: edge.target,
        properties: { ...edge.properties },
      });
    }
  }

  return { nodes, edges };
}

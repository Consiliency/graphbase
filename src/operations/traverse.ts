/**
 * Traversal operations for exploring the graph structure.
 *
 * @module operations/traverse
 *
 * @remarks
 * Provides functions for graph traversal including:
 * - `traverse()`: Visit all reachable nodes from a starting point
 * - `neighbors()`: Get immediate neighbors of a node
 * - `degree()`: Count edges connected to a node
 *
 * All traversal operations support configurable direction (incoming, outgoing, both).
 *
 * @example
 * ```typescript
 * import { traverse, neighbors, degree, TraverseDirection } from './operations/traverse.js';
 *
 * const visited = traverse(storage, 'A', { direction: TraverseDirection.Outgoing });
 * const neighborIds = neighbors(storage, 'B', TraverseDirection.Both);
 * const nodeOutDegree = degree(storage, 'C');
 * ```
 */

import type { Storage } from '../storage/index.js';
import type { Edge } from '../types/index.js';

/**
 * Direction for graph traversal operations.
 */
export enum TraverseDirection {
  /** Follow outgoing edges (source -> target) */
  Outgoing = 'outgoing',
  /** Follow incoming edges (target <- source) */
  Incoming = 'incoming',
  /** Follow both incoming and outgoing edges */
  Both = 'both',
}

/**
 * Options for the traverse function.
 */
export interface TraverseOptions {
  /**
   * Direction to traverse edges.
   * @default TraverseDirection.Outgoing
   */
  direction?: TraverseDirection;

  /**
   * Maximum depth to traverse. 0 means unlimited.
   * @default 0
   */
  maxDepth?: number;

  /**
   * Only traverse edges of these types.
   * If not specified, all edge types are traversed.
   */
  edgeTypes?: string[];

  /**
   * Only include nodes of these types in the result.
   * If not specified, all node types are included.
   */
  nodeTypes?: string[];
}

/**
 * Traverse the graph starting from a given node using BFS.
 *
 * @param storage - The storage instance to traverse
 * @param startNodeId - The ID of the node to start traversal from
 * @param options - Traversal options
 * @returns Array of visited node IDs in BFS order
 *
 * @throws Error if the start node does not exist
 *
 * @remarks
 * Uses Breadth-First Search (BFS) to visit all reachable nodes.
 * The traversal respects the direction option to determine which edges to follow.
 * Cycles are handled by tracking visited nodes.
 *
 * @example
 * ```typescript
 * // Traverse all reachable nodes (outgoing)
 * const visited = traverse(storage, 'A');
 *
 * // Traverse with depth limit
 * const nearby = traverse(storage, 'A', { maxDepth: 2 });
 *
 * // Traverse specific edge types
 * const friends = traverse(storage, 'A', { edgeTypes: ['KNOWS'] });
 *
 * // Traverse in both directions
 * const connected = traverse(storage, 'A', { direction: TraverseDirection.Both });
 * ```
 */
export function traverse(
  storage: Storage,
  startNodeId: string,
  options: TraverseOptions = {}
): string[] {
  const {
    direction = TraverseDirection.Outgoing,
    maxDepth = 0,
    edgeTypes,
    nodeTypes,
  } = options;

  // Verify start node exists
  if (!storage.hasNode(startNodeId)) {
    throw new Error(`Node not found: ${startNodeId}`);
  }

  const visited = new Set<string>();
  const result: string[] = [];
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: startNodeId, depth: 0 },
  ];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;

    if (visited.has(nodeId)) {
      continue;
    }

    // Check node type filter
    const node = storage.getNode(nodeId);
    if (nodeTypes && node && !nodeTypes.includes(node.type)) {
      // Skip this node but don't add to visited (allow reaching through it)
      continue;
    }

    visited.add(nodeId);
    result.push(nodeId);

    // Check depth limit (0 means unlimited)
    if (maxDepth > 0 && depth >= maxDepth) {
      continue;
    }

    // Get edges based on direction
    const edges = getEdgesForDirection(storage, nodeId, direction);

    // Apply edge type filter
    const filteredEdges = edgeTypes
      ? edges.filter((e) => edgeTypes.includes(e.type))
      : edges;

    // Queue up neighbor nodes
    for (const edge of filteredEdges) {
      const neighborId = edge.source === nodeId ? edge.target : edge.source;
      if (!visited.has(neighborId)) {
        queue.push({ nodeId: neighborId, depth: depth + 1 });
      }
    }
  }

  return result;
}

/**
 * Get immediate neighbors of a node.
 *
 * @param storage - The storage instance to query
 * @param nodeId - The ID of the node to get neighbors for
 * @param direction - Direction to consider for neighbors
 * @returns Array of unique neighbor node IDs
 *
 * @throws Error if the node does not exist
 *
 * @remarks
 * Returns only unique neighbor IDs even if multiple edges connect to the same node.
 *
 * @example
 * ```typescript
 * // Get outgoing neighbors
 * const outNeighbors = neighbors(storage, 'A');
 *
 * // Get incoming neighbors
 * const inNeighbors = neighbors(storage, 'A', TraverseDirection.Incoming);
 *
 * // Get all neighbors
 * const allNeighbors = neighbors(storage, 'A', TraverseDirection.Both);
 * ```
 */
export function neighbors(
  storage: Storage,
  nodeId: string,
  direction: TraverseDirection = TraverseDirection.Outgoing
): string[] {
  // Verify node exists
  if (!storage.hasNode(nodeId)) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const edges = getEdgesForDirection(storage, nodeId, direction);
  const neighborSet = new Set<string>();

  for (const edge of edges) {
    const neighborId = edge.source === nodeId ? edge.target : edge.source;
    neighborSet.add(neighborId);
  }

  return Array.from(neighborSet);
}

/**
 * Get the degree (number of connected edges) of a node.
 *
 * @param storage - The storage instance to query
 * @param nodeId - The ID of the node to get degree for
 * @param direction - Which edges to count
 * @returns The degree of the node
 *
 * @throws Error if the node does not exist
 *
 * @remarks
 * - Outgoing: counts edges where node is the source
 * - Incoming: counts edges where node is the target
 * - Both: counts all connected edges (sum of in-degree and out-degree)
 *
 * @example
 * ```typescript
 * // Get out-degree
 * const outDegree = degree(storage, 'A');
 *
 * // Get in-degree
 * const inDegree = degree(storage, 'A', TraverseDirection.Incoming);
 *
 * // Get total degree
 * const totalDegree = degree(storage, 'A', TraverseDirection.Both);
 * ```
 */
export function degree(
  storage: Storage,
  nodeId: string,
  direction: TraverseDirection = TraverseDirection.Outgoing
): number {
  // Verify node exists
  if (!storage.hasNode(nodeId)) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const edges = getEdgesForDirection(storage, nodeId, direction);
  return edges.length;
}

/**
 * Helper function to get edges based on traversal direction.
 *
 * @param storage - The storage instance
 * @param nodeId - The node ID
 * @param direction - The traversal direction
 * @returns Array of edges matching the direction criteria
 */
function getEdgesForDirection(
  storage: Storage,
  nodeId: string,
  direction: TraverseDirection
): Edge<Record<string, unknown>>[] {
  switch (direction) {
    case TraverseDirection.Outgoing:
      return storage.getEdgesFrom(nodeId);
    case TraverseDirection.Incoming:
      return storage.getEdgesTo(nodeId);
    case TraverseDirection.Both:
      return [...storage.getEdgesFrom(nodeId), ...storage.getEdgesTo(nodeId)];
  }
}

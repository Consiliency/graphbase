/**
 * Path-finding operations for discovering routes between nodes.
 *
 * @module operations/paths
 *
 * @remarks
 * Provides BFS-based path finding to discover the shortest path between nodes.
 * Supports configurable direction and edge type filtering.
 *
 * @example
 * ```typescript
 * import { findPath } from './operations/paths.js';
 *
 * const path = findPath(storage, 'A', 'C');
 * // Returns: ['A', 'B', 'C'] or null if no path exists
 * ```
 */

import type { Storage } from '../storage/index.js';
import type { Edge } from '../types/index.js';
import { TraverseDirection } from './traverse.js';

/**
 * Options for path finding.
 */
export interface FindPathOptions {
  /**
   * Direction to traverse edges when finding path.
   * @default TraverseDirection.Outgoing
   */
  direction?: TraverseDirection;

  /**
   * Maximum path length (number of edges). 0 means unlimited.
   * @default 0
   */
  maxDepth?: number;

  /**
   * Only traverse edges of these types.
   * If not specified, all edge types are traversed.
   */
  edgeTypes?: string[];
}

/**
 * Find the shortest path between two nodes using BFS.
 *
 * @param storage - The storage instance to search
 * @param sourceId - The ID of the source node
 * @param targetId - The ID of the target node
 * @param options - Path finding options
 * @returns Array of node IDs representing the path, or null if no path exists
 *
 * @throws Error if the source node does not exist
 * @throws Error if the target node does not exist
 *
 * @remarks
 * Uses Breadth-First Search (BFS) to find the shortest path (by number of edges).
 * The path includes both the source and target nodes.
 *
 * - If source and target are the same, returns [source]
 * - If no path exists, returns null
 * - The path follows edges in the specified direction
 *
 * @example
 * ```typescript
 * // Find shortest path (following outgoing edges)
 * const path = findPath(storage, 'A', 'C');
 *
 * // Find path with depth limit
 * const shortPath = findPath(storage, 'A', 'C', { maxDepth: 2 });
 *
 * // Find path using only specific edge types
 * const friendPath = findPath(storage, 'A', 'C', { edgeTypes: ['KNOWS'] });
 *
 * // Find path in reverse direction (following incoming edges)
 * const reversePath = findPath(storage, 'C', 'A', {
 *   direction: TraverseDirection.Incoming
 * });
 * ```
 */
export function findPath(
  storage: Storage,
  sourceId: string,
  targetId: string,
  options: FindPathOptions = {}
): string[] | null {
  const {
    direction = TraverseDirection.Outgoing,
    maxDepth = 0,
    edgeTypes,
  } = options;

  // Verify source node exists
  if (!storage.hasNode(sourceId)) {
    throw new Error(`Source node not found: ${sourceId}`);
  }

  // Verify target node exists
  if (!storage.hasNode(targetId)) {
    throw new Error(`Target node not found: ${targetId}`);
  }

  // Same source and target - trivial path
  if (sourceId === targetId) {
    return [sourceId];
  }

  // BFS to find shortest path
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: sourceId, depth: 0 },
  ];

  visited.add(sourceId);

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;

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

    // Explore neighbors
    for (const edge of filteredEdges) {
      const neighborId = edge.source === nodeId ? edge.target : edge.source;

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        parent.set(neighborId, nodeId);

        // Found target - reconstruct path
        if (neighborId === targetId) {
          return reconstructPath(sourceId, targetId, parent);
        }

        queue.push({ nodeId: neighborId, depth: depth + 1 });
      }
    }
  }

  // No path found
  return null;
}

/**
 * Reconstruct the path from source to target using parent map.
 *
 * @param sourceId - The source node ID
 * @param targetId - The target node ID
 * @param parent - Map from node ID to parent node ID
 * @returns Array of node IDs representing the path
 */
function reconstructPath(
  sourceId: string,
  targetId: string,
  parent: Map<string, string>
): string[] {
  const path: string[] = [];
  let current: string | undefined = targetId;

  while (current !== undefined) {
    path.unshift(current);
    if (current === sourceId) {
      break;
    }
    current = parent.get(current);
  }

  return path;
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

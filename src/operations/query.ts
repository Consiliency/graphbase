/**
 * Query operations for finding nodes and edges in the graph.
 *
 * @module operations/query
 *
 * @remarks
 * Provides functions to query nodes and edges from storage using filter criteria.
 * These are thin wrappers around storage methods, providing a consistent
 * operations API.
 *
 * @example
 * ```typescript
 * import { findNodes, findEdges } from './operations/query.js';
 *
 * const people = findNodes(storage, { type: 'Person' });
 * const friendships = findEdges(storage, { type: 'KNOWS' });
 * ```
 */

import type { Storage } from '../storage/index.js';
import type { Node, Edge, NodeFilter, EdgeFilter } from '../types/index.js';

/**
 * Find nodes in storage matching the given filter criteria.
 *
 * @param storage - The storage instance to query
 * @param filter - Optional filter criteria (combined with AND logic)
 * @returns Array of nodes matching the filter
 *
 * @remarks
 * If no filter is provided, returns all nodes in storage.
 * Filter criteria:
 * - `id`: Exact match on node ID
 * - `type`: Exact match on node type
 * - `properties`: Partial match - all specified properties must match
 *
 * @example
 * ```typescript
 * // Find all nodes
 * const allNodes = findNodes(storage);
 *
 * // Find by type
 * const people = findNodes(storage, { type: 'Person' });
 *
 * // Find by type and properties
 * const adults = findNodes(storage, {
 *   type: 'Person',
 *   properties: { adult: true }
 * });
 * ```
 */
export function findNodes(
  storage: Storage,
  filter?: NodeFilter
): Node<Record<string, unknown>>[] {
  return storage.findNodes(filter);
}

/**
 * Find edges in storage matching the given filter criteria.
 *
 * @param storage - The storage instance to query
 * @param filter - Optional filter criteria (combined with AND logic)
 * @returns Array of edges matching the filter
 *
 * @remarks
 * If no filter is provided, returns all edges in storage.
 * Filter criteria:
 * - `id`: Exact match on edge ID
 * - `type`: Exact match on edge type
 * - `source`: Exact match on source node ID
 * - `target`: Exact match on target node ID
 * - `properties`: Partial match - all specified properties must match
 *
 * @example
 * ```typescript
 * // Find all edges
 * const allEdges = findEdges(storage);
 *
 * // Find by type
 * const knows = findEdges(storage, { type: 'KNOWS' });
 *
 * // Find edges from a specific node
 * const fromA = findEdges(storage, { source: 'A' });
 *
 * // Find edges between two nodes
 * const between = findEdges(storage, { source: 'A', target: 'B' });
 * ```
 */
export function findEdges(
  storage: Storage,
  filter?: EdgeFilter
): Edge<Record<string, unknown>>[] {
  return storage.findEdges(filter);
}

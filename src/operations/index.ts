/**
 * Graph operations module for querying, traversing, and manipulating graph data.
 *
 * @module operations
 *
 * @remarks
 * This module provides the core graph algorithms and operations:
 *
 * - **Query operations**: Find nodes and edges using filter criteria
 * - **Traversal operations**: Visit connected nodes, find neighbors, compute degree
 * - **Path operations**: Find shortest paths between nodes
 * - **Subgraph operations**: Extract portions of the graph
 *
 * All operations work with any Storage implementation and are pure functions
 * that do not modify the storage.
 *
 * @example
 * ```typescript
 * import {
 *   findNodes,
 *   findEdges,
 *   traverse,
 *   neighbors,
 *   degree,
 *   findPath,
 *   subgraph,
 *   TraverseDirection,
 * } from './operations/index.js';
 *
 * // Query nodes and edges
 * const people = findNodes(storage, { type: 'Person' });
 * const knows = findEdges(storage, { type: 'KNOWS' });
 *
 * // Traverse from a starting node
 * const visited = traverse(storage, 'A', {
 *   direction: TraverseDirection.Outgoing,
 *   maxDepth: 3
 * });
 *
 * // Find path between nodes
 * const path = findPath(storage, 'A', 'Z');
 *
 * // Extract subgraph
 * const sub = subgraph(storage, visited);
 * ```
 */

// Query operations
export { findNodes, findEdges } from './query.js';

// Traversal operations
export {
  traverse,
  neighbors,
  degree,
  TraverseDirection,
} from './traverse.js';
export type { TraverseOptions } from './traverse.js';

// Path operations
export { findPath } from './paths.js';
export type { FindPathOptions } from './paths.js';

// Subgraph operations
export { subgraph } from './subgraph.js';

/**
 * Storage interface for the graph database abstraction layer.
 *
 * @module storage/interface
 *
 * @remarks
 * The Storage interface defines the contract for all storage backends.
 * It provides full CRUD operations for nodes and edges, as well as
 * query methods using filter predicates.
 *
 * Implementations must ensure:
 * - Node IDs are unique across all nodes
 * - Edge IDs are unique across all edges
 * - Edges reference existing nodes
 * - Deleting a node removes all connected edges
 *
 * @example
 * ```typescript
 * import type { Storage } from './storage/interface.js';
 * import { MemoryStorage } from './storage/memory.js';
 *
 * const storage: Storage = new MemoryStorage();
 *
 * storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
 * storage.addEdge({ id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} });
 * ```
 */

import type { Node, Edge, NodeFilter, EdgeFilter, GraphData } from '../types/index.js';

/**
 * Storage interface defining all operations for graph data persistence.
 *
 * @remarks
 * All methods that accept nodes or edges work with any property type.
 * Implementations should store nodes and edges as-is without modification.
 */
export interface Storage {
  // ============================================================
  // Node Operations
  // ============================================================

  /**
   * Add a new node to the storage.
   *
   * @param node - The node to add
   * @returns The added node
   * @throws Error if a node with the same ID already exists
   *
   * @example
   * ```typescript
   * const node = storage.addNode({
   *   id: 'n1',
   *   type: 'Person',
   *   properties: { name: 'Alice' }
   * });
   * ```
   */
  addNode<T extends Record<string, unknown>>(node: Node<T>): Node<T>;

  /**
   * Get a node by its ID.
   *
   * @param id - The node ID to look up
   * @returns The node if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const node = storage.getNode('n1');
   * if (node) {
   *   console.log(node.properties);
   * }
   * ```
   */
  getNode(id: string): Node<Record<string, unknown>> | undefined;

  /**
   * Update an existing node.
   *
   * @param node - The updated node data (must have same ID)
   * @returns The updated node
   * @throws Error if the node does not exist
   *
   * @example
   * ```typescript
   * const updated = storage.updateNode({
   *   id: 'n1',
   *   type: 'Person',
   *   properties: { name: 'Alice', age: 31 }
   * });
   * ```
   */
  updateNode<T extends Record<string, unknown>>(node: Node<T>): Node<T>;

  /**
   * Delete a node and all its connected edges.
   *
   * @param id - The ID of the node to delete
   * @returns True if the node was deleted, false if it didn't exist
   *
   * @remarks
   * This method also removes all edges where the node is either
   * the source or the target.
   *
   * @example
   * ```typescript
   * if (storage.deleteNode('n1')) {
   *   console.log('Node deleted');
   * }
   * ```
   */
  deleteNode(id: string): boolean;

  /**
   * Find nodes matching the given filter criteria.
   *
   * @param filter - Optional filter criteria (all fields combined with AND)
   * @returns Array of matching nodes
   *
   * @example
   * ```typescript
   * // Find all Person nodes
   * const people = storage.findNodes({ type: 'Person' });
   *
   * // Find nodes with specific properties
   * const adults = storage.findNodes({
   *   type: 'Person',
   *   properties: { adult: true }
   * });
   * ```
   */
  findNodes(filter?: NodeFilter): Node<Record<string, unknown>>[];

  /**
   * Get all nodes in the storage.
   *
   * @returns Array of all nodes
   */
  getAllNodes(): Node<Record<string, unknown>>[];

  /**
   * Check if a node with the given ID exists.
   *
   * @param id - The node ID to check
   * @returns True if the node exists
   */
  hasNode(id: string): boolean;

  /**
   * Get the total number of nodes in storage.
   *
   * @returns The node count
   */
  nodeCount(): number;

  // ============================================================
  // Edge Operations
  // ============================================================

  /**
   * Add a new edge to the storage.
   *
   * @param edge - The edge to add
   * @returns The added edge
   * @throws Error if an edge with the same ID already exists
   * @throws Error if the source or target node does not exist
   *
   * @example
   * ```typescript
   * const edge = storage.addEdge({
   *   id: 'e1',
   *   type: 'KNOWS',
   *   source: 'n1',
   *   target: 'n2',
   *   properties: { since: '2020' }
   * });
   * ```
   */
  addEdge<T extends Record<string, unknown>>(edge: Edge<T>): Edge<T>;

  /**
   * Get an edge by its ID.
   *
   * @param id - The edge ID to look up
   * @returns The edge if found, undefined otherwise
   */
  getEdge(id: string): Edge<Record<string, unknown>> | undefined;

  /**
   * Update an existing edge.
   *
   * @param edge - The updated edge data (must have same ID)
   * @returns The updated edge
   * @throws Error if the edge does not exist
   * @throws Error if the new source or target node does not exist
   */
  updateEdge<T extends Record<string, unknown>>(edge: Edge<T>): Edge<T>;

  /**
   * Delete an edge.
   *
   * @param id - The ID of the edge to delete
   * @returns True if the edge was deleted, false if it didn't exist
   */
  deleteEdge(id: string): boolean;

  /**
   * Find edges matching the given filter criteria.
   *
   * @param filter - Optional filter criteria (all fields combined with AND)
   * @returns Array of matching edges
   *
   * @example
   * ```typescript
   * // Find all edges from a node
   * const edges = storage.findEdges({ source: 'n1' });
   *
   * // Find edges of a specific type
   * const knows = storage.findEdges({ type: 'KNOWS' });
   * ```
   */
  findEdges(filter?: EdgeFilter): Edge<Record<string, unknown>>[];

  /**
   * Get all edges in the storage.
   *
   * @returns Array of all edges
   */
  getAllEdges(): Edge<Record<string, unknown>>[];

  /**
   * Check if an edge with the given ID exists.
   *
   * @param id - The edge ID to check
   * @returns True if the edge exists
   */
  hasEdge(id: string): boolean;

  /**
   * Get the total number of edges in storage.
   *
   * @returns The edge count
   */
  edgeCount(): number;

  /**
   * Get all edges originating from a node.
   *
   * @param nodeId - The source node ID
   * @returns Array of edges where the node is the source
   */
  getEdgesFrom(nodeId: string): Edge<Record<string, unknown>>[];

  /**
   * Get all edges pointing to a node.
   *
   * @param nodeId - The target node ID
   * @returns Array of edges where the node is the target
   */
  getEdgesTo(nodeId: string): Edge<Record<string, unknown>>[];

  /**
   * Get all edges between two nodes (in either direction).
   *
   * @param nodeId1 - First node ID
   * @param nodeId2 - Second node ID
   * @returns Array of edges connecting the two nodes
   */
  getEdgesBetween(nodeId1: string, nodeId2: string): Edge<Record<string, unknown>>[];

  // ============================================================
  // Bulk Operations
  // ============================================================

  /**
   * Remove all nodes and edges from storage.
   */
  clear(): void;

  /**
   * Get all data as a GraphData object.
   *
   * @returns GraphData containing all nodes and edges
   */
  getData(): GraphData;

  /**
   * Replace all data with the provided GraphData.
   *
   * @param data - The new graph data
   * @throws Error if edge references are invalid
   *
   * @remarks
   * This clears existing data and loads the new data.
   * Edges are validated to ensure source and target nodes exist.
   */
  setData(data: GraphData): void;
}

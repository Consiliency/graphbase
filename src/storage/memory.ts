/**
 * In-memory storage implementation for the graph database.
 *
 * @module storage/memory
 *
 * @remarks
 * MemoryStorage provides a fast, in-memory implementation of the Storage interface.
 * It uses Map data structures for O(1) node and edge lookups by ID.
 *
 * This implementation is suitable for:
 * - Development and testing
 * - Small to medium-sized graphs
 * - Applications that don't require persistence
 *
 * For persistent storage, use a different backend (e.g., file-based or database-backed).
 *
 * @example
 * ```typescript
 * import { MemoryStorage } from './storage/memory.js';
 *
 * const storage = new MemoryStorage();
 * storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
 * ```
 */

import type { Node, Edge, NodeFilter, EdgeFilter, GraphData } from '../types/index.js';
import type { Storage } from './interface.js';

/**
 * In-memory implementation of the Storage interface.
 *
 * @remarks
 * Uses Map<string, Node> and Map<string, Edge> for fast ID-based lookups.
 * All operations are synchronous and data is lost when the instance is garbage collected.
 */
export class MemoryStorage implements Storage {
  /** Map of node ID to node object */
  private nodes: Map<string, Node<Record<string, unknown>>> = new Map();

  /** Map of edge ID to edge object */
  private edges: Map<string, Edge<Record<string, unknown>>> = new Map();

  // ============================================================
  // Node Operations
  // ============================================================

  /**
   * @inheritdoc
   */
  addNode<T extends Record<string, unknown>>(node: Node<T>): Node<T> {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with id "${node.id}" already exists`);
    }
    this.nodes.set(node.id, node as Node<Record<string, unknown>>);
    return node;
  }

  /**
   * @inheritdoc
   */
  getNode(id: string): Node<Record<string, unknown>> | undefined {
    return this.nodes.get(id);
  }

  /**
   * @inheritdoc
   */
  updateNode<T extends Record<string, unknown>>(node: Node<T>): Node<T> {
    if (!this.nodes.has(node.id)) {
      throw new Error(`Node with id "${node.id}" does not exist`);
    }
    this.nodes.set(node.id, node as Node<Record<string, unknown>>);
    return node;
  }

  /**
   * @inheritdoc
   */
  deleteNode(id: string): boolean {
    if (!this.nodes.has(id)) {
      return false;
    }

    // Remove all edges connected to this node
    const edgesToDelete: string[] = [];
    for (const [edgeId, edge] of this.edges) {
      if (edge.source === id || edge.target === id) {
        edgesToDelete.push(edgeId);
      }
    }
    for (const edgeId of edgesToDelete) {
      this.edges.delete(edgeId);
    }

    this.nodes.delete(id);
    return true;
  }

  /**
   * @inheritdoc
   */
  findNodes(filter?: NodeFilter): Node<Record<string, unknown>>[] {
    if (!filter) {
      return Array.from(this.nodes.values());
    }

    return Array.from(this.nodes.values()).filter((node) => this.matchesNodeFilter(node, filter));
  }

  /**
   * @inheritdoc
   */
  getAllNodes(): Node<Record<string, unknown>>[] {
    return Array.from(this.nodes.values());
  }

  /**
   * @inheritdoc
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * @inheritdoc
   */
  nodeCount(): number {
    return this.nodes.size;
  }

  // ============================================================
  // Edge Operations
  // ============================================================

  /**
   * @inheritdoc
   */
  addEdge<T extends Record<string, unknown>>(edge: Edge<T>): Edge<T> {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with id "${edge.id}" already exists`);
    }
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node with id "${edge.source}" does not exist`);
    }
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node with id "${edge.target}" does not exist`);
    }
    this.edges.set(edge.id, edge as Edge<Record<string, unknown>>);
    return edge;
  }

  /**
   * @inheritdoc
   */
  getEdge(id: string): Edge<Record<string, unknown>> | undefined {
    return this.edges.get(id);
  }

  /**
   * @inheritdoc
   */
  updateEdge<T extends Record<string, unknown>>(edge: Edge<T>): Edge<T> {
    if (!this.edges.has(edge.id)) {
      throw new Error(`Edge with id "${edge.id}" does not exist`);
    }
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node with id "${edge.source}" does not exist`);
    }
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node with id "${edge.target}" does not exist`);
    }
    this.edges.set(edge.id, edge as Edge<Record<string, unknown>>);
    return edge;
  }

  /**
   * @inheritdoc
   */
  deleteEdge(id: string): boolean {
    return this.edges.delete(id);
  }

  /**
   * @inheritdoc
   */
  findEdges(filter?: EdgeFilter): Edge<Record<string, unknown>>[] {
    if (!filter) {
      return Array.from(this.edges.values());
    }

    return Array.from(this.edges.values()).filter((edge) => this.matchesEdgeFilter(edge, filter));
  }

  /**
   * @inheritdoc
   */
  getAllEdges(): Edge<Record<string, unknown>>[] {
    return Array.from(this.edges.values());
  }

  /**
   * @inheritdoc
   */
  hasEdge(id: string): boolean {
    return this.edges.has(id);
  }

  /**
   * @inheritdoc
   */
  edgeCount(): number {
    return this.edges.size;
  }

  /**
   * @inheritdoc
   */
  getEdgesFrom(nodeId: string): Edge<Record<string, unknown>>[] {
    return Array.from(this.edges.values()).filter((edge) => edge.source === nodeId);
  }

  /**
   * @inheritdoc
   */
  getEdgesTo(nodeId: string): Edge<Record<string, unknown>>[] {
    return Array.from(this.edges.values()).filter((edge) => edge.target === nodeId);
  }

  /**
   * @inheritdoc
   */
  getEdgesBetween(nodeId1: string, nodeId2: string): Edge<Record<string, unknown>>[] {
    return Array.from(this.edges.values()).filter(
      (edge) =>
        (edge.source === nodeId1 && edge.target === nodeId2) ||
        (edge.source === nodeId2 && edge.target === nodeId1)
    );
  }

  // ============================================================
  // Bulk Operations
  // ============================================================

  /**
   * @inheritdoc
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  /**
   * @inheritdoc
   */
  getData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  /**
   * @inheritdoc
   */
  setData(data: GraphData): void {
    // Clear existing data
    this.clear();

    // Add all nodes first
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
    }

    // Then add edges (validating references)
    for (const edge of data.edges) {
      if (!this.nodes.has(edge.source)) {
        throw new Error(`Source node with id "${edge.source}" does not exist`);
      }
      if (!this.nodes.has(edge.target)) {
        throw new Error(`Target node with id "${edge.target}" does not exist`);
      }
      this.edges.set(edge.id, edge);
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  /**
   * Check if a node matches the given filter criteria.
   *
   * @param node - The node to check
   * @param filter - The filter criteria
   * @returns True if the node matches all criteria
   */
  private matchesNodeFilter(node: Node<Record<string, unknown>>, filter: NodeFilter): boolean {
    // Check ID filter
    if (filter.id !== undefined && node.id !== filter.id) {
      return false;
    }

    // Check type filter
    if (filter.type !== undefined && node.type !== filter.type) {
      return false;
    }

    // Check properties filter (partial match)
    if (filter.properties !== undefined) {
      for (const [key, value] of Object.entries(filter.properties)) {
        if (node.properties[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if an edge matches the given filter criteria.
   *
   * @param edge - The edge to check
   * @param filter - The filter criteria
   * @returns True if the edge matches all criteria
   */
  private matchesEdgeFilter(edge: Edge<Record<string, unknown>>, filter: EdgeFilter): boolean {
    // Check ID filter
    if (filter.id !== undefined && edge.id !== filter.id) {
      return false;
    }

    // Check type filter
    if (filter.type !== undefined && edge.type !== filter.type) {
      return false;
    }

    // Check source filter
    if (filter.source !== undefined && edge.source !== filter.source) {
      return false;
    }

    // Check target filter
    if (filter.target !== undefined && edge.target !== filter.target) {
      return false;
    }

    // Check properties filter (partial match)
    if (filter.properties !== undefined) {
      for (const [key, value] of Object.entries(filter.properties)) {
        if (edge.properties[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }
}

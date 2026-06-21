/**
 * @file Graph class - main API facade for the graph database abstraction layer
 * @description High-level Graph class that integrates storage, schema, operations, and bundle modules
 *
 * @module core/Graph
 */

import type { Node, Edge, Relationship, NodeFilter, EdgeFilter } from '../types/index.js';
import type { SchemaDefinition, ValidatorOptions } from '../schema/index.js';
import { SchemaRegistry, Validator } from '../schema/index.js';
import type { Storage } from '../storage/index.js';
import { createStorage, StorageBackend } from '../storage/index.js';
import {
  findNodes as opsFindNodes,
  findEdges as opsFindEdges,
  traverse as opsTraverse,
  findPath as opsFindPath,
} from '../operations/index.js';
import type { TraverseOptions, FindPathOptions } from '../operations/index.js';
import type { Bundle, ExportOptions as BundleExportOptions, ImportOptions as BundleImportOptions, ImportResult } from '../bundle/index.js';
import { exportBundle, importBundle } from '../bundle/index.js';

/**
 * Options for configuring the Graph instance.
 *
 * @example
 * ```typescript
 * const graph = new Graph({
 *   strictValidation: true,
 *   validateFormats: true,
 * });
 * ```
 */
export interface GraphOptions {
  /**
   * When true, validation fails if no schema is registered for the type,
   * and invalid data throws errors.
   * When false (default), unregistered types pass validation.
   * @default false
   */
  strictValidation?: boolean;

  /**
   * When true, validates string formats (email, date, uri, etc.).
   * @default false
   */
  validateFormats?: boolean;

  /**
   * Storage backend to use.
   * @default StorageBackend.Memory
   */
  storageBackend?: StorageBackend;
}

/**
 * Options for exporting the graph to a bundle.
 *
 * @example
 * ```typescript
 * const bundle = graph.export({
 *   includeSchemas: true,
 *   metadata: { name: 'My Graph' }
 * });
 * ```
 */
export interface ExportOptions {
  /**
   * Include registered schemas in the bundle.
   * @default false
   */
  includeSchemas?: boolean;

  /**
   * Metadata to include in the bundle.
   */
  metadata?: {
    name?: string;
    description?: string;
    createdAt?: string;
    custom?: Record<string, unknown>;
  };
}

/**
 * Options for importing a bundle into the graph.
 *
 * @example
 * ```typescript
 * graph.import(bundle, {
 *   importSchemas: true,
 *   merge: false
 * });
 * ```
 */
export interface ImportOptions {
  /**
   * Import schemas from the bundle into the graph's registry.
   * @default false
   */
  importSchemas?: boolean;

  /**
   * Merge with existing data instead of replacing.
   * @default false
   */
  merge?: boolean;

  /**
   * Skip bundle validation before import.
   * @default false
   */
  skipValidation?: boolean;
}

/**
 * Graph provides a high-level API for working with graph data.
 *
 * @remarks
 * The Graph class serves as the main entry point for the graph database abstraction layer.
 * It integrates all underlying modules:
 * - Storage: Persistence of nodes and edges
 * - Schema: JSON Schema validation for properties
 * - Operations: Graph traversal and path finding
 * - Bundle: Import/export to JSON format
 *
 * @example
 * ```typescript
 * import { Graph } from './core/Graph.js';
 *
 * // Create a graph
 * const graph = new Graph();
 *
 * // Register schemas
 * graph.registerSchema('Person', {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   },
 *   required: ['name']
 * });
 *
 * // Add nodes and edges
 * graph.addNode({ id: 'p1', type: 'Person', properties: { name: 'Alice', age: 30 } });
 * graph.addNode({ id: 'p2', type: 'Person', properties: { name: 'Bob', age: 25 } });
 * graph.addEdge({ id: 'e1', type: 'KNOWS', source: 'p1', target: 'p2', properties: {} });
 *
 * // Query and traverse
 * const people = graph.findNodes({ type: 'Person' });
 * const path = graph.findPath('p1', 'p2');
 *
 * // Export to bundle
 * const bundle = graph.export({ includeSchemas: true });
 * ```
 */
export class Graph {
  /**
   * The storage backend for nodes and edges.
   */
  private readonly storage: Storage;

  /**
   * The schema registry for node and edge type schemas.
   */
  private readonly schemaRegistry: SchemaRegistry;

  /**
   * The validator for schema validation.
   */
  private readonly validator: Validator;

  /**
   * Whether strict validation mode is enabled.
   */
  private readonly strictValidation: boolean;

  /**
   * Map of relationship types to their definitions.
   */
  private readonly relationships: Map<string, Relationship>;

  /**
   * Creates a new Graph instance.
   *
   * @param options - Configuration options for the graph
   *
   * @example
   * ```typescript
   * // Create with default options
   * const graph = new Graph();
   *
   * // Create with strict validation
   * const strictGraph = new Graph({ strictValidation: true });
   * ```
   */
  constructor(options: GraphOptions = {}) {
    const {
      strictValidation = false,
      validateFormats = false,
      storageBackend = StorageBackend.Memory,
    } = options;

    this.strictValidation = strictValidation;
    this.storage = createStorage({ backend: storageBackend });
    this.schemaRegistry = new SchemaRegistry();

    const validatorOptions: ValidatorOptions = {
      strict: strictValidation,
      validateFormats,
    };
    this.validator = new Validator(this.schemaRegistry, validatorOptions);

    this.relationships = new Map();
  }

  // ============================================================
  // Node Operations
  // ============================================================

  /**
   * Adds a node to the graph.
   *
   * @param node - The node to add
   * @throws Error if node ID already exists
   * @throws Error if validation fails in strict mode
   *
   * @example
   * ```typescript
   * graph.addNode({
   *   id: 'person-1',
   *   type: 'Person',
   *   properties: { name: 'Alice', age: 30 }
   * });
   * ```
   */
  addNode<T extends Record<string, unknown>>(node: Node<T>): void {
    // Validate if strict mode is enabled
    if (this.strictValidation) {
      this.validator.validateNodeOrThrow(node as Node<Record<string, unknown>>);
    }

    this.storage.addNode(node);
  }

  /**
   * Gets a node by its ID.
   *
   * @param id - The node ID to look up
   * @returns The node if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const node = graph.getNode('person-1');
   * if (node) {
   *   console.log(node.properties.name);
   * }
   * ```
   */
  getNode(id: string): Node<Record<string, unknown>> | undefined {
    return this.storage.getNode(id);
  }

  /**
   * Removes a node from the graph.
   *
   * @param id - The ID of the node to remove
   * @returns True if the node was removed, false if it didn't exist
   *
   * @remarks
   * Removing a node also removes all edges connected to it.
   *
   * @example
   * ```typescript
   * if (graph.removeNode('person-1')) {
   *   console.log('Node removed');
   * }
   * ```
   */
  removeNode(id: string): boolean {
    return this.storage.deleteNode(id);
  }

  /**
   * Finds nodes matching the given filter criteria.
   *
   * @param filter - Optional filter criteria
   * @returns Array of matching nodes
   *
   * @example
   * ```typescript
   * // Find all Person nodes
   * const people = graph.findNodes({ type: 'Person' });
   *
   * // Find nodes with specific properties
   * const adults = graph.findNodes({
   *   type: 'Person',
   *   properties: { isAdult: true }
   * });
   * ```
   */
  findNodes(filter?: NodeFilter): Node<Record<string, unknown>>[] {
    return opsFindNodes(this.storage, filter);
  }

  /**
   * Checks if a node with the given ID exists.
   *
   * @param id - The node ID to check
   * @returns True if the node exists
   */
  hasNode(id: string): boolean {
    return this.storage.hasNode(id);
  }

  /**
   * Gets the total number of nodes in the graph.
   */
  get nodeCount(): number {
    return this.storage.nodeCount();
  }

  // ============================================================
  // Edge Operations
  // ============================================================

  /**
   * Adds an edge to the graph.
   *
   * @param edge - The edge to add
   * @throws Error if edge ID already exists
   * @throws Error if source or target node doesn't exist
   * @throws Error if validation fails in strict mode
   *
   * @example
   * ```typescript
   * graph.addEdge({
   *   id: 'edge-1',
   *   type: 'KNOWS',
   *   source: 'person-1',
   *   target: 'person-2',
   *   properties: { since: '2020-01-01' }
   * });
   * ```
   */
  addEdge<T extends Record<string, unknown>>(edge: Edge<T>): void {
    // Validate edge properties if strict mode is enabled
    if (this.strictValidation) {
      this.validator.validateEdgeOrThrow(edge as Edge<Record<string, unknown>>);
    }

    // Note: Relationship validation is informational in permissive mode
    // The storage layer will throw if source/target nodes don't exist
    this.storage.addEdge(edge);
  }

  /**
   * Gets an edge by its ID.
   *
   * @param id - The edge ID to look up
   * @returns The edge if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const edge = graph.getEdge('edge-1');
   * if (edge) {
   *   console.log(`${edge.source} -> ${edge.target}`);
   * }
   * ```
   */
  getEdge(id: string): Edge<Record<string, unknown>> | undefined {
    return this.storage.getEdge(id);
  }

  /**
   * Removes an edge from the graph.
   *
   * @param id - The ID of the edge to remove
   * @returns True if the edge was removed, false if it didn't exist
   *
   * @example
   * ```typescript
   * if (graph.removeEdge('edge-1')) {
   *   console.log('Edge removed');
   * }
   * ```
   */
  removeEdge(id: string): boolean {
    return this.storage.deleteEdge(id);
  }

  /**
   * Finds edges matching the given filter criteria.
   *
   * @param filter - Optional filter criteria
   * @returns Array of matching edges
   *
   * @example
   * ```typescript
   * // Find all KNOWS edges
   * const knows = graph.findEdges({ type: 'KNOWS' });
   *
   * // Find edges from a specific node
   * const outgoing = graph.findEdges({ source: 'person-1' });
   * ```
   */
  findEdges(filter?: EdgeFilter): Edge<Record<string, unknown>>[] {
    return opsFindEdges(this.storage, filter);
  }

  /**
   * Checks if an edge with the given ID exists.
   *
   * @param id - The edge ID to check
   * @returns True if the edge exists
   */
  hasEdge(id: string): boolean {
    return this.storage.hasEdge(id);
  }

  /**
   * Gets the total number of edges in the graph.
   */
  get edgeCount(): number {
    return this.storage.edgeCount();
  }

  // ============================================================
  // Schema Operations
  // ============================================================

  /**
   * Registers a JSON Schema for a node type.
   *
   * @param nodeType - The node type name
   * @param schema - The JSON Schema definition
   *
   * @example
   * ```typescript
   * graph.registerSchema('Person', {
   *   type: 'object',
   *   properties: {
   *     name: { type: 'string', minLength: 1 },
   *     age: { type: 'number', minimum: 0 }
   *   },
   *   required: ['name']
   * });
   * ```
   */
  registerSchema(nodeType: string, schema: SchemaDefinition): void {
    this.schemaRegistry.registerNodeSchema(nodeType, schema);
    // Clear validator cache for this type
    this.validator.clearCacheForType(nodeType, 'node');
  }

  /**
   * Registers a JSON Schema for an edge type.
   *
   * @param edgeType - The edge type name
   * @param schema - The JSON Schema definition
   *
   * @example
   * ```typescript
   * graph.registerEdgeSchema('KNOWS', {
   *   type: 'object',
   *   properties: {
   *     since: { type: 'string' },
   *     strength: { type: 'number', minimum: 0, maximum: 1 }
   *   }
   * });
   * ```
   */
  registerEdgeSchema(edgeType: string, schema: SchemaDefinition): void {
    this.schemaRegistry.registerEdgeSchema(edgeType, schema);
    // Clear validator cache for this type
    this.validator.clearCacheForType(edgeType, 'edge');
  }

  /**
   * Registers a relationship constraint.
   *
   * @param relationship - The relationship definition
   *
   * @remarks
   * Relationships define which node types can be connected by which edge types.
   * In permissive mode, violations are allowed but may be logged.
   * In strict mode, violations would throw errors.
   *
   * @example
   * ```typescript
   * graph.registerRelationship({
   *   type: 'KNOWS',
   *   sourceType: 'Person',
   *   targetType: 'Person'
   * });
   * ```
   */
  registerRelationship(relationship: Relationship): void {
    this.relationships.set(relationship.type, relationship);
  }

  /**
   * Checks if a schema is registered for a node type.
   *
   * @param nodeType - The node type to check
   * @returns True if a schema is registered
   */
  hasSchema(nodeType: string): boolean {
    return this.schemaRegistry.hasNodeSchema(nodeType);
  }

  /**
   * Checks if a schema is registered for an edge type.
   *
   * @param edgeType - The edge type to check
   * @returns True if a schema is registered
   */
  hasEdgeSchema(edgeType: string): boolean {
    return this.schemaRegistry.hasEdgeSchema(edgeType);
  }

  /**
   * Checks if a relationship is registered for an edge type.
   *
   * @param edgeType - The edge type to check
   * @returns True if a relationship is registered
   */
  hasRelationship(edgeType: string): boolean {
    return this.relationships.has(edgeType);
  }

  // ============================================================
  // Graph Operations
  // ============================================================

  /**
   * Traverses the graph starting from a given node.
   *
   * @param startNodeId - The ID of the node to start from
   * @param options - Traversal options
   * @returns Array of visited node IDs in BFS order
   * @throws Error if the start node doesn't exist
   *
   * @example
   * ```typescript
   * // Traverse all reachable nodes
   * const visited = graph.traverse('person-1');
   *
   * // Traverse with depth limit
   * const nearby = graph.traverse('person-1', { maxDepth: 2 });
   *
   * // Traverse in both directions
   * const connected = graph.traverse('person-1', {
   *   direction: TraverseDirection.Both
   * });
   * ```
   */
  traverse(startNodeId: string, options?: TraverseOptions): string[] {
    return opsTraverse(this.storage, startNodeId, options);
  }

  /**
   * Finds the shortest path between two nodes.
   *
   * @param sourceId - The source node ID
   * @param targetId - The target node ID
   * @param options - Path finding options
   * @returns Array of node IDs representing the path, or null if no path exists
   * @throws Error if source or target node doesn't exist
   *
   * @example
   * ```typescript
   * const path = graph.findPath('person-1', 'person-3');
   * if (path) {
   *   console.log('Path:', path.join(' -> '));
   * } else {
   *   console.log('No path found');
   * }
   * ```
   */
  findPath(sourceId: string, targetId: string, options?: FindPathOptions): string[] | null {
    return opsFindPath(this.storage, sourceId, targetId, options);
  }

  // ============================================================
  // Bundle Operations
  // ============================================================

  /**
   * Exports the graph to a bundle.
   *
   * @param options - Export options
   * @returns A bundle containing all graph data
   *
   * @example
   * ```typescript
   * const bundle = graph.export({
   *   includeSchemas: true,
   *   metadata: { name: 'My Graph' }
   * });
   *
   * // Serialize to JSON
   * const json = JSON.stringify(bundle, null, 2);
   * ```
   */
  export(options: ExportOptions = {}): Bundle {
    const { includeSchemas = false, metadata } = options;

    const bundleOptions: BundleExportOptions = {
      metadata,
    };

    if (includeSchemas) {
      bundleOptions.schemaRegistry = this.schemaRegistry;
    }

    return exportBundle(this.storage, bundleOptions);
  }

  /**
   * Imports a bundle into the graph.
   *
   * @param bundle - The bundle to import
   * @param options - Import options
   * @returns Import result with counts
   * @throws Error if import fails
   *
   * @example
   * ```typescript
   * const bundle = JSON.parse(jsonString) as Bundle;
   *
   * const result = graph.import(bundle, {
   *   importSchemas: true,
   *   merge: false
   * });
   *
   * console.log(`Imported ${result.nodesImported} nodes`);
   * ```
   */
  import(bundle: Bundle, options: ImportOptions = {}): ImportResult {
    const { importSchemas = false, merge = false, skipValidation = false } = options;

    const bundleOptions: BundleImportOptions = {
      merge,
      skipValidation,
    };

    if (importSchemas) {
      bundleOptions.schemaRegistry = this.schemaRegistry;
    }

    return importBundle(this.storage, bundle, bundleOptions);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Clears all nodes and edges from the graph.
   *
   * @remarks
   * This does not clear registered schemas or relationships.
   *
   * @example
   * ```typescript
   * graph.clear();
   * console.log(graph.nodeCount); // 0
   * ```
   */
  clear(): void {
    this.storage.clear();
  }
}

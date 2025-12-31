/**
 * @file Schema registry for managing JSON schemas
 * @description Central registry for node and edge type schemas
 *
 * @module schema/registry
 */

import type { SchemaDefinition } from './types.js';

/**
 * SchemaRegistry manages JSON Schema definitions for node and edge types.
 *
 * @remarks
 * The registry provides methods to register, retrieve, and manage schemas
 * for different entity types. Schemas are used by the Validator to
 * validate node and edge properties.
 *
 * @example
 * ```typescript
 * const registry = new SchemaRegistry();
 *
 * // Register a schema for Person nodes
 * registry.registerNodeSchema('Person', {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   },
 *   required: ['name']
 * });
 *
 * // Check if a schema exists
 * if (registry.hasNodeSchema('Person')) {
 *   const schema = registry.getNodeSchema('Person');
 * }
 * ```
 */
export class SchemaRegistry {
  /**
   * Map of node type names to their schemas.
   */
  private readonly nodeSchemas: Map<string, SchemaDefinition>;

  /**
   * Map of edge type names to their schemas.
   */
  private readonly edgeSchemas: Map<string, SchemaDefinition>;

  /**
   * Creates a new SchemaRegistry.
   */
  constructor() {
    this.nodeSchemas = new Map();
    this.edgeSchemas = new Map();
  }

  /**
   * Registers a JSON Schema for a node type.
   *
   * @param type - The node type name (e.g., 'Person', 'Company')
   * @param schema - The JSON Schema definition for the node's properties
   *
   * @remarks
   * If a schema is already registered for this type, it will be overwritten.
   *
   * @example
   * ```typescript
   * registry.registerNodeSchema('Person', {
   *   type: 'object',
   *   properties: {
   *     name: { type: 'string' },
   *     email: { type: 'string', format: 'email' }
   *   },
   *   required: ['name']
   * });
   * ```
   */
  registerNodeSchema(type: string, schema: SchemaDefinition): void {
    this.nodeSchemas.set(type, schema);
  }

  /**
   * Registers a JSON Schema for an edge type.
   *
   * @param type - The edge type name (e.g., 'KNOWS', 'WORKS_AT')
   * @param schema - The JSON Schema definition for the edge's properties
   *
   * @remarks
   * If a schema is already registered for this type, it will be overwritten.
   *
   * @example
   * ```typescript
   * registry.registerEdgeSchema('KNOWS', {
   *   type: 'object',
   *   properties: {
   *     since: { type: 'string', format: 'date' },
   *     strength: { type: 'number', minimum: 0, maximum: 1 }
   *   }
   * });
   * ```
   */
  registerEdgeSchema(type: string, schema: SchemaDefinition): void {
    this.edgeSchemas.set(type, schema);
  }

  /**
   * Gets the schema for a node type.
   *
   * @param type - The node type name
   * @returns The schema definition, or undefined if not registered
   *
   * @example
   * ```typescript
   * const schema = registry.getNodeSchema('Person');
   * if (schema) {
   *   console.log('Person schema:', schema);
   * }
   * ```
   */
  getNodeSchema(type: string): SchemaDefinition | undefined {
    return this.nodeSchemas.get(type);
  }

  /**
   * Gets the schema for an edge type.
   *
   * @param type - The edge type name
   * @returns The schema definition, or undefined if not registered
   *
   * @example
   * ```typescript
   * const schema = registry.getEdgeSchema('KNOWS');
   * if (schema) {
   *   console.log('KNOWS schema:', schema);
   * }
   * ```
   */
  getEdgeSchema(type: string): SchemaDefinition | undefined {
    return this.edgeSchemas.get(type);
  }

  /**
   * Checks if a schema is registered for a node type.
   *
   * @param type - The node type name
   * @returns True if a schema is registered, false otherwise
   *
   * @example
   * ```typescript
   * if (registry.hasNodeSchema('Person')) {
   *   // Schema exists, validation will be applied
   * }
   * ```
   */
  hasNodeSchema(type: string): boolean {
    return this.nodeSchemas.has(type);
  }

  /**
   * Checks if a schema is registered for an edge type.
   *
   * @param type - The edge type name
   * @returns True if a schema is registered, false otherwise
   *
   * @example
   * ```typescript
   * if (registry.hasEdgeSchema('KNOWS')) {
   *   // Schema exists, validation will be applied
   * }
   * ```
   */
  hasEdgeSchema(type: string): boolean {
    return this.edgeSchemas.has(type);
  }

  /**
   * Removes the schema for a node type.
   *
   * @param type - The node type name
   *
   * @remarks
   * This is a no-op if no schema is registered for the type.
   *
   * @example
   * ```typescript
   * registry.removeNodeSchema('Person');
   * console.log(registry.hasNodeSchema('Person')); // false
   * ```
   */
  removeNodeSchema(type: string): void {
    this.nodeSchemas.delete(type);
  }

  /**
   * Removes the schema for an edge type.
   *
   * @param type - The edge type name
   *
   * @remarks
   * This is a no-op if no schema is registered for the type.
   *
   * @example
   * ```typescript
   * registry.removeEdgeSchema('KNOWS');
   * console.log(registry.hasEdgeSchema('KNOWS')); // false
   * ```
   */
  removeEdgeSchema(type: string): void {
    this.edgeSchemas.delete(type);
  }

  /**
   * Lists all registered node type names.
   *
   * @returns Array of node type names
   *
   * @example
   * ```typescript
   * const types = registry.listNodeTypes();
   * console.log('Registered node types:', types);
   * // ['Person', 'Company', 'Product']
   * ```
   */
  listNodeTypes(): string[] {
    return Array.from(this.nodeSchemas.keys());
  }

  /**
   * Lists all registered edge type names.
   *
   * @returns Array of edge type names
   *
   * @example
   * ```typescript
   * const types = registry.listEdgeTypes();
   * console.log('Registered edge types:', types);
   * // ['KNOWS', 'WORKS_AT', 'PURCHASED']
   * ```
   */
  listEdgeTypes(): string[] {
    return Array.from(this.edgeSchemas.keys());
  }

  /**
   * Removes all registered schemas.
   *
   * @remarks
   * Clears both node and edge schema registries.
   *
   * @example
   * ```typescript
   * registry.clear();
   * console.log(registry.listNodeTypes()); // []
   * console.log(registry.listEdgeTypes()); // []
   * ```
   */
  clear(): void {
    this.nodeSchemas.clear();
    this.edgeSchemas.clear();
  }

  /**
   * Gets the total number of registered schemas.
   *
   * @returns Total count of node and edge schemas
   *
   * @example
   * ```typescript
   * const count = registry.size;
   * console.log('Total schemas:', count);
   * ```
   */
  get size(): number {
    return this.nodeSchemas.size + this.edgeSchemas.size;
  }

  /**
   * Gets the number of registered node schemas.
   *
   * @returns Count of node schemas
   */
  get nodeSchemaCount(): number {
    return this.nodeSchemas.size;
  }

  /**
   * Gets the number of registered edge schemas.
   *
   * @returns Count of edge schemas
   */
  get edgeSchemaCount(): number {
    return this.edgeSchemas.size;
  }
}

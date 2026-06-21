/**
 * Core-Graph: A TypeScript graph database abstraction layer.
 *
 * @module core-graph
 *
 * @remarks
 * This library provides a type-safe, feature-rich graph database abstraction
 * with the following capabilities:
 *
 * - **Graph**: High-level API for working with graph data
 * - **Types**: Type-safe node and edge definitions
 * - **Schema**: JSON Schema validation for properties
 * - **Storage**: Pluggable storage backends (in-memory)
 * - **Operations**: Graph traversal, path finding, and queries
 * - **Bundle**: JSON import/export for serialization
 *
 * @example
 * ```typescript
 * import { Graph } from 'core-graph';
 *
 * // Create a graph
 * const graph = new Graph();
 *
 * // Register schemas for validation
 * graph.registerSchema('Person', {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', minLength: 1 },
 *     age: { type: 'number', minimum: 0 }
 *   },
 *   required: ['name']
 * });
 *
 * // Add nodes
 * graph.addNode({
 *   id: 'alice',
 *   type: 'Person',
 *   properties: { name: 'Alice', age: 30 }
 * });
 *
 * graph.addNode({
 *   id: 'bob',
 *   type: 'Person',
 *   properties: { name: 'Bob', age: 25 }
 * });
 *
 * // Add edges
 * graph.addEdge({
 *   id: 'e1',
 *   type: 'KNOWS',
 *   source: 'alice',
 *   target: 'bob',
 *   properties: { since: '2020-01-01' }
 * });
 *
 * // Query the graph
 * const people = graph.findNodes({ type: 'Person' });
 * const path = graph.findPath('alice', 'bob');
 *
 * // Export to JSON bundle
 * const bundle = graph.export({ includeSchemas: true });
 * console.log(JSON.stringify(bundle, null, 2));
 * ```
 */

// Core API
export { Graph } from './core/index.js';
export type { GraphOptions, ExportOptions, ImportOptions } from './core/index.js';

// Types
export type { Node, NodeFilter, Edge, EdgeFilter, Relationship, GraphData } from './types/index.js';

// Schema
export { SchemaRegistry, Validator, ValidationError, SchemaNotFoundError, InvalidSchemaError } from './schema/index.js';
export type { SchemaDefinition, ValidationResult, ValidationErrorDetail, ValidatorOptions } from './schema/index.js';

// Storage
export { MemoryStorage, createStorage, StorageBackend } from './storage/index.js';
export type { Storage, StorageOptions } from './storage/index.js';

// Operations
export {
  findNodes,
  findEdges,
  traverse,
  neighbors,
  degree,
  findPath,
  subgraph,
  TraverseDirection,
} from './operations/index.js';
export type { TraverseOptions, FindPathOptions } from './operations/index.js';

// Bundle
// NOTE: canonicalize/canonicalStringify are intentionally NOT re-exported at the
// package root. They remain available from './bundle' for internal use, but the
// canonical-serialization surface is provisional pending the spine's `canon v1`
// (and the narrow CanonicalGraphBundle envelope planned in P2), so we avoid
// committing to them as a root-level public contract here.
export {
  exportBundle,
  importBundle,
  validateBundle,
  BundleImportError,
  BUNDLE_VERSION,
} from './bundle/index.js';
export type {
  Bundle,
  BundleVersion,
  BundleMetadata,
  BundleSchemas,
  ExportOptions as BundleExportOptions,
  ImportOptions as BundleImportOptions,
  ImportResult,
  BundleValidationResult,
  BundleValidationError,
  BundleValidationWarning,
} from './bundle/index.js';

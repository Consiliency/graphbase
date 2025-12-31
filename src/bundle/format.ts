/**
 * @file Bundle format type definitions
 * @description Defines the Bundle type for JSON serialization of graph data
 *
 * @module bundle/format
 */

import type { Node, Edge } from '../types/index.js';
import type { SchemaDefinition } from '../schema/index.js';

/**
 * Current bundle format version.
 *
 * @remarks
 * This version number follows semantic versioning and indicates
 * the bundle format specification version, not the library version.
 *
 * - Major version: Breaking changes to bundle structure
 * - Minor version: New optional fields added
 * - Patch version: Clarifications or documentation updates
 */
export const BUNDLE_VERSION = '1.0.0' as const;

/**
 * Type representing the bundle version string.
 */
export type BundleVersion = typeof BUNDLE_VERSION;

/**
 * Metadata associated with a bundle.
 *
 * @remarks
 * Metadata provides contextual information about the bundle,
 * including when it was created and what it contains.
 *
 * @example
 * ```typescript
 * const metadata: BundleMetadata = {
 *   name: 'Social Network Graph',
 *   description: 'Graph of users and their relationships',
 *   createdAt: '2025-12-30T12:00:00Z',
 *   custom: { version: '1.0', author: 'John' }
 * };
 * ```
 */
export interface BundleMetadata {
  /**
   * Human-readable name for the bundle.
   */
  name?: string;

  /**
   * Description of the bundle contents.
   */
  description?: string;

  /**
   * ISO 8601 timestamp of when the bundle was created.
   */
  createdAt?: string;

  /**
   * Custom metadata properties.
   */
  custom?: Record<string, unknown>;
}

/**
 * Schema definitions included in a bundle.
 *
 * @remarks
 * Schemas define the expected structure of node and edge properties.
 * Including schemas in the bundle allows for self-describing data.
 *
 * @example
 * ```typescript
 * const schemas: BundleSchemas = {
 *   nodes: {
 *     Person: {
 *       type: 'object',
 *       properties: { name: { type: 'string' } },
 *       required: ['name']
 *     }
 *   },
 *   edges: {
 *     KNOWS: { type: 'object' }
 *   }
 * };
 * ```
 */
export interface BundleSchemas {
  /**
   * Map of node type names to their JSON Schema definitions.
   */
  nodes?: Record<string, SchemaDefinition>;

  /**
   * Map of edge type names to their JSON Schema definitions.
   */
  edges?: Record<string, SchemaDefinition>;
}

/**
 * Bundle represents a complete serializable graph package.
 *
 * @remarks
 * A Bundle contains all data necessary to reconstruct a graph:
 * - Version for format compatibility checking
 * - All nodes with their properties
 * - All edges with their connections and properties
 * - Optional schemas for property validation
 * - Optional metadata for context
 *
 * Bundles are designed for JSON serialization and can be used for:
 * - Exporting graphs to files
 * - Transferring graphs between systems
 * - Creating backups of graph data
 * - Versioning graph state
 *
 * @example
 * ```typescript
 * const bundle: Bundle = {
 *   version: '1.0.0',
 *   nodes: [
 *     { id: 'n1', type: 'Person', properties: { name: 'Alice' } }
 *   ],
 *   edges: [
 *     { id: 'e1', type: 'KNOWS', source: 'n1', target: 'n2', properties: {} }
 *   ],
 *   schemas: {
 *     nodes: { Person: { type: 'object' } }
 *   },
 *   metadata: { name: 'My Graph' }
 * };
 * ```
 */
export interface Bundle {
  /**
   * Bundle format version.
   *
   * @remarks
   * Currently only '1.0.0' is supported.
   */
  version: BundleVersion;

  /**
   * All nodes in the graph.
   */
  nodes: Node<Record<string, unknown>>[];

  /**
   * All edges in the graph.
   */
  edges: Edge<Record<string, unknown>>[];

  /**
   * Optional schema definitions for node and edge types.
   */
  schemas?: BundleSchemas;

  /**
   * Optional metadata about the bundle.
   */
  metadata?: BundleMetadata;
}

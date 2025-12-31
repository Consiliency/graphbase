/**
 * @file Bundle exporter
 * @description Exports graph data to a serializable bundle format
 *
 * @module bundle/exporter
 */

import type { Storage } from '../storage/index.js';
import type { SchemaRegistry } from '../schema/index.js';
import type { Bundle, BundleMetadata, BundleSchemas } from './format.js';
import { BUNDLE_VERSION } from './format.js';

/**
 * Options for exporting a bundle.
 *
 * @example
 * ```typescript
 * const options: ExportOptions = {
 *   schemaRegistry: registry,
 *   metadata: { name: 'My Graph' }
 * };
 * ```
 */
export interface ExportOptions {
  /**
   * Schema registry to export schemas from.
   * If not provided, schemas will not be included in the bundle.
   */
  schemaRegistry?: SchemaRegistry;

  /**
   * Metadata to include in the bundle.
   * If createdAt is not provided, it will be auto-generated.
   */
  metadata?: Partial<BundleMetadata>;
}

/**
 * Exports graph data from storage to a bundle.
 *
 * @param storage - The storage instance to export from
 * @param options - Export options
 * @returns A bundle containing all graph data
 *
 * @remarks
 * The export process:
 * 1. Collects all nodes from storage
 * 2. Collects all edges from storage
 * 3. Optionally includes schemas from the registry
 * 4. Adds metadata with auto-generated timestamp if needed
 *
 * The resulting bundle is a plain object that can be serialized to JSON.
 *
 * @example
 * ```typescript
 * import { MemoryStorage } from '../storage';
 * import { SchemaRegistry } from '../schema';
 * import { exportBundle } from './exporter';
 *
 * const storage = new MemoryStorage();
 * storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
 *
 * const registry = new SchemaRegistry();
 * registry.registerNodeSchema('Person', { type: 'object' });
 *
 * const bundle = exportBundle(storage, {
 *   schemaRegistry: registry,
 *   metadata: { name: 'Social Graph' }
 * });
 *
 * // Serialize to JSON
 * const json = JSON.stringify(bundle, null, 2);
 * ```
 */
export function exportBundle(storage: Storage, options: ExportOptions = {}): Bundle {
  const { schemaRegistry, metadata } = options;

  // Export nodes and edges from storage
  const nodes = storage.getAllNodes();
  const edges = storage.getAllEdges();

  // Build the bundle
  const bundle: Bundle = {
    version: BUNDLE_VERSION,
    nodes,
    edges,
  };

  // Export schemas if registry is provided and has schemas
  if (schemaRegistry && schemaRegistry.size > 0) {
    const schemas = exportSchemas(schemaRegistry);
    if (schemas) {
      bundle.schemas = schemas;
    }
  }

  // Add metadata if provided
  if (metadata) {
    bundle.metadata = {
      ...metadata,
      // Auto-generate createdAt if not provided
      createdAt: metadata.createdAt ?? new Date().toISOString(),
    };
  }

  return bundle;
}

/**
 * Exports schemas from a registry to the bundle schema format.
 *
 * @param registry - The schema registry to export from
 * @returns Bundle schemas object, or undefined if no schemas
 *
 * @internal
 */
function exportSchemas(registry: SchemaRegistry): BundleSchemas | undefined {
  const nodeTypes = registry.listNodeTypes();
  const edgeTypes = registry.listEdgeTypes();

  // Return undefined if no schemas registered
  if (nodeTypes.length === 0 && edgeTypes.length === 0) {
    return undefined;
  }

  const schemas: BundleSchemas = {};

  // Export node schemas
  if (nodeTypes.length > 0) {
    schemas.nodes = {};
    for (const type of nodeTypes) {
      const schema = registry.getNodeSchema(type);
      if (schema) {
        schemas.nodes[type] = schema;
      }
    }
  }

  // Export edge schemas
  if (edgeTypes.length > 0) {
    schemas.edges = {};
    for (const type of edgeTypes) {
      const schema = registry.getEdgeSchema(type);
      if (schema) {
        schemas.edges[type] = schema;
      }
    }
  }

  return schemas;
}

/**
 * @file Bundle exporter
 * @description Exports graph data to a serializable bundle format
 *
 * @module bundle/exporter
 */

import type { Storage } from '../storage/index.js';
import type { SchemaRegistry } from '../schema/index.js';
import type { Node, Edge } from '../types/index.js';
import type { Bundle, BundleMetadata, BundleSchemas } from './format.js';
import { BUNDLE_VERSION } from './format.js';
import { canonicalize } from './canonicalize.js';

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
   *
   * @remarks
   * Metadata is canonicalized like the rest of the bundle but is **not**
   * auto-populated. In particular, no wall-clock `createdAt` is injected — a
   * timestamp, if needed, is caller-supplied so that the exported bytes are
   * deterministic and content-addressable. Any `createdAt` you pass is
   * preserved verbatim; if you omit it, the field is simply absent.
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
 * The export process is **deterministic** — two semantically identical graphs
 * built in different insertion orders export to byte-identical bundles:
 * 1. Collects all nodes from storage and sorts them by `id`
 * 2. Collects all edges from storage and sorts them by `(source, type, target, id)`
 * 3. Optionally includes schemas from the registry, sorted by type key
 * 4. Includes caller-supplied metadata verbatim (no wall-clock injected)
 * 5. Recursively canonicalizes all object-key ordering (including nested
 *    property and schema shapes)
 *
 * The export also defensively clones every value, so mutating the returned
 * bundle never affects stored graph state. The resulting bundle is a plain
 * object that can be serialized to JSON and content-addressed by hashing.
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

  // Export nodes and edges from storage, then sort into canonical order so the
  // result is independent of Map insertion order.
  const nodes = [...storage.getAllNodes()].sort(compareNodes);
  const edges = [...storage.getAllEdges()].sort(compareEdges);

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

  // Include caller-supplied metadata verbatim. No wall-clock timestamp is
  // injected: the hashed envelope must not depend on when it was produced.
  if (metadata) {
    bundle.metadata = { ...metadata };
  }

  // Recursively canonicalize object-key ordering across the whole bundle
  // (nested property and schema shapes included). This is also a defensive
  // deep clone, so the returned bundle shares no references with storage.
  return canonicalize(bundle);
}

/**
 * Total-order comparator for nodes: by `id`.
 *
 * @remarks
 * Node ids are unique within a graph, so this is a strict total order with no
 * tie-breaking ambiguity.
 *
 * @internal
 */
function compareNodes(a: Node, b: Node): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Total-order comparator for edges: by `(source, type, target, id)`.
 *
 * @remarks
 * Edge ids are unique, so `id` is the final, deterministic tie-breaker; the
 * leading fields group semantically related edges for readable output.
 *
 * @internal
 */
function compareEdges(a: Edge, b: Edge): number {
  return (
    cmp(a.source, b.source) ||
    cmp(a.type, b.type) ||
    cmp(a.target, b.target) ||
    cmp(a.id, b.id)
  );
}

/**
 * Stable string comparator returning -1 / 0 / 1.
 *
 * @internal
 */
function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
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
  // Sort type keys so schema export order is independent of registration order.
  // (The final canonicalize pass would also sort these, but sorting here keeps
  // exportSchemas self-consistent and the intent explicit.)
  const nodeTypes = [...registry.listNodeTypes()].sort();
  const edgeTypes = [...registry.listEdgeTypes()].sort();

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

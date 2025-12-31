/**
 * @file Bundle importer
 * @description Imports graph data from a bundle into storage
 *
 * @module bundle/importer
 */

import type { Storage } from '../storage/index.js';
import type { SchemaRegistry } from '../schema/index.js';
import type { Bundle } from './format.js';
import { validateBundle } from './validator.js';

/**
 * Options for importing a bundle.
 *
 * @example
 * ```typescript
 * const options: ImportOptions = {
 *   schemaRegistry: registry,
 *   merge: false
 * };
 * ```
 */
export interface ImportOptions {
  /**
   * Schema registry to import schemas into.
   * If not provided, schemas in the bundle will be ignored.
   */
  schemaRegistry?: SchemaRegistry;

  /**
   * If true, merge with existing data instead of replacing.
   * Default is false (replace existing data).
   *
   * @remarks
   * When merging, duplicate node IDs will throw an error.
   */
  merge?: boolean;

  /**
   * If true, skip validation of the bundle before import.
   * Default is false (validate before import).
   *
   * @remarks
   * Skipping validation is not recommended as it may lead to
   * data integrity issues.
   */
  skipValidation?: boolean;
}

/**
 * Result of an import operation.
 *
 * @example
 * ```typescript
 * const result: ImportResult = {
 *   nodesImported: 10,
 *   edgesImported: 15,
 *   schemasImported: 2
 * };
 * ```
 */
export interface ImportResult {
  /**
   * Number of nodes imported.
   */
  nodesImported: number;

  /**
   * Number of edges imported.
   */
  edgesImported: number;

  /**
   * Number of schemas imported.
   */
  schemasImported: number;
}

/**
 * Error thrown when bundle import fails.
 */
export class BundleImportError extends Error {
  /**
   * Path to the element that caused the error.
   */
  readonly path: string;

  /**
   * Creates a new BundleImportError.
   *
   * @param message - Error message
   * @param path - Path to the failing element
   */
  constructor(message: string, path: string) {
    super(message);
    this.name = 'BundleImportError';
    this.path = path;
  }
}

/**
 * Imports graph data from a bundle into storage.
 *
 * @param storage - The storage instance to import into
 * @param bundle - The bundle to import
 * @param options - Import options
 * @returns Import result with counts
 * @throws BundleImportError if import fails
 *
 * @remarks
 * The import process:
 * 1. Validates the bundle (unless skipValidation is true)
 * 2. Clears existing data (unless merge is true)
 * 3. Imports schemas into the registry (if provided)
 * 4. Imports nodes into storage
 * 5. Imports edges into storage
 *
 * If any step fails, an error is thrown. The operation is not transactional -
 * partial imports may occur on failure.
 *
 * @example
 * ```typescript
 * import { MemoryStorage } from '../storage';
 * import { SchemaRegistry } from '../schema';
 * import { importBundle } from './importer';
 *
 * const storage = new MemoryStorage();
 * const registry = new SchemaRegistry();
 *
 * const bundle = JSON.parse(jsonString) as Bundle;
 *
 * const result = importBundle(storage, bundle, {
 *   schemaRegistry: registry,
 *   merge: false
 * });
 *
 * console.log(`Imported ${result.nodesImported} nodes`);
 * ```
 */
export function importBundle(
  storage: Storage,
  bundle: Bundle,
  options: ImportOptions = {}
): ImportResult {
  const { schemaRegistry, merge = false, skipValidation = false } = options;

  // Validate bundle unless skipped
  if (!skipValidation) {
    const validationResult = validateBundle(bundle);
    if (!validationResult.valid) {
      const firstError = validationResult.errors[0];
      throw new BundleImportError(
        `Bundle validation failed: ${firstError.message}`,
        firstError.path
      );
    }
  }

  let schemasImported = 0;

  // Import schemas first (before clearing storage in case of error)
  if (schemaRegistry && bundle.schemas) {
    schemasImported = importSchemas(schemaRegistry, bundle.schemas, merge);
  }

  // Clear or prepare storage
  if (!merge) {
    storage.clear();
  }

  // Import nodes
  const nodesImported = importNodes(storage, bundle.nodes, merge);

  // Import edges
  const edgesImported = importEdges(storage, bundle.edges);

  return {
    nodesImported,
    edgesImported,
    schemasImported,
  };
}

/**
 * Imports schemas from bundle into registry.
 *
 * @param registry - Schema registry to import into
 * @param schemas - Schemas from bundle
 * @param merge - Whether to merge with existing schemas
 * @returns Number of schemas imported
 *
 * @internal
 */
function importSchemas(
  registry: SchemaRegistry,
  schemas: NonNullable<Bundle['schemas']>,
  merge: boolean
): number {
  // Clear existing schemas unless merging
  if (!merge) {
    registry.clear();
  }

  let count = 0;

  // Import node schemas
  if (schemas.nodes) {
    for (const [type, schema] of Object.entries(schemas.nodes)) {
      registry.registerNodeSchema(type, schema);
      count++;
    }
  }

  // Import edge schemas
  if (schemas.edges) {
    for (const [type, schema] of Object.entries(schemas.edges)) {
      registry.registerEdgeSchema(type, schema);
      count++;
    }
  }

  return count;
}

/**
 * Imports nodes from bundle into storage.
 *
 * @param storage - Storage to import into
 * @param nodes - Nodes from bundle
 * @param merge - Whether to merge with existing nodes
 * @returns Number of nodes imported
 * @throws BundleImportError on duplicate IDs during merge
 *
 * @internal
 */
function importNodes(
  storage: Storage,
  nodes: Bundle['nodes'],
  merge: boolean
): number {
  for (const node of nodes) {
    // Check for duplicates when merging
    if (merge && storage.hasNode(node.id)) {
      throw new BundleImportError(
        `Duplicate node ID during merge: ${node.id}`,
        `nodes[${node.id}]`
      );
    }

    storage.addNode(node);
  }

  return nodes.length;
}

/**
 * Imports edges from bundle into storage.
 *
 * @param storage - Storage to import into
 * @param edges - Edges from bundle
 * @returns Number of edges imported
 * @throws BundleImportError on invalid node references
 *
 * @internal
 */
function importEdges(
  storage: Storage,
  edges: Bundle['edges']
): number {
  for (const edge of edges) {
    try {
      storage.addEdge(edge);
    } catch (error) {
      throw new BundleImportError(
        `Failed to import edge ${edge.id}: ${error instanceof Error ? error.message : String(error)}`,
        `edges[${edge.id}]`
      );
    }
  }

  return edges.length;
}

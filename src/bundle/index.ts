/**
 * Bundle module for JSON serialization of graph data.
 *
 * @module bundle
 *
 * @remarks
 * This module provides import/export functionality for graph data:
 *
 * - **Bundle type**: Complete serializable graph package with version
 * - **exportBundle()**: Export storage contents to a bundle
 * - **importBundle()**: Import bundle contents into storage
 * - **validateBundle()**: Validate bundle structure and integrity
 *
 * Bundles are designed for JSON serialization and include:
 * - Graph data (nodes and edges)
 * - Optional schema definitions
 * - Optional metadata
 * - Version identifier for format compatibility
 *
 * @example
 * ```typescript
 * import {
 *   Bundle,
 *   exportBundle,
 *   importBundle,
 *   validateBundle,
 *   BUNDLE_VERSION
 * } from './bundle';
 * import { MemoryStorage } from './storage';
 * import { SchemaRegistry } from './schema';
 *
 * // Export graph to bundle
 * const storage = new MemoryStorage();
 * storage.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
 *
 * const bundle = exportBundle(storage, {
 *   metadata: { name: 'My Graph' }
 * });
 *
 * // Serialize to JSON
 * const json = JSON.stringify(bundle, null, 2);
 *
 * // Validate before import
 * const parsed = JSON.parse(json) as Bundle;
 * const result = validateBundle(parsed);
 * if (!result.valid) {
 *   throw new Error('Invalid bundle');
 * }
 *
 * // Import into new storage
 * const newStorage = new MemoryStorage();
 * importBundle(newStorage, parsed);
 * ```
 */

// Export types
export type {
  Bundle,
  BundleVersion,
  BundleMetadata,
  BundleSchemas,
} from './format.js';

// Export constants
export { BUNDLE_VERSION } from './format.js';

// Export exporter
export { exportBundle } from './exporter.js';
export type { ExportOptions } from './exporter.js';

// Export canonical-serialization helpers (deterministic, hashable bytes)
export { canonicalize, canonicalStringify } from './canonicalize.js';

// Export importer
export { importBundle, BundleImportError } from './importer.js';
export type { ImportOptions, ImportResult } from './importer.js';

// Export validator
export { validateBundle } from './validator.js';
export type {
  BundleValidationResult,
  BundleValidationError,
  BundleValidationWarning,
} from './validator.js';

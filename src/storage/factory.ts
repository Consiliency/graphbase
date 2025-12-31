/**
 * Storage factory for creating storage backend instances.
 *
 * @module storage/factory
 *
 * @remarks
 * The factory pattern allows for easy switching between storage backends
 * and provides a clean API for instantiating storage implementations.
 *
 * Currently supported backends:
 * - Memory: In-memory storage (default)
 *
 * Future backends could include:
 * - File: JSON file-based persistence
 * - IndexedDB: Browser-based persistence
 * - SQLite: Embedded SQL database
 *
 * @example
 * ```typescript
 * import { createStorage, StorageBackend } from './storage/factory.js';
 *
 * // Create default (memory) storage
 * const storage = createStorage();
 *
 * // Explicitly specify backend
 * const memoryStorage = createStorage({ backend: StorageBackend.Memory });
 * ```
 */

import type { Storage } from './interface.js';
import { MemoryStorage } from './memory.js';

/**
 * Enum of available storage backends.
 *
 * @remarks
 * Use these values with the `createStorage()` factory function
 * to specify which storage implementation to use.
 */
export const StorageBackend = {
  /** In-memory storage - fast but not persistent */
  Memory: 'memory',
} as const;

/**
 * Type for StorageBackend values.
 */
export type StorageBackend = (typeof StorageBackend)[keyof typeof StorageBackend];

/**
 * Configuration options for storage creation.
 */
export interface StorageOptions {
  /**
   * The storage backend to use.
   * @default StorageBackend.Memory
   */
  backend?: StorageBackend;
}

/**
 * Create a new storage instance.
 *
 * @param options - Optional configuration for the storage
 * @returns A new Storage instance
 * @throws Error if the specified backend is not supported
 *
 * @example
 * ```typescript
 * // Default (memory) storage
 * const storage = createStorage();
 *
 * // With explicit options
 * const storage = createStorage({
 *   backend: StorageBackend.Memory
 * });
 * ```
 */
export function createStorage(options?: StorageOptions): Storage {
  const backend = options?.backend ?? StorageBackend.Memory;

  switch (backend) {
    case StorageBackend.Memory:
      return new MemoryStorage();
    default:
      throw new Error(`Unknown storage backend: ${backend}`);
  }
}

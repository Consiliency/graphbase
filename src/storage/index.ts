/**
 * Storage layer exports for the graph database abstraction.
 *
 * @module storage
 *
 * @remarks
 * This module provides the storage abstraction layer, including:
 *
 * - **Storage interface**: The contract for all storage backends
 * - **MemoryStorage**: In-memory storage implementation
 * - **createStorage()**: Factory function for creating storage instances
 * - **StorageBackend**: Enum of available backends
 *
 * @example
 * ```typescript
 * import { createStorage, StorageBackend, MemoryStorage } from './storage';
 * import type { Storage } from './storage';
 *
 * // Using the factory (recommended)
 * const storage = createStorage({ backend: StorageBackend.Memory });
 *
 * // Direct instantiation
 * const memStorage = new MemoryStorage();
 *
 * // Type annotation for dependency injection
 * function processGraph(storage: Storage): void {
 *   const nodes = storage.getAllNodes();
 *   // ...
 * }
 * ```
 */

// Re-export interface type
export type { Storage } from './interface.js';

// Re-export implementation
export { MemoryStorage } from './memory.js';

// Re-export factory
export { createStorage, StorageBackend } from './factory.js';
export type { StorageOptions } from './factory.js';

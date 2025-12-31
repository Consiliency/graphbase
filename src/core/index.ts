/**
 * Core module exports.
 *
 * @module core
 *
 * @remarks
 * This module exports the main Graph class which serves as the primary
 * public API for the graph database abstraction layer.
 *
 * @example
 * ```typescript
 * import { Graph } from './core';
 *
 * const graph = new Graph();
 * graph.addNode({ id: 'n1', type: 'Person', properties: { name: 'Alice' } });
 * ```
 */

export { Graph } from './Graph.js';
export type { GraphOptions, ExportOptions, ImportOptions } from './Graph.js';

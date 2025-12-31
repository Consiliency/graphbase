/**
 * Core type definitions for the graph database abstraction layer.
 *
 * @module types
 *
 * @remarks
 * This module exports all fundamental types used throughout the library:
 *
 * - **Node & Edge**: The core entities representing vertices and connections
 * - **Relationship**: Schema-level definitions of valid edge types
 * - **GraphData**: Complete graph state for serialization
 * - **Filters**: Query criteria for nodes and edges
 *
 * All types use TypeScript generics to ensure type safety while maintaining flexibility.
 *
 * @example
 * ```typescript
 * import type { Node, Edge, GraphData } from './types';
 *
 * interface PersonProps {
 *   name: string;
 *   age: number;
 * }
 *
 * const person: Node<PersonProps> = {
 *   id: 'p1',
 *   type: 'Person',
 *   properties: { name: 'Alice', age: 30 }
 * };
 * ```
 */

export type { Node, NodeFilter } from './Node.js';
export type { Edge, EdgeFilter } from './Edge.js';
export type { Relationship } from './Relationship.js';
export type { GraphData } from './Graph.js';

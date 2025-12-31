/**
 * Node represents a vertex in the graph with typed properties.
 *
 * @template T - The type of the node's properties object
 *
 * @remarks
 * Nodes are the fundamental entities in the graph. Each node has:
 * - A unique identifier (id)
 * - A type classifier (type) for schema validation and queries
 * - A properties object containing domain-specific data
 *
 * @example
 * ```typescript
 * interface PersonProps {
 *   name: string;
 *   age: number;
 * }
 *
 * const person: Node<PersonProps> = {
 *   id: 'person-1',
 *   type: 'Person',
 *   properties: {
 *     name: 'Alice',
 *     age: 30
 *   }
 * };
 * ```
 */
export interface Node<T = Record<string, unknown>> {
  /**
   * Unique identifier for the node.
   * Must be unique across all nodes in the graph.
   */
  id: string;

  /**
   * Type classifier for the node.
   * Used for schema validation and type-based queries.
   */
  type: string;

  /**
   * Domain-specific properties for the node.
   * Type is enforced by the generic parameter T.
   */
  properties: T;
}

/**
 * NodeFilter defines criteria for querying nodes.
 *
 * @remarks
 * All filter fields are optional. Multiple fields are combined with AND logic.
 * Property filters support partial matching of the properties object.
 *
 * @example
 * ```typescript
 * // Filter by type
 * const filter: NodeFilter = { type: 'Person' };
 *
 * // Filter by id
 * const filter: NodeFilter = { id: 'person-1' };
 *
 * // Filter by properties
 * const filter: NodeFilter = {
 *   type: 'Person',
 *   properties: { age: 30 }
 * };
 * ```
 */
export interface NodeFilter {
  /**
   * Filter by exact node ID.
   */
  id?: string;

  /**
   * Filter by node type.
   */
  type?: string;

  /**
   * Filter by property values.
   * Only nodes with matching property values are returned.
   */
  properties?: Record<string, unknown>;
}

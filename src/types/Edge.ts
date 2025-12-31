/**
 * Edge represents a directed connection between two nodes in the graph.
 *
 * @template T - The type of the edge's properties object
 *
 * @remarks
 * Edges define relationships between nodes. Each edge has:
 * - A unique identifier (id)
 * - A type classifier (type) representing the relationship kind
 * - A source node ID (source)
 * - A target node ID (target)
 * - A properties object containing relationship-specific data
 *
 * Edges are directed: they point from source to target.
 *
 * @example
 * ```typescript
 * interface FriendshipProps {
 *   since: string;
 *   strength: number;
 * }
 *
 * const friendship: Edge<FriendshipProps> = {
 *   id: 'edge-1',
 *   type: 'KNOWS',
 *   source: 'person-1',
 *   target: 'person-2',
 *   properties: {
 *     since: '2020-01-01',
 *     strength: 0.9
 *   }
 * };
 * ```
 */
export interface Edge<T = Record<string, unknown>> {
  /**
   * Unique identifier for the edge.
   * Must be unique across all edges in the graph.
   */
  id: string;

  /**
   * Type classifier for the edge.
   * Represents the kind of relationship (e.g., 'KNOWS', 'OWNS', 'MANAGES').
   */
  type: string;

  /**
   * ID of the source node.
   * Must reference an existing node in the graph.
   */
  source: string;

  /**
   * ID of the target node.
   * Must reference an existing node in the graph.
   */
  target: string;

  /**
   * Domain-specific properties for the edge.
   * Type is enforced by the generic parameter T.
   */
  properties: T;
}

/**
 * EdgeFilter defines criteria for querying edges.
 *
 * @remarks
 * All filter fields are optional. Multiple fields are combined with AND logic.
 * Property filters support partial matching of the properties object.
 *
 * @example
 * ```typescript
 * // Filter by type
 * const filter: EdgeFilter = { type: 'KNOWS' };
 *
 * // Filter by source
 * const filter: EdgeFilter = { source: 'person-1' };
 *
 * // Filter by source and target
 * const filter: EdgeFilter = {
 *   source: 'person-1',
 *   target: 'person-2'
 * };
 *
 * // Filter by properties
 * const filter: EdgeFilter = {
 *   type: 'KNOWS',
 *   properties: { strength: 0.9 }
 * };
 * ```
 */
export interface EdgeFilter {
  /**
   * Filter by exact edge ID.
   */
  id?: string;

  /**
   * Filter by edge type.
   */
  type?: string;

  /**
   * Filter by source node ID.
   */
  source?: string;

  /**
   * Filter by target node ID.
   */
  target?: string;

  /**
   * Filter by property values.
   * Only edges with matching property values are returned.
   */
  properties?: Record<string, unknown>;
}

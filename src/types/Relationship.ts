/**
 * Relationship defines the allowed connections between node types.
 *
 * @remarks
 * Relationships are used to:
 * - Define schema constraints for edge types
 * - Specify which node types can be connected by which edge types
 * - Document the semantic meaning of edge types
 *
 * Unlike edges (which are instances), relationships are type-level constraints
 * that define what kinds of edges are valid in the graph.
 *
 * @example
 * ```typescript
 * // Define a Person-to-Person friendship relationship
 * const friendship: Relationship = {
 *   type: 'KNOWS',
 *   sourceType: 'Person',
 *   targetType: 'Person'
 * };
 *
 * // Define a Person-to-Book authorship relationship
 * const authorship: Relationship = {
 *   type: 'AUTHORED',
 *   sourceType: 'Person',
 *   targetType: 'Book'
 * };
 * ```
 */
export interface Relationship {
  /**
   * The edge type this relationship defines.
   * Must match the 'type' field of edges using this relationship.
   */
  type: string;

  /**
   * The node type allowed as the source of this relationship.
   * Edges with this relationship type must have source nodes of this type.
   */
  sourceType: string;

  /**
   * The node type allowed as the target of this relationship.
   * Edges with this relationship type must have target nodes of this type.
   */
  targetType: string;
}

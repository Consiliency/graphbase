/**
 * @file Bundle validator
 * @description Validates bundle structure and content integrity
 *
 * @module bundle/validator
 */

import { BUNDLE_VERSION } from './format.js';

/**
 * A single validation error with path and message information.
 *
 * @example
 * ```typescript
 * const error: BundleValidationError = {
 *   path: 'nodes[0].id',
 *   message: 'Node is missing required field: id'
 * };
 * ```
 */
export interface BundleValidationError {
  /**
   * Path to the failing element in the bundle structure.
   */
  path: string;

  /**
   * Human-readable error message.
   */
  message: string;
}

/**
 * A validation warning for non-critical issues.
 *
 * @example
 * ```typescript
 * const warning: BundleValidationWarning = {
 *   path: 'metadata',
 *   message: 'Bundle has no metadata'
 * };
 * ```
 */
export interface BundleValidationWarning {
  /**
   * Path to the element with the warning.
   */
  path: string;

  /**
   * Human-readable warning message.
   */
  message: string;
}

/**
 * Result of bundle validation.
 *
 * @example
 * ```typescript
 * const result: BundleValidationResult = {
 *   valid: true,
 *   errors: [],
 *   warnings: []
 * };
 * ```
 */
export interface BundleValidationResult {
  /**
   * Whether the bundle is valid.
   */
  valid: boolean;

  /**
   * Array of validation errors. Empty if valid.
   */
  errors: BundleValidationError[];

  /**
   * Array of validation warnings.
   */
  warnings: BundleValidationWarning[];
}

/**
 * Validates a bundle's structure and content integrity.
 *
 * @param bundle - The bundle to validate
 * @returns Validation result with errors and warnings
 *
 * @remarks
 * Validation checks include:
 * - Required fields (version, nodes, edges)
 * - Version format and compatibility
 * - Node structure (id, type, properties)
 * - Edge structure (id, type, source, target, properties)
 * - Unique IDs for nodes and edges
 * - Edge references to existing nodes
 * - Schema structure if present
 *
 * @example
 * ```typescript
 * const bundle: Bundle = {
 *   version: '1.0.0',
 *   nodes: [{ id: 'n1', type: 'Person', properties: {} }],
 *   edges: []
 * };
 *
 * const result = validateBundle(bundle);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateBundle(bundle: unknown): BundleValidationResult {
  const errors: BundleValidationError[] = [];
  const warnings: BundleValidationWarning[] = [];

  // Check if bundle is an object
  if (typeof bundle !== 'object' || bundle === null) {
    errors.push({
      path: '',
      message: 'Bundle must be an object',
    });
    return { valid: false, errors, warnings };
  }

  const obj = bundle as Record<string, unknown>;

  // Validate version
  if (!('version' in obj)) {
    errors.push({
      path: 'version',
      message: 'Bundle is missing required field: version',
    });
  } else if (obj.version !== BUNDLE_VERSION) {
    errors.push({
      path: 'version',
      message: `Invalid bundle version: expected ${BUNDLE_VERSION}, got ${String(obj.version)}`,
    });
  }

  // Validate nodes array
  if (!('nodes' in obj)) {
    errors.push({
      path: 'nodes',
      message: 'Bundle is missing required field: nodes',
    });
  } else if (!Array.isArray(obj.nodes)) {
    errors.push({
      path: 'nodes',
      message: 'nodes must be an array',
    });
  } else {
    const nodeIds = new Set<string>();
    const nodes = obj.nodes as unknown[];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodePath = `nodes[${i}]`;

      if (typeof node !== 'object' || node === null) {
        errors.push({
          path: nodePath,
          message: 'Node must be an object',
        });
        continue;
      }

      const nodeObj = node as Record<string, unknown>;

      // Validate node.id
      if (!('id' in nodeObj)) {
        errors.push({
          path: `${nodePath}.id`,
          message: 'Node is missing required field: id',
        });
      } else if (typeof nodeObj.id !== 'string') {
        errors.push({
          path: `${nodePath}.id`,
          message: 'Node id must be a string',
        });
      } else {
        const id = nodeObj.id;
        if (nodeIds.has(id)) {
          errors.push({
            path: nodePath,
            message: `Duplicate node id: ${id}`,
          });
        }
        nodeIds.add(id);
      }

      // Validate node.type
      if (!('type' in nodeObj)) {
        errors.push({
          path: `${nodePath}.type`,
          message: 'Node is missing required field: type',
        });
      } else if (typeof nodeObj.type !== 'string') {
        errors.push({
          path: `${nodePath}.type`,
          message: 'Node type must be a string',
        });
      }

      // Validate node.properties
      if (!('properties' in nodeObj)) {
        errors.push({
          path: `${nodePath}.properties`,
          message: 'Node is missing required field: properties',
        });
      } else if (typeof nodeObj.properties !== 'object' || nodeObj.properties === null) {
        errors.push({
          path: `${nodePath}.properties`,
          message: 'Node properties must be an object',
        });
      }
    }
  }

  // Validate edges array
  if (!('edges' in obj)) {
    errors.push({
      path: 'edges',
      message: 'Bundle is missing required field: edges',
    });
  } else if (!Array.isArray(obj.edges)) {
    errors.push({
      path: 'edges',
      message: 'edges must be an array',
    });
  } else {
    // Get valid node IDs for edge reference validation
    const nodeIds = new Set<string>();
    if (Array.isArray(obj.nodes)) {
      for (const node of obj.nodes as unknown[]) {
        if (typeof node === 'object' && node !== null && 'id' in node) {
          const nodeObj = node as Record<string, unknown>;
          if (typeof nodeObj.id === 'string') {
            nodeIds.add(nodeObj.id);
          }
        }
      }
    }

    const edgeIds = new Set<string>();
    const edges = obj.edges as unknown[];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const edgePath = `edges[${i}]`;

      if (typeof edge !== 'object' || edge === null) {
        errors.push({
          path: edgePath,
          message: 'Edge must be an object',
        });
        continue;
      }

      const edgeObj = edge as Record<string, unknown>;

      // Validate edge.id
      if (!('id' in edgeObj)) {
        errors.push({
          path: `${edgePath}.id`,
          message: 'Edge is missing required field: id',
        });
      } else if (typeof edgeObj.id !== 'string') {
        errors.push({
          path: `${edgePath}.id`,
          message: 'Edge id must be a string',
        });
      } else {
        const id = edgeObj.id;
        if (edgeIds.has(id)) {
          errors.push({
            path: edgePath,
            message: `Duplicate edge id: ${id}`,
          });
        }
        edgeIds.add(id);
      }

      // Validate edge.type
      if (!('type' in edgeObj)) {
        errors.push({
          path: `${edgePath}.type`,
          message: 'Edge is missing required field: type',
        });
      } else if (typeof edgeObj.type !== 'string') {
        errors.push({
          path: `${edgePath}.type`,
          message: 'Edge type must be a string',
        });
      }

      // Validate edge.source
      if (!('source' in edgeObj)) {
        errors.push({
          path: `${edgePath}.source`,
          message: 'Edge is missing required field: source',
        });
      } else if (typeof edgeObj.source !== 'string') {
        errors.push({
          path: `${edgePath}.source`,
          message: 'Edge source must be a string',
        });
      } else if (!nodeIds.has(edgeObj.source)) {
        errors.push({
          path: `${edgePath}.source`,
          message: `Edge references non-existent source node: ${edgeObj.source}`,
        });
      }

      // Validate edge.target
      if (!('target' in edgeObj)) {
        errors.push({
          path: `${edgePath}.target`,
          message: 'Edge is missing required field: target',
        });
      } else if (typeof edgeObj.target !== 'string') {
        errors.push({
          path: `${edgePath}.target`,
          message: 'Edge target must be a string',
        });
      } else if (!nodeIds.has(edgeObj.target)) {
        errors.push({
          path: `${edgePath}.target`,
          message: `Edge references non-existent target node: ${edgeObj.target}`,
        });
      }

      // Validate edge.properties
      if (!('properties' in edgeObj)) {
        errors.push({
          path: `${edgePath}.properties`,
          message: 'Edge is missing required field: properties',
        });
      } else if (typeof edgeObj.properties !== 'object' || edgeObj.properties === null) {
        errors.push({
          path: `${edgePath}.properties`,
          message: 'Edge properties must be an object',
        });
      }
    }
  }

  // Validate optional schemas
  if ('schemas' in obj && obj.schemas !== undefined) {
    if (typeof obj.schemas !== 'object' || obj.schemas === null) {
      errors.push({
        path: 'schemas',
        message: 'schemas must be an object',
      });
    } else {
      const schemas = obj.schemas as Record<string, unknown>;

      if ('nodes' in schemas && schemas.nodes !== undefined) {
        if (typeof schemas.nodes !== 'object' || schemas.nodes === null) {
          errors.push({
            path: 'schemas.nodes',
            message: 'schemas.nodes must be an object',
          });
        }
      }

      if ('edges' in schemas && schemas.edges !== undefined) {
        if (typeof schemas.edges !== 'object' || schemas.edges === null) {
          errors.push({
            path: 'schemas.edges',
            message: 'schemas.edges must be an object',
          });
        }
      }
    }
  }

  // Validate optional metadata
  if ('metadata' in obj && obj.metadata !== undefined) {
    if (typeof obj.metadata !== 'object' || obj.metadata === null) {
      errors.push({
        path: 'metadata',
        message: 'metadata must be an object',
      });
    }
  }

  // Add warnings for missing optional fields
  if (!('metadata' in obj) || obj.metadata === undefined) {
    warnings.push({
      path: 'metadata',
      message: 'Bundle has no metadata',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

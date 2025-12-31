/**
 * @file Validator class for JSON Schema validation using AJV
 * @description AJV-based validator for node and edge properties
 *
 * @module schema/validator
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { Node, Edge } from '../types/index.js';
import type { SchemaRegistry } from './registry.js';
import type {
  SchemaDefinition,
  ValidationResult,
  ValidationErrorDetail,
  ValidatorOptions,
} from './types.js';
import { ValidationError } from './errors.js';

/**
 * Validator provides JSON Schema validation for nodes and edges.
 *
 * @remarks
 * The Validator uses AJV (Another JSON Schema Validator) for high-performance
 * schema validation. It integrates with a SchemaRegistry to look up schemas
 * for different entity types.
 *
 * @example
 * ```typescript
 * const registry = new SchemaRegistry();
 * const validator = new Validator(registry);
 *
 * registry.registerNodeSchema('Person', {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' }
 *   },
 *   required: ['name']
 * });
 *
 * const result = validator.validateNode({
 *   id: 'person-1',
 *   type: 'Person',
 *   properties: { name: 'Alice' }
 * });
 *
 * if (result.valid) {
 *   console.log('Node is valid!');
 * }
 * ```
 */
export class Validator {
  /**
   * The schema registry to look up schemas from.
   */
  private readonly registry: SchemaRegistry;

  /**
   * The AJV instance for validation.
   */
  private readonly ajv: Ajv;

  /**
   * Validator options.
   */
  private readonly options: ValidatorOptions;

  /**
   * Cache of compiled validators by schema type.
   */
  private readonly nodeValidators: Map<string, ReturnType<Ajv['compile']>>;
  private readonly edgeValidators: Map<string, ReturnType<Ajv['compile']>>;

  /**
   * Creates a new Validator.
   *
   * @param registry - The schema registry to use for lookups
   * @param options - Validator configuration options
   *
   * @example
   * ```typescript
   * const registry = new SchemaRegistry();
   *
   * // Default permissive mode
   * const validator = new Validator(registry);
   *
   * // Strict mode - requires schemas for all types
   * const strictValidator = new Validator(registry, { strict: true });
   *
   * // With format validation
   * const formatValidator = new Validator(registry, { validateFormats: true });
   * ```
   */
  constructor(registry: SchemaRegistry, options: ValidatorOptions = {}) {
    this.registry = registry;
    this.options = {
      strict: false,
      validateFormats: false,
      removeAdditional: false,
      useDefaults: false,
      coerceTypes: false,
      ...options,
    };

    // Create AJV instance with configured options
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      removeAdditional: this.options.removeAdditional,
      useDefaults: this.options.useDefaults,
      coerceTypes: this.options.coerceTypes,
      strict: false, // AJV's strict mode, not our validation mode
    });

    // Add format validators if requested
    if (this.options.validateFormats) {
      addFormats(this.ajv);
    }

    // Initialize validator caches
    this.nodeValidators = new Map();
    this.edgeValidators = new Map();
  }

  /**
   * Validates a node against its registered schema.
   *
   * @param node - The node to validate
   * @returns Validation result with valid flag and any errors
   *
   * @remarks
   * If no schema is registered for the node type:
   * - In permissive mode (default): returns valid
   * - In strict mode: returns invalid with "No schema registered" error
   *
   * @example
   * ```typescript
   * const result = validator.validateNode(node);
   *
   * if (result.valid) {
   *   console.log('Node is valid');
   * } else {
   *   console.log('Errors:', result.errors);
   * }
   * ```
   */
  validateNode(node: Node<Record<string, unknown>>): ValidationResult {
    const schema = this.registry.getNodeSchema(node.type);

    if (!schema) {
      if (this.options.strict) {
        return {
          valid: false,
          errors: [
            {
              path: '',
              message: `No schema registered for node type: ${node.type}`,
              keyword: 'schema',
            },
          ],
        };
      }
      // Permissive mode: no schema means valid
      return { valid: true, errors: [] };
    }

    return this.validateProperties(node.properties, schema, node.type, 'node');
  }

  /**
   * Validates an edge against its registered schema.
   *
   * @param edge - The edge to validate
   * @returns Validation result with valid flag and any errors
   *
   * @remarks
   * If no schema is registered for the edge type:
   * - In permissive mode (default): returns valid
   * - In strict mode: returns invalid with "No schema registered" error
   *
   * @example
   * ```typescript
   * const result = validator.validateEdge(edge);
   *
   * if (result.valid) {
   *   console.log('Edge is valid');
   * } else {
   *   console.log('Errors:', result.errors);
   * }
   * ```
   */
  validateEdge(edge: Edge<Record<string, unknown>>): ValidationResult {
    const schema = this.registry.getEdgeSchema(edge.type);

    if (!schema) {
      if (this.options.strict) {
        return {
          valid: false,
          errors: [
            {
              path: '',
              message: `No schema registered for edge type: ${edge.type}`,
              keyword: 'schema',
            },
          ],
        };
      }
      // Permissive mode: no schema means valid
      return { valid: true, errors: [] };
    }

    return this.validateProperties(edge.properties, schema, edge.type, 'edge');
  }

  /**
   * Validates a node and throws ValidationError if invalid.
   *
   * @param node - The node to validate
   * @throws ValidationError if the node is invalid
   *
   * @example
   * ```typescript
   * try {
   *   validator.validateNodeOrThrow(node);
   *   console.log('Node is valid!');
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.log('Validation failed:', error.errors);
   *   }
   * }
   * ```
   */
  validateNodeOrThrow(node: Node<Record<string, unknown>>): void {
    const result = this.validateNode(node);

    if (!result.valid) {
      throw new ValidationError(
        `Validation failed for node '${node.id}' of type '${node.type}'`,
        result.errors,
        node.id,
        node.type
      );
    }
  }

  /**
   * Validates an edge and throws ValidationError if invalid.
   *
   * @param edge - The edge to validate
   * @throws ValidationError if the edge is invalid
   *
   * @example
   * ```typescript
   * try {
   *   validator.validateEdgeOrThrow(edge);
   *   console.log('Edge is valid!');
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.log('Validation failed:', error.errors);
   *   }
   * }
   * ```
   */
  validateEdgeOrThrow(edge: Edge<Record<string, unknown>>): void {
    const result = this.validateEdge(edge);

    if (!result.valid) {
      throw new ValidationError(
        `Validation failed for edge '${edge.id}' of type '${edge.type}'`,
        result.errors,
        edge.id,
        edge.type
      );
    }
  }

  /**
   * Validates properties against a schema.
   *
   * @param properties - The properties object to validate
   * @param schema - The JSON Schema to validate against
   * @param type - The type name (for caching compiled validators)
   * @param kind - Whether this is for a 'node' or 'edge'
   * @returns Validation result
   */
  private validateProperties(
    properties: Record<string, unknown>,
    schema: SchemaDefinition,
    type: string,
    kind: 'node' | 'edge'
  ): ValidationResult {
    const cache = kind === 'node' ? this.nodeValidators : this.edgeValidators;
    let validate = cache.get(type);

    if (!validate) {
      // Compile and cache the validator
      try {
        validate = this.ajv.compile(schema);
        cache.set(type, validate);
      } catch (error) {
        return {
          valid: false,
          errors: [
            {
              path: '',
              message: `Failed to compile schema: ${error instanceof Error ? error.message : String(error)}`,
              keyword: 'schema',
            },
          ],
        };
      }
    }

    const valid = validate(properties);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // Convert AJV errors to our format
    const errors: ValidationErrorDetail[] = (validate.errors ?? []).map((error) => ({
      path: error.instancePath || '/',
      message: this.formatErrorMessage(error),
      keyword: error.keyword,
      params: error.params as Record<string, unknown>,
    }));

    return { valid: false, errors };
  }

  /**
   * Formats an AJV error into a human-readable message.
   *
   * @param error - The AJV error object
   * @returns Formatted error message
   */
  private formatErrorMessage(error: {
    keyword: string;
    message?: string;
    params?: Record<string, unknown>;
    instancePath?: string;
  }): string {
    // AJV always provides error messages, so use them directly
    // Fallback to keyword-based message only if message is missing
    return error.message ?? `failed validation: ${error.keyword}`;
  }

  /**
   * Clears the compiled validator cache.
   *
   * @remarks
   * Call this after modifying schemas in the registry to ensure
   * validators are recompiled with the new schemas.
   *
   * @example
   * ```typescript
   * registry.registerNodeSchema('Person', newSchema);
   * validator.clearCache();
   * ```
   */
  clearCache(): void {
    this.nodeValidators.clear();
    this.edgeValidators.clear();
  }

  /**
   * Clears the cache for a specific type.
   *
   * @param type - The type name to clear
   * @param kind - Whether to clear 'node', 'edge', or 'both'
   *
   * @example
   * ```typescript
   * registry.registerNodeSchema('Person', updatedSchema);
   * validator.clearCacheForType('Person', 'node');
   * ```
   */
  clearCacheForType(type: string, kind: 'node' | 'edge' | 'both' = 'both'): void {
    if (kind === 'node' || kind === 'both') {
      this.nodeValidators.delete(type);
    }
    if (kind === 'edge' || kind === 'both') {
      this.edgeValidators.delete(type);
    }
  }
}

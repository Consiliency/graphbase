/**
 * @file Schema module exports
 * @description JSON Schema validation for graph entities
 *
 * @module schema
 *
 * @remarks
 * This module provides JSON Schema validation for node and edge properties
 * using AJV (Another JSON Schema Validator).
 *
 * Key components:
 * - **SchemaRegistry**: Manages schema definitions for node and edge types
 * - **Validator**: Validates entities against registered schemas
 * - **Error Classes**: Custom errors for validation failures
 *
 * @example
 * ```typescript
 * import { SchemaRegistry, Validator } from './schema';
 *
 * // Create registry and register schemas
 * const registry = new SchemaRegistry();
 * registry.registerNodeSchema('Person', {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number', minimum: 0 }
 *   },
 *   required: ['name']
 * });
 *
 * // Create validator and validate nodes
 * const validator = new Validator(registry);
 * const result = validator.validateNode(personNode);
 *
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */

// Export types
export type {
  ValidationResult,
  ValidationErrorDetail,
  SchemaDefinition,
  ValidatorOptions,
} from './types.js';

// Export classes
export { SchemaRegistry } from './registry.js';
export { Validator } from './validator.js';

// Export error classes
export { ValidationError, SchemaNotFoundError, InvalidSchemaError } from './errors.js';

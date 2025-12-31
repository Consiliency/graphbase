/**
 * @file Schema type definitions
 * @description Type definitions for JSON Schema validation
 *
 * @module schema/types
 */

import type { JSONSchemaType } from 'ajv';

/**
 * A single validation error with path and message information.
 *
 * @remarks
 * Validation errors provide detailed information about what failed validation
 * and where in the data structure the error occurred.
 *
 * @example
 * ```typescript
 * const error: ValidationErrorDetail = {
 *   path: '/properties/name',
 *   message: "must have required property 'name'",
 *   keyword: 'required'
 * };
 * ```
 */
export interface ValidationErrorDetail {
  /**
   * JSON Pointer path to the failing property.
   * Uses the format defined in RFC 6901.
   */
  path: string;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * The JSON Schema keyword that failed (e.g., 'required', 'type', 'minimum').
   */
  keyword: string;

  /**
   * Additional parameters from the failing keyword.
   * For example, for 'minimum' this might include the minimum value.
   */
  params?: Record<string, unknown>;
}

/**
 * Result of a validation operation.
 *
 * @remarks
 * ValidationResult encapsulates whether validation passed and any errors
 * that occurred during validation.
 *
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   valid: false,
 *   errors: [
 *     { path: '/name', message: 'required', keyword: 'required' }
 *   ]
 * };
 *
 * if (!result.valid) {
 *   console.log('Validation failed:', result.errors);
 * }
 * ```
 */
export interface ValidationResult {
  /**
   * Whether the validation passed.
   */
  valid: boolean;

  /**
   * Array of validation errors. Empty if validation passed.
   */
  errors: ValidationErrorDetail[];
}

/**
 * JSON Schema definition for property validation.
 *
 * @remarks
 * This is a simplified type representing a JSON Schema object.
 * It supports the most common schema keywords used in graph property validation.
 *
 * @example
 * ```typescript
 * const personSchema: SchemaDefinition = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', minLength: 1 },
 *     age: { type: 'number', minimum: 0 }
 *   },
 *   required: ['name']
 * };
 * ```
 */
export interface SchemaDefinition {
  /**
   * The JSON Schema type.
   */
  type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';

  /**
   * Property definitions for object types.
   */
  properties?: Record<string, SchemaDefinition | JSONSchemaType<unknown>>;

  /**
   * Required property names for object types.
   */
  required?: string[];

  /**
   * Whether additional properties are allowed (default: true).
   */
  additionalProperties?: boolean | SchemaDefinition;

  /**
   * Array item schema for array types.
   */
  items?: SchemaDefinition | JSONSchemaType<unknown>;

  /**
   * Minimum array length.
   */
  minItems?: number;

  /**
   * Maximum array length.
   */
  maxItems?: number;

  /**
   * Minimum string length.
   */
  minLength?: number;

  /**
   * Maximum string length.
   */
  maxLength?: number;

  /**
   * Regular expression pattern for strings.
   */
  pattern?: string;

  /**
   * String format (e.g., 'email', 'date', 'uri').
   */
  format?: string;

  /**
   * Minimum numeric value.
   */
  minimum?: number;

  /**
   * Maximum numeric value.
   */
  maximum?: number;

  /**
   * Exclusive minimum numeric value.
   */
  exclusiveMinimum?: number;

  /**
   * Exclusive maximum numeric value.
   */
  exclusiveMaximum?: number;

  /**
   * Allowed values (enum).
   */
  enum?: (string | number | boolean | null)[];

  /**
   * Constant value.
   */
  const?: unknown;

  /**
   * Default value.
   */
  default?: unknown;

  /**
   * Description for documentation.
   */
  description?: string;

  /**
   * Allow additional properties in the schema.
   * This index signature makes SchemaDefinition compatible with AJV's expected types.
   */
  [key: string]: unknown;
}

/**
 * Options for configuring the Validator.
 *
 * @example
 * ```typescript
 * const options: ValidatorOptions = {
 *   strict: true,
 *   validateFormats: true
 * };
 * ```
 */
export interface ValidatorOptions {
  /**
   * When true, validation fails if no schema is registered for the type.
   * When false (default), unregistered types pass validation.
   */
  strict?: boolean;

  /**
   * When true, validates string formats (email, date, uri, etc.).
   * Requires ajv-formats to be installed.
   * @default false
   */
  validateFormats?: boolean;

  /**
   * When true, removes additional properties not in schema.
   * @default false
   */
  removeAdditional?: boolean;

  /**
   * When true, uses schema defaults to fill in missing values.
   * @default false
   */
  useDefaults?: boolean;

  /**
   * When true, coerces types when possible (e.g., string to number).
   * @default false
   */
  coerceTypes?: boolean;
}

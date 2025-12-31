/**
 * @file Custom error classes for schema validation
 * @description Error types for validation failures and schema lookup errors
 *
 * @module schema/errors
 */

import type { ValidationErrorDetail } from './types.js';

/**
 * Error thrown when node or edge validation fails.
 *
 * @remarks
 * ValidationError provides detailed information about what failed,
 * including the specific validation errors, entity ID, and entity type.
 *
 * @example
 * ```typescript
 * try {
 *   validator.validateNodeOrThrow(node);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('Entity:', error.entityId);
 *     console.log('Type:', error.entityType);
 *     console.log('Errors:', error.errors);
 *   }
 * }
 * ```
 */
export class ValidationError extends Error {
  /**
   * The name of this error type.
   */
  public readonly name = 'ValidationError';

  /**
   * Array of detailed validation errors.
   */
  public readonly errors: ValidationErrorDetail[];

  /**
   * The ID of the entity that failed validation.
   */
  public readonly entityId: string;

  /**
   * The type of the entity that failed validation.
   */
  public readonly entityType: string;

  /**
   * Creates a new ValidationError.
   *
   * @param message - Human-readable error message
   * @param errors - Array of validation error details
   * @param entityId - ID of the entity that failed validation
   * @param entityType - Type of the entity that failed validation
   */
  constructor(
    message: string,
    errors: ValidationErrorDetail[],
    entityId: string,
    entityType: string
  ) {
    super(message);
    this.errors = errors;
    this.entityId = entityId;
    this.entityType = entityType;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Returns a detailed string representation of the validation error.
   */
  public toDetailedString(): string {
    const errorMessages = this.errors
      .map((e) => `  - ${e.path}: ${e.message} (${e.keyword})`)
      .join('\n');

    return `${this.message}\nEntity ID: ${this.entityId}\nEntity Type: ${this.entityType}\nErrors:\n${errorMessages}`;
  }
}

/**
 * Error thrown when a schema is not found for a given type.
 *
 * @remarks
 * This error is thrown in strict mode when validation is attempted
 * on an entity whose type has no registered schema.
 *
 * @example
 * ```typescript
 * try {
 *   const schema = registry.getNodeSchemaOrThrow('UnknownType');
 * } catch (error) {
 *   if (error instanceof SchemaNotFoundError) {
 *     console.log('Missing schema for:', error.schemaType);
 *     console.log('Entity kind:', error.entityKind);
 *   }
 * }
 * ```
 */
export class SchemaNotFoundError extends Error {
  /**
   * The name of this error type.
   */
  public readonly name = 'SchemaNotFoundError';

  /**
   * The type name for which no schema was found.
   */
  public readonly schemaType: string;

  /**
   * The kind of entity ('node' or 'edge').
   */
  public readonly entityKind: 'node' | 'edge';

  /**
   * Creates a new SchemaNotFoundError.
   *
   * @param schemaType - The type name that was not found
   * @param entityKind - Whether this was for a node or edge schema
   */
  constructor(schemaType: string, entityKind: 'node' | 'edge') {
    super(`No schema registered for ${entityKind} type: ${schemaType}`);
    this.schemaType = schemaType;
    this.entityKind = entityKind;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SchemaNotFoundError);
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, SchemaNotFoundError.prototype);
  }
}

/**
 * Error thrown when a schema definition is invalid.
 *
 * @remarks
 * This error is thrown when attempting to register a schema that
 * does not conform to JSON Schema specifications.
 *
 * @example
 * ```typescript
 * try {
 *   registry.registerNodeSchema('Person', invalidSchema);
 * } catch (error) {
 *   if (error instanceof InvalidSchemaError) {
 *     console.log('Invalid schema for type:', error.schemaType);
 *     console.log('Reason:', error.reason);
 *   }
 * }
 * ```
 */
export class InvalidSchemaError extends Error {
  /**
   * The name of this error type.
   */
  public readonly name = 'InvalidSchemaError';

  /**
   * The type name for which the schema was invalid.
   */
  public readonly schemaType: string;

  /**
   * Description of why the schema is invalid.
   */
  public readonly reason: string;

  /**
   * Creates a new InvalidSchemaError.
   *
   * @param schemaType - The type name with the invalid schema
   * @param reason - Why the schema is invalid
   */
  constructor(schemaType: string, reason: string) {
    super(`Invalid schema for type '${schemaType}': ${reason}`);
    this.schemaType = schemaType;
    this.reason = reason;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidSchemaError);
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, InvalidSchemaError.prototype);
  }
}

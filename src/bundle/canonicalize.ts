/**
 * @file Canonical serialization helpers for deterministic bundle export
 * @description Produces a byte-stable, insertion-order-independent representation
 * of arbitrary JSON-compatible values by recursively sorting object keys.
 *
 * @remarks
 * This is a deliberately small, self-contained local canonicalizer. It is the
 * seam intended to be replaced by the spine's `canon v1` serializer once that
 * interface is frozen (see `roadmaps/_SPINE.md` S1). Keep it isolated so the
 * swap is a one-file change.
 *
 * Scope: object key ordering only. Array element order is meaningful and is
 * preserved; callers are responsible for sorting domain arrays (nodes, edges)
 * with explicit comparators before canonicalization.
 *
 * @module bundle/canonicalize
 */

/**
 * Recursively produce a canonical clone of a JSON-compatible value with all
 * object keys inserted in sorted (code-unit) order.
 *
 * @param value - Any JSON-serializable value
 * @returns A new value with deterministic object-key ordering. Arrays preserve
 * their element order; primitives are returned unchanged.
 *
 * @remarks
 * - Object keys are sorted using the default string comparison (UTF-16 code
 *   units), matching `Array.prototype.sort` defaults so the order is stable
 *   across runs and platforms.
 * - `undefined` object values are dropped (consistent with `JSON.stringify`).
 * - Input is never mutated; a fresh structure is always returned. This also
 *   serves as a defensive clone at the bundle boundary.
 */
export function canonicalize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item)) as unknown as T;
  }

  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const keys = Object.keys(source).sort();
    for (const key of keys) {
      const v = source[key];
      if (v === undefined) {
        continue;
      }
      result[key] = canonicalize(v);
    }
    return result as unknown as T;
  }

  return value;
}

/**
 * Serialize a value to a canonical JSON string: deterministic regardless of
 * the input object-key insertion order.
 *
 * @param value - Any JSON-serializable value
 * @returns A canonical JSON string suitable for hashing / content-addressing
 */
export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

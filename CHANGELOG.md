# Changelog

## Unreleased

### Fixed

- Canonicalization now preserves an own JSON `__proto__` key as an enumerable
  data property without changing the result object's ordinary prototype.
  Nested cloning, sorted object keys, array order and omission of undefined
  object values are preserved. Consumers storing canonical strings or hashes
  for objects with this key should regenerate those values: earlier versions
  could omit the key from serialized output.

### Tests

- Added dependency-free canonicalization regression tests, including nested
  prototype-like keys, descriptors, nonmutation and JSON compatibility.
  Run `npm run test:canonicalize` with Node 24 or later (native TypeScript
  loading). This focused command does not change the package's runtime support
  policy or replace the existing Vitest suite.

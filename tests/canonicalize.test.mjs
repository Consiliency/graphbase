import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalize, canonicalStringify } from '../src/bundle/canonicalize.ts';

test('preserves own prototype-like JSON keys as ordinary data properties', () => {
  const source = JSON.parse('{"__proto__":{"polluted":true},"constructor":3,"prototype":4,"a":1}');
  const result = canonicalize(source);
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
  assert.deepEqual(Object.keys(result), ['__proto__', 'a', 'constructor', 'prototype']);
  assert.deepEqual(Object.getOwnPropertyDescriptor(result, '__proto__'), {
    value: { polluted: true }, enumerable: true, writable: true, configurable: true,
  });
  assert.deepEqual(JSON.parse(canonicalStringify(source)), source);
});

test('clones nested objects and arrays without changing the input or array order', () => {
  const source = JSON.parse('{"list":[{"__proto__":7,"z":3},2,1],"b":{"y":2,"x":1}}');
  const before = JSON.stringify(source);
  Object.freeze(source.list[0]);
  Object.freeze(source.list);
  Object.freeze(source.b);
  Object.freeze(source);
  const result = canonicalize(source);
  assert.equal(JSON.stringify(source), before);
  assert.notEqual(result, source);
  assert.notEqual(result.list, source.list);
  assert.notEqual(result.list[0], source.list[0]);
  assert.notEqual(result.b, source.b);
  assert.deepEqual(result.list, source.list);
  assert.equal(Object.getPrototypeOf(result.list[0]), Object.prototype);
  assert.equal(Object.hasOwn(result.list[0], '__proto__'), true);
});

test('sorts object keys deterministically including own __proto__', () => {
  const a = JSON.parse('{"z":3,"__proto__":null,"a":{"y":2,"x":1}}');
  const b = JSON.parse('{"a":{"x":1,"y":2},"__proto__":null,"z":3}');
  const expected = '{"__proto__":null,"a":{"x":1,"y":2},"z":3}';
  assert.equal(canonicalStringify(a), expected);
  assert.equal(canonicalStringify(b), expected);
});

test('retains undefined omission, null, primitives and array JSON behavior', () => {
  const source = { missing: undefined, present: null, list: [undefined, false, 0, ''] };
  const result = canonicalize(source);
  assert.equal(Object.hasOwn(result, 'missing'), false);
  assert.deepEqual(result.list, [undefined, false, 0, '']);
  assert.equal(canonicalStringify(source), '{"list":[null,false,0,""],"present":null}');
  for (const value of [null, undefined, false, true, 0, 4, 'hello']) {
    assert.equal(canonicalize(value), value);
  }
});

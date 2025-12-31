# Core-Graph

A flexible graph database abstraction layer for TypeScript applications.

## Overview

Core-Graph provides type-safe node/edge management, schema validation, query capabilities, and pluggable storage backends for working with graph data structures.

## Features (Phase 1)

- ✅ Type-safe node and edge primitives
- ✅ JSON Schema validation for graph data
- ✅ In-memory storage backend
- ✅ Query and traversal operations
- ✅ Bundle import/export (JSON format)
- ✅ Full TypeScript support with strict typing

## Quick Start

```typescript
import { Graph } from 'core-graph';

// Create graph
const graph = new Graph({ storage: 'memory' });

// Add nodes
const alice = graph.addNode({
  type: 'Person',
  properties: { name: 'Alice', age: 30 }
});

// Add edges
graph.addEdge({
  type: 'KNOWS',
  source: alice.id,
  target: bob.id
});

// Query
const people = graph.findNodes({ type: 'Person' });
```

## Status

🚧 **Phase 1 in development** - Core functionality being implemented

See `plain-english-spec.md` for full specification.

## License

MIT

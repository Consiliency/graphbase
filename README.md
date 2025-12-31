# GraphBase

A TypeScript graph database abstraction layer with type-safe node/edge management and schema validation.

## Overview

GraphBase provides a clean, type-safe API for working with graph data structures in TypeScript applications. It supports schema validation, query operations, traversal algorithms, and pluggable storage backends.

Perfect for applications that need to model interconnected data such as knowledge graphs, relationship networks, or dependency graphs.

## Features

- ✅ **Type-safe primitives** - Generic `Node<T>` and `Edge<T>` with full TypeScript support
- ✅ **JSON Schema validation** - Validate node and edge properties against schemas
- ✅ **In-memory storage** - Fast Map-based storage for development and testing
- ✅ **Query operations** - Find nodes/edges by ID, type, or property filters
- ✅ **Graph traversal** - BFS traversal, path finding, neighbor queries
- ✅ **Bundle import/export** - Serialize/deserialize graphs to JSON
- ✅ **348 tests** - Comprehensive test coverage (96.21%)

## Installation

```bash
npm install graphbase
```

## Quick Start

```typescript
import { Graph } from 'graphbase';

// Create a graph with in-memory storage
const graph = new Graph({ storage: 'memory' });

// Register schemas for validation
graph.registerSchema('Person', {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'number', minimum: 0 }
  },
  required: ['name']
});

// Add nodes
const alice = graph.addNode({
  type: 'Person',
  properties: { name: 'Alice', age: 30 }
});

const bob = graph.addNode({
  type: 'Person',
  properties: { name: 'Bob', age: 25 }
});

// Add edges
graph.addEdge({
  type: 'KNOWS',
  source: alice.id,
  target: bob.id,
  properties: { since: '2020-01-15' }
});

// Query
const people = graph.findNodes({ type: 'Person' });
const aliceFriends = graph.neighbors(alice.id, 'outgoing');

// Traverse
const reachable = graph.traverse(alice.id);

// Export
const bundle = graph.export({ includeSchemas: true });
```

## Use Cases

- **Knowledge graphs** - Model concepts and relationships
- **Social networks** - Represent users and connections
- **Dependency graphs** - Track dependencies between components
- **Organizational charts** - Model hierarchies and reporting structures
- **Workflow graphs** - Represent process flows and state machines

## Documentation

- [Specification](plain-english-spec.md) - Full requirements and architecture
- [Demo](demo.ts) - Comprehensive feature demonstration

## Status

✅ **Phase 1 Complete** - Production-ready core functionality
- 348 tests passing
- 96.21% code coverage
- Full TypeScript strict mode
- Comprehensive documentation

## Roadmap

**Phase 2** (planned):
- File-based persistent storage
- Advanced path finding algorithms (Dijkstra, A*)
- Graph algorithms (PageRank, centrality)
- Performance optimization for large graphs

**Phase 3+** (future):
- Visualization support
- GraphQL API layer
- Database backends (Neo4j, ArangoDB)

## License

MIT

---

**Note**: This is a standalone graph database library. For code visualization needs, see [CodeGraph-DE](https://github.com/yourusername/codegraph-de). For compiler IR needs, see [CoreGraph](https://github.com/yourusername/core-graph).

# ROADMAP: Core-Graph - Graph Database Abstraction Layer

> **Generated**: 2025-12-30
> **Based on**: CODEBASE.md analysis + plain-english-spec.md
> **Intent**: Build a flexible TypeScript graph database abstraction layer with type-safe node/edge management, schema validation, and pluggable storage backends

## Executive Summary

This roadmap outlines the development of **Core-Graph**, a TypeScript library that provides a clean, type-safe API for working with graph data structures. The library will support schema validation via JSON Schema, pluggable storage backends (in-memory and file-based), and a comprehensive set of graph operations including querying, traversal, and path finding.

The implementation follows a **layered architecture** approach, starting with foundational type definitions and building upward through validation, storage, operations, and finally the high-level Graph API class.

## Current State

**Status**: Greenfield project - no implementation exists

**Architecture Baseline**:
- Project structure defined in CODEBASE.md
- 6 logical modules identified matching swim lanes
- Technology stack selected: TypeScript 5.x, Vitest, AJV, tsup
- Design patterns identified: Layered architecture, Strategy (storage), Registry (schema), Builder (Graph construction)

**Available Documentation**:
- Architecture specification (CODEBASE.md)
- Plain-English specification (plain-english-spec.md)
- Project README

## Target State

**Phase 1 Complete**:
- Fully functional graph database abstraction layer
- Type-safe API with TypeScript strict mode
- Schema validation for nodes and edges via JSON Schema
- In-memory storage backend operational
- Basic graph operations: query, traverse, path finding
- Import/export to JSON bundle format
- Test coverage >= 80%
- Complete API documentation (JSDoc)
- Quick start guide in README

**Phase 2 Complete** (future):
- File-based persistent storage backend
- Advanced graph algorithms (Dijkstra, A*, PageRank, centrality)
- Optimization for large graphs (lazy loading, indexing)
- CLI tooling for bundle manipulation

## Phase Overview

| Phase | Name | Objective | Est. Lanes | Dependencies |
|-------|------|-----------|------------|--------------|
| 1 | Core Functionality | Build foundational graph library with in-memory storage | 6 | None |
| 2 | Advanced Features | Add persistence, advanced algorithms, optimization | TBD | Phase 1 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AJV validation performance on large graphs | Medium | Medium | Batch validation, optional validation mode, performance benchmarks |
| Memory storage scalability limits | High | Medium | Explicit Phase 2 file storage, document memory limits |
| Generic type complexity in property system | Medium | Low | Keep property types simple, use `Record<string, any>` fallback |
| Bundle size for large graph exports | Medium | Medium | Plan streaming export/import for Phase 2 |
| Dependency ordering across swim lanes | Low | High | Clear interface freeze points, foundation-first approach |

---

## Phase 1: Core Functionality

### Objectives
- Establish type-safe foundation for all graph primitives
- Implement JSON Schema validation for nodes and edges
- Build pluggable storage abstraction with in-memory implementation
- Provide comprehensive graph operations (query, traverse, paths, subgraph)
- Enable graph serialization via JSON bundle format
- Create high-level Graph class as primary API
- Achieve >= 80% test coverage
- Document all public APIs

### Scope

**Components Affected:**
| Component | Action | Description |
|-----------|--------|-------------|
| `src/types/` | Create | Core type system: Node, Edge, Relationship, Graph |
| `src/schema/` | Create | JSON Schema validation layer with AJV |
| `src/storage/` | Create | Storage abstraction with in-memory implementation |
| `src/operations/` | Create | Graph algorithms: query, traverse, paths, subgraph |
| `src/bundle/` | Create | Import/export to JSON bundle format |
| `src/core/` | Create | High-level Graph API class |
| `src/index.ts` | Create | Root package exports |
| `tests/unit/` | Create | Unit tests for all modules |
| `tests/integration/` | Create | Integration tests for Graph class |
| `package.json` | Create | Project configuration and dependencies |
| `tsconfig.json` | Create | TypeScript strict mode configuration |
| `vitest.config.ts` | Create | Test framework configuration |
| `README.md` | Update | Quick start guide and API overview |

**Files Estimated**:
- New: ~30 files (18 source files, 6 unit test files, 1 integration test file, 5 config files)
- Modified: 1 file (README.md)

### Interface Contracts

**Phase 1 produces the following frozen interfaces**:

#### IF-1-TYPES: Core Type System
**Frozen at**: End of SL-TYPES (before any dependent lanes begin)

```typescript
// Node interface with generic properties
interface Node<T = Record<string, any>> {
  id: string;
  type: string;
  properties: T;
}

// Edge interface with generic properties
interface Edge<T = Record<string, any>> {
  id: string;
  type: string;
  source: string;
  target: string;
  properties: T;
}

// Relationship declaration
interface Relationship {
  edgeType: string;
  sourceNodeType: string;
  targetNodeType: string;
}

// Graph structure
interface GraphData {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  metadata?: Record<string, any>;
}
```

**Consumed by**: SL-SCHEMA, SL-STORAGE, SL-OPS, SL-BUNDLE, SL-CORE

---

#### IF-2-SCHEMA: Validation Interface
**Frozen at**: End of SL-SCHEMA

```typescript
// Schema registry interface
interface SchemaRegistry {
  register(type: string, schema: JSONSchema): void;
  get(type: string): JSONSchema | null;
  has(type: string): boolean;
}

// Validator interface
interface Validator {
  validateNode(node: Node): ValidationResult;
  validateEdge(edge: Edge): ValidationResult;
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}
```

**Consumed by**: SL-CORE, SL-BUNDLE

---

#### IF-3-STORAGE: Storage Abstraction
**Frozen at**: End of SL-STORAGE (before SL-OPS and SL-BUNDLE begin)

```typescript
interface Storage {
  // Node operations
  addNode(node: Node): void;
  getNode(id: string): Node | null;
  updateNode(id: string, properties: Record<string, any>): void;
  deleteNode(id: string): void;
  findNodes(filter: NodeFilter): Node[];

  // Edge operations
  addEdge(edge: Edge): void;
  getEdge(id: string): Edge | null;
  updateEdge(id: string, properties: Record<string, any>): void;
  deleteEdge(id: string): Edge | null;
  findEdges(filter: EdgeFilter): Edge[];

  // Bulk operations
  clear(): void;
  export(): GraphData;
  import(data: GraphData): void;
}
```

**Consumed by**: SL-OPS, SL-BUNDLE, SL-CORE

---

#### IF-4-OPERATIONS: Graph Operations
**Frozen at**: End of SL-OPS

```typescript
// Query operations
function findNodes(storage: Storage, filter: NodeFilter): Node[];
function findEdges(storage: Storage, filter: EdgeFilter): Edge[];

// Traversal operations
function traverse(storage: Storage, startId: string, direction: 'outgoing' | 'incoming' | 'both'): Node[];
function neighbors(storage: Storage, nodeId: string, direction: 'outgoing' | 'incoming' | 'both'): Node[];

// Path finding
function findPath(storage: Storage, sourceId: string, targetId: string): Node[] | null;

// Subgraph extraction
function subgraph(storage: Storage, nodeIds: string[]): GraphData;
```

**Consumed by**: SL-CORE

---

#### IF-5-BUNDLE: Serialization Format
**Frozen at**: End of SL-BUNDLE

```typescript
interface Bundle {
  version: string;
  metadata?: Record<string, any>;
  nodes: Node[];
  edges: Edge[];
  schemas?: {
    nodes: Record<string, JSONSchema>;
    edges: Record<string, JSONSchema>;
  };
}

function exportBundle(storage: Storage, registry: SchemaRegistry): Bundle;
function importBundle(bundle: Bundle, storage: Storage, registry: SchemaRegistry): void;
function validateBundle(bundle: Bundle): ValidationResult;
```

**Consumed by**: SL-CORE

---

### Success Criteria
- [ ] All 6 swim lanes implemented and passing tests
- [ ] TypeScript compiles with strict mode, no errors
- [ ] Unit test coverage >= 80% for each module
- [ ] Integration tests verify end-to-end Graph class functionality
- [ ] Can create graph, add nodes/edges with schema validation
- [ ] Can query nodes by ID, type, and property filters
- [ ] Can traverse graph following edges in all directions
- [ ] Can find paths between nodes
- [ ] Can export graph to JSON bundle format
- [ ] Can import graph from JSON bundle with validation
- [ ] All public APIs documented with JSDoc
- [ ] README includes quick start guide with working examples
- [ ] Performance baseline established for 1K, 10K, 100K nodes

### Potential Swim Lanes

#### SL-TYPES: Type System Foundation
**Purpose**: Define core data structures and interfaces for all graph primitives

**Deliverables**:
- `src/types/Node.ts` - Node interface with generic properties
- `src/types/Edge.ts` - Edge interface with source/target references
- `src/types/Relationship.ts` - Relationship type declarations
- `src/types/Graph.ts` - Graph data structure interface
- `src/types/index.ts` - Public type exports
- `tests/unit/types.test.ts` - Type validation tests

**Files**: 6 files

**Dependencies**:
- External: None
- Internal: None (foundation layer)

**Interface Freeze**: Must freeze before SL-SCHEMA, SL-STORAGE, SL-OPS, SL-BUNDLE, SL-CORE begin

**Acceptance Criteria**:
- [ ] All core types defined with TypeScript generics
- [ ] No `any` types in public interfaces
- [ ] Type exports working correctly
- [ ] Types compile in strict mode
- [ ] Type tests validate expected behavior

---

#### SL-SCHEMA: JSON Schema Validation
**Purpose**: Implement schema validation for nodes and edges using AJV

**Deliverables**:
- `src/schema/validator.ts` - AJV-based validation logic
- `src/schema/registry.ts` - Schema storage and retrieval
- `src/schema/types.ts` - Schema-related type definitions
- `src/schema/errors.ts` - Validation error types
- `src/schema/index.ts` - Public schema exports
- `tests/unit/schema.test.ts` - Validation tests

**Files**: 6 files

**Dependencies**:
- External: AJV (npm package)
- Internal: SL-TYPES (Node, Edge interfaces)

**Interface Freeze**: Before SL-CORE, SL-BUNDLE begin using validation

**Acceptance Criteria**:
- [ ] Can register schemas for node types
- [ ] Can register schemas for edge types
- [ ] Validates nodes against registered schemas
- [ ] Validates edges against registered schemas
- [ ] Returns detailed error messages on validation failure
- [ ] Handles missing schemas gracefully
- [ ] Tests cover valid/invalid data scenarios

---

#### SL-STORAGE: Storage Abstraction Layer
**Purpose**: Create pluggable storage interface with in-memory implementation

**Deliverables**:
- `src/storage/interface.ts` - Storage interface definition (CRUD operations)
- `src/storage/memory.ts` - Map-based in-memory implementation
- `src/storage/factory.ts` - Storage backend selection logic
- `src/storage/index.ts` - Public storage exports
- `tests/unit/storage.test.ts` - Storage backend tests

**Files**: 5 files

**Dependencies**:
- External: None
- Internal: SL-TYPES (Node, Edge, GraphData interfaces)

**Interface Freeze**: Before SL-OPS, SL-BUNDLE, SL-CORE begin using storage

**Acceptance Criteria**:
- [ ] Storage interface defines all CRUD operations
- [ ] In-memory storage implements full interface
- [ ] Can add, get, update, delete nodes
- [ ] Can add, get, update, delete edges
- [ ] Can find nodes/edges with filters
- [ ] Can export/import full graph data
- [ ] Factory selects correct backend
- [ ] Tests verify all operations

---

#### SL-OPS: Graph Operations
**Purpose**: Implement core graph algorithms for querying, traversal, and path finding

**Deliverables**:
- `src/operations/query.ts` - Find nodes/edges by ID, type, properties
- `src/operations/traverse.ts` - Graph traversal (outgoing, incoming, both)
- `src/operations/paths.ts` - Path finding between nodes
- `src/operations/subgraph.ts` - Subgraph extraction
- `src/operations/index.ts` - Public operations exports
- `tests/unit/operations.test.ts` - Algorithm tests

**Files**: 6 files

**Dependencies**:
- External: None
- Internal: SL-TYPES (data structures), SL-STORAGE (data access)

**Interface Freeze**: Before SL-CORE integrates operations

**Acceptance Criteria**:
- [ ] Can query nodes by ID, type, property filters
- [ ] Can query edges by source, target, type
- [ ] Can traverse graph in all directions
- [ ] Can find neighbors of a node
- [ ] Can calculate node degree (in, out, total)
- [ ] Can find paths between nodes (basic BFS/DFS)
- [ ] Can extract subgraphs
- [ ] Tests cover various graph structures (linear, tree, cyclic)

---

#### SL-BUNDLE: Import/Export
**Purpose**: Enable graph serialization to/from JSON bundle format

**Deliverables**:
- `src/bundle/format.ts` - Bundle format specification and types
- `src/bundle/exporter.ts` - Export graph to JSON bundle
- `src/bundle/importer.ts` - Import graph from JSON bundle
- `src/bundle/validator.ts` - Validate bundle structure
- `src/bundle/index.ts` - Public bundle exports
- `tests/unit/bundle.test.ts` - Serialization tests

**Files**: 6 files

**Dependencies**:
- External: None
- Internal: SL-TYPES (data structures), SL-STORAGE (data access), SL-SCHEMA (schema export/import)

**Interface Freeze**: Before SL-CORE integrates import/export

**Acceptance Criteria**:
- [ ] Can export graph to JSON bundle
- [ ] Bundle includes nodes, edges, schemas, metadata
- [ ] Can import graph from JSON bundle
- [ ] Validates bundle structure before import
- [ ] Handles version compatibility
- [ ] Supports partial import/export
- [ ] Tests verify round-trip serialization

---

#### SL-CORE: Graph API Class
**Purpose**: Provide high-level Graph class as primary public API

**Deliverables**:
- `src/core/Graph.ts` - Main Graph class integrating all layers
- `src/core/index.ts` - Core API exports
- `src/index.ts` - Root package entry point
- `tests/integration/graph.test.ts` - End-to-end integration tests
- Updated `README.md` - Quick start guide

**Files**: 5 files

**Dependencies**:
- External: All dependencies transitively
- Internal: ALL previous swim lanes (SL-TYPES, SL-SCHEMA, SL-STORAGE, SL-OPS, SL-BUNDLE)

**Interface Freeze**: This is the public API - frozen at Phase 1 completion

**Acceptance Criteria**:
- [ ] Graph class instantiates with storage backend selection
- [ ] Provides methods for all node operations (add, get, update, delete, find)
- [ ] Provides methods for all edge operations (add, get, update, delete, find)
- [ ] Integrates schema registration and validation
- [ ] Provides query and traversal methods
- [ ] Provides import/export methods
- [ ] All methods properly validated and error handling
- [ ] Integration tests verify complete workflows
- [ ] API matches example usage in specification
- [ ] README includes working code examples

---

### Dependencies

**External Dependencies**:
| Package | Version | Purpose | Phase |
|---------|---------|---------|-------|
| TypeScript | 5.x | Type-safe development | 1 |
| Vitest | Latest | Testing framework | 1 |
| AJV | Latest | JSON Schema validation | 1 |
| tsup | Latest | TypeScript bundler | 1 |

**Internal Dependencies** (Swim Lane Order):
```
SL-TYPES (foundation)
  ├─→ SL-SCHEMA (depends on types)
  ├─→ SL-STORAGE (depends on types)
  │     ├─→ SL-OPS (depends on types + storage)
  │     └─→ SL-BUNDLE (depends on types + storage + schema)
  └─→ SL-CORE (depends on ALL previous lanes)
```

**Critical Path**:
1. SL-TYPES must complete first (foundation for everything)
2. SL-SCHEMA and SL-STORAGE can proceed in parallel after SL-TYPES
3. SL-OPS and SL-BUNDLE require both SL-TYPES and SL-STORAGE
4. SL-CORE integrates all components and must be last

**Parallel Opportunities**:
- After SL-TYPES: SL-SCHEMA || SL-STORAGE (no shared files)
- After SL-STORAGE: SL-OPS || SL-BUNDLE (minimal overlap, different concerns)

### Open Questions
- [ ] Should validation be synchronous or async? (AJV supports both)
  - **Impact**: API signatures, error handling patterns
  - **Recommendation**: Start synchronous for simplicity, async in Phase 2 if needed

- [ ] Should Graph class support event emitters for change notifications?
  - **Spec says**: Optional feature
  - **Recommendation**: Defer to Phase 2 to reduce Phase 1 scope

- [ ] What ID generation strategy for nodes/edges?
  - **Options**: UUID, incremental, user-provided
  - **Recommendation**: User-provided IDs required (most flexible), add UUID helper in Phase 2

- [ ] Performance threshold for "large graph" definition?
  - **Recommendation**: Establish baseline with 1K, 10K, 100K nodes, document limits

---

## Phase 2: Advanced Features (Preview)

**Scope** (to be detailed in future roadmap):
- File-based persistent storage backend (`storage/file.ts`)
- Advanced path finding algorithms (Dijkstra, A*)
- Graph algorithms (PageRank, centrality measures, clustering)
- Optimization for large graphs (lazy loading, property indexing)
- CLI tooling for bundle manipulation
- Event system for graph change notifications
- Streaming import/export for large bundles

**Dependencies**: Phase 1 complete

**Interface Evolution**:
- Storage interface may add `flush()`, `compact()` for file backend
- Operations may add `findShortestPath()`, `pageRank()`, etc.
- Graph class may add event emitter methods

**Open Design Questions**:
- File storage format: Single JSON file vs directory structure?
- Index strategy for property-based queries on large graphs?
- Should Phase 2 maintain full backward compatibility with Phase 1 API?

---

## Appendix: Technical Debt Addressed

**Current Debt**: None - greenfield project

**Preventive Measures**:
- TypeScript strict mode from day one
- Test coverage requirement >= 80%
- API documentation required before merge
- Interface-first design to prevent coupling

---

## Appendix: Out of Scope

The following are explicitly **NOT** included in Phase 1 or Phase 2:

1. **GraphQL API Layer** - Deferred to Phase 3+
2. **Visualization Support** - Deferred to Phase 3+
3. **Graph Database Backends** (Neo4j, ArangoDB) - Deferred to Phase 3+
4. **Distributed Graphs** - Deferred to Phase 3+
5. **ACID Transactions** - Deferred to Phase 3+
6. **Real-time Collaboration** - Not planned
7. **Authentication/Authorization** - Application responsibility, not library concern

---

## Completion Checklist

**Phase 1 Ready for Release When**:
- [ ] All 6 swim lanes merged to main branch
- [ ] CI/CD pipeline passing (lint, type-check, test)
- [ ] Test coverage >= 80% verified
- [ ] Performance benchmarks documented
- [ ] API documentation complete (JSDoc)
- [ ] README with quick start guide published
- [ ] Example usage verified working
- [ ] npm package published (if applicable)
- [ ] Release notes prepared

**Next Steps After Roadmap Approval**:
1. Review this roadmap for accuracy and completeness
2. Resolve open questions in team discussion
3. Run: `/ai-dev-kit:plan-phase specs/ROADMAP.md "Phase 1"`
4. Begin execution with: `/ai-dev-kit:execute-lane plans/phase-1.md SL-TYPES`

---

**Roadmap Version**: 1.0.0
**Status**: Draft - Awaiting Review
**Estimated Duration**: Phase 1 = 6-8 weeks (assuming 1 week per swim lane with parallel work)

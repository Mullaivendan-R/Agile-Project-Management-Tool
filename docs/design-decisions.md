# Architectural & Design Decisions

This document details key engineering trade-offs, architecture decisions, and design rationale behind the Agile Project Management Tool.

---

## 1. Why SQLite?
- **Zero Overhead & Portability**: SQLite requires no separate database daemon, container, or network configuration. A developer can clone the repo and run it immediately on any OS.
- **ACID Compliance**: Full transaction support with WAL mode capabilities ensures high reliability for small-to-medium teams.
- **Relational Integrity**: With `PRAGMA foreign_keys = ON;`, SQLite fully enforces foreign keys, cascading deletions, and constraints identically to larger RDBMS engines.

---

## 2. Why FastAPI?
- **Modern Python with Type Hints**: Native support for Python 3.12+ type annotations and Pydantic v2 ensures end-to-end type safety and automated validation.
- **High Performance ASGI**: Built on Starlette and Uvicorn, FastAPI provides exceptional throughput and native asynchronous primitives for non-blocking I/O.
- **Automated OpenAPI / Swagger UI**: Generates interactive API documentation at `/docs` and `/redoc` directly from Python schemas, eliminating documentation drift.

---

## 3. Why REST?
- **Universal Standard**: REST over HTTP is well-understood, easily tested via standard tooling (curl, Postman, pytest), and intuitive for full-stack developers.
- **Deterministic Status Codes**: Maps cleanly to HTTP semantics (`201 Created`, `204 No Content`, `404 Not Found`, `422 Unprocessable Content`).
- **Simplicity vs. GraphQL/gRPC**: For small team agile tooling, REST avoids the operational complexity of GraphQL schemas or binary protobuf compilation.

---

## 4. Why SQLAlchemy 2.0?
- **ORM Power with SQL Abstraction**: Provides clean object-relational mapping while preventing SQL injection vulnerabilities.
- **Eager Loading Optimization**: Methods such as `selectinload` allow retrieving the entire `Project -> User Story -> Task` hierarchy in optimized database round trips rather than experiencing N+1 query degradation.
- **Portability**: Code written against SQLAlchemy can easily migrate to PostgreSQL or MySQL in the future by simply changing `DATABASE_URL`.

---

## 5. Why the Project &rarr; User Story &rarr; Task Hierarchy?
- **Industry Agile Standard**: Matches Scrum/Kanban methodologies where a broad Project initiative is broken down into customer-centric User Stories, which are further decomposed into technical engineering Tasks.
- **Clear Ownership & Traceability**: Prevents orphaned tasks and ensures every unit of work aligns directly with a tangible user story and project goal.

---

## 6. Why the Background Workflow?
- **Proactive Deadline Awareness**: Developers and project managers should not rely solely on manually opening individual tasks to discover that a deliverable is overdue or due tomorrow.
- **Decoupled Performance**: Running deadline checks asynchronously in a background loop ensures user API requests remain snappy and are never delayed by batch scanning.

---

## 7. Why Notifications are Stored in the Database?
- **Durability & Multi-Client Sync**: Storing notifications in the database ensures alerts persist across server restarts and are visible across all browser sessions and devices.
- **Auditability & State Management**: Supports tracking `created_at` and `read_at` timestamps, enabling "mark as read" features and unread counter badges.
- **Deduplication Simplicity**: Relational queries allow efficient checks (`task_id` + `type`) to guarantee identical alerts are never generated twice for the same task state.

---

## 8. How Deletion of Parent Records is Handled?
- **Selected Approach: Cascading Deletes (`ON DELETE CASCADE`)**:
  - When a Project is deleted, its User Stories and child Tasks are cascade-deleted.
  - When a User Story is deleted, its child Tasks are cascade-deleted.
- **Rationale**: An agile Task or Story cannot meaningfully exist in isolation without a parent story or project. Allowing orphaned tasks creates data inconsistency and clutter.
- **Safety Mechanism**: The frontend provides a prominent red warning confirmation modal highlighting that all child stories and tasks will be permanently removed.

---

## 9. Why the Architecture is Suitable for a Small Team?
- **Low Operational Cognitive Load**: A small team doesn't have dedicated DevOps engineers to maintain Kafka clusters, Redis caches, or Kubernetes pods.
- **Rapid Feature Velocity**: A clean monolith with clear separation of concerns (Routers &rarr; Schemas &rarr; Services &rarr; Models) allows developers to build, test, and refactor features quickly.
- **Single-Repository Simplicity**: Everything needed to run the app exists within `frontend/` and `backend/`.

---

## 10. Trade-offs and Pragmatic Choices
- **In-Memory Worker vs. Celery/Redis**: An in-process `asyncio` worker was selected over Celery/Redis. This eliminates external broker dependencies while fulfilling all asynchronous scheduling requirements for a small team.
- **Client-Side SPA Routing vs. Full Router Framework**: A lightweight view-state router was implemented in React, keeping bundle size small, dependencies minimal, and navigation immediate.
- **SQLite Single-Writer Concurrency**: Sufficient for small team workloads. If concurrent write volume grows, the database engine can be swapped to PostgreSQL with zero changes to business logic thanks to SQLAlchemy.

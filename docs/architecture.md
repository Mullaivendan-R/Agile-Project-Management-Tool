# System Architecture Documentation

## 1. High-Level Architecture Overview

The **Agile Project Management Tool** follows a clean, decoupled client-server architecture. The frontend is an interactive Single Page Application (SPA) built with React and TypeScript, while the backend is an asynchronous RESTful service implemented with FastAPI, SQLAlchemy 2.0, and SQLite.

An autonomous background worker runs concurrently alongside the web API to monitor task deadlines and generate in-app alerts.

### System Flow Diagram

```
+-------------------------------------------------------------------------+
|                              FRONTEND LAYER                             |
|  React 18 SPA (TypeScript + Tailwind CSS + Lucide Icons)               |
|                                                                         |
|  [ Dashboard ]  [ Project List ]  [ Project Details ]  [ Alerts Panel ] |
|         |                |                  |                 |         |
|         +----------------+------------------+-----------------+         |
|                                  |                                      |
|                       [ Centralized API Services ]                      |
|                (projectService, storyService, taskService)              |
+----------------------------------+--------------------------------------+
                                   | HTTP / JSON REST
                                   v
+-------------------------------------------------------------------------+
|                               BACKEND LAYER                             |
|  FastAPI Application (Python 3.12 / ASGI / Uvicorn)                     |
|                                                                         |
|  [ CORS & Security ]   [ Request Validation ]   [ Error Sanitization ]  |
|                                  |                                      |
|  +-------------------------------+-----------------------------------+  |
|  |                         API ROUTERS                               |  |
|  |   /api/projects       /api/stories       /api/tasks     /notifs   |  |
|  +-------------------------------+-----------------------------------+  |
|                                  |                                      |
|  +-------------------------------+-----------------------------------+  |
|  |                    SERVICE / BUSINESS LAYER                       |  |
|  |  ProjectService     StoryService      TaskService   NotifService  |  |
|  +-------------------------------+-----------------------------------+  |
|                                  |                                      |
|  +-------------------------------+-----------------------------------+  |
|  |                     ORM & DATA ACCESS LAYER                       |  |
|  |         SQLAlchemy 2.0 Declarative Models & SessionLocal          |  |
|  |                   (Foreign Key Enforcement ON)                    |  |
|  +-------------------------------+-----------------------------------+  |
+----------------------------------+--------------------------------------+
                                   |
                                   v
+-------------------------------------------------------------------------+
|                             PERSISTENCE                                 |
|                    SQLite 3 Embedded Database                           |
|        (projects, stories, tasks, notifications tables with CASCADE)    |
+----------------------------------+--------------------------------------+
                                   ^
                                   | Polling query & insert
+----------------------------------+--------------------------------------+
|                     BACKGROUND ASYNCHRONOUS WORKER                      |
|  TaskMonitorWorker (asyncio loop, isolated DB sessions, retry policy)   |
|                                                                         |
|  1. Periodic Wakeup (every 60s)                                         |
|  2. Query Pending Tasks (status != 'DONE' and due_date IS NOT NULL)     |
|  3. Deduplication Check (verify no duplicate alert for task & type)     |
|  4. Generate OVERDUE or DUE_SOON In-App Notification                    |
|  5. Graceful Exception Handling & Retry Strategy                        |
+-------------------------------------------------------------------------+
```

---

## 2. Layered Responsibilities

### 2.1 Frontend Architecture (`frontend/src/`)
- **Presentation Layer (`components/`, `pages/`)**:
  - `DashboardPage`: Overview KPIs, completion rates, overdue alert sidebar, recent project summaries.
  - `ProjectsPage`: Searchable, filterable project catalogue with cascading delete confirmation modals.
  - `ProjectDetailsPage`: Comprehensive workspace supporting dual modes:
    1. **Interactive Hierarchical View** (`Project -> User Story -> Task`) with collapsible accordions, inline status dropdowns, and nested CRUD actions.
    2. **Kanban Board** with columns for `TODO`, `IN_PROGRESS`, and `DONE` for agile visual workflow.
- **Service Layer (`services/`)**:
  - `api.ts`: Centralized HTTP request utility with unified error interception, response parsing, and standard typing.
  - `projectService.ts`, `storyService.ts`, `taskService.ts`, `notificationService.ts`: Dedicated domain API wrappers ensuring components remain free of direct HTTP calls.
- **Type Definitions (`types/`)**:
  - Strict TypeScript interfaces matching backend Pydantic schemas.

### 2.2 Backend Architecture (`backend/app/`)
- **Routers (`routers/`)**:
  - Pure HTTP request handlers validating input via Pydantic schemas, managing HTTP status codes (`200`, `201`, `204`, `404`, `422`, `500`), and delegating business logic to services.
- **Service Layer (`services/`)**:
  - Encapsulates database transactions, relationship verification (e.g., verifying parent Project exists before adding a Story), eager loading optimizations, and query orchestration.
- **Models (`models/`)**:
  - SQLAlchemy 2.0 declarative models defining table schemas, constraints, foreign keys with `ON DELETE CASCADE`, and bidirectional relationships.
- **Schemas (`schemas/`)**:
  - Pydantic models for incoming request validation, default assignments, string length bounds, enum checking, and outbound serialization.
- **Worker Layer (`workers/`)**:
  - Standalone asynchronous worker operating on background asyncio tasks with dedicated database sessions.

---

## 3. Background Workflow Architecture

### Motivation & Value
Engineering teams frequently lose visibility into approaching milestones and overdue deliverables. The background monitor runs independently from user requests to identify deadlines, create actionable in-app notifications, and alert team members without imposing latency on interactive user API requests.

### Lifecycle & Failure Strategy
1. **Startup**: Attached to FastAPI's modern `lifespan` handler; begins execution non-blockingly upon server initialization.
2. **Execution**: Uses `asyncio.to_thread` to execute synchronous SQLAlchemy database operations in a worker threadpool, ensuring the FastAPI asynchronous event loop remains responsive.
3. **Session Isolation**: Each worker cycle creates and disposes of a fresh `SessionLocal` to prevent connection leaks and isolation issues.
4. **Retry Strategy**: If a database error occurs during a scan cycle, the worker retries up to 3 times with exponential backoff before logging an alert and scheduling the next cycle.
5. **Graceful Shutdown**: Intercepts application termination signals to cancel pending worker tasks cleanly.

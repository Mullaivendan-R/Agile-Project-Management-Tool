# Agile Project Management Tool

A production-minded, generic Agile Project Management web application tailored for cross-functional engineering teams. Built with a clean separation of concerns, strict hierarchical data relationships, status workflows, persistent SQLite storage, and an autonomous asynchronous deadline notification monitor.

---

## Overview

The **Agile Project Management Tool** enables teams to plan, decompose, and execute engineering sprints. Rather than domain-specific models, it strictly enforces the core agile hierarchy:

$$\text{Project} \longrightarrow \text{User Story} \longrightarrow \text{Task}$$

- **Projects** represent broad product initiatives or releases.
- **User Stories** capture user-centric requirements and acceptance criteria within a project.
- **Tasks** represent concrete units of engineering implementation under a story.
- **Notifications** provide automated in-app alerts for approaching and overdue task deadlines.

---

## Features

- **Full Hierarchical CRUD**:
  - Comprehensive Create, Read, Update, and Delete operations across all three tiers (Project, Story, Task).
  - Dedicated `/api/projects/{project_id}/hierarchy` endpoint returning the complete 3-tier nested tree in a single query.
- **Status & Priority Management**:
  - **Project Statuses**: `PLANNING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`
  - **User Story Statuses**: `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE`
  - **Task Statuses**: `TODO`, `IN_PROGRESS`, `DONE`
  - **Priority Levels**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **Dual Visual Modes**:
  - **Interactive Hierarchical Tree View**: Visual nested breakdown with collapsible stories, inline status transition selectors, and nested item creation.
  - **Kanban Board View**: Columnar sprint board (`TODO`, `IN_PROGRESS`, `DONE`) with drag/dropdown status updates.
- **Autonomous Background Notification Workflow**:
  - Background asyncio worker periodically monitors pending tasks (`status != DONE`).
  - Automatically identifies `DUE_SOON` and `OVERDUE` tasks.
  - Generates durable notifications in SQLite while preventing duplicates.
- **In-App Notification Center**:
  - Header bell icon with real-time unread badge counter.
  - Dropdown panel showing deadline alerts with quick "Mark as Read" and "Mark All as Read" actions.
  - Manual "Scan Now" trigger for immediate on-demand worker execution.
- **Cascade Deletion Protection**:
  - Foreign key constraints enforced via SQLite `PRAGMA foreign_keys = ON;`.
  - Deleting a parent safely cascades to children, guarded by two-factor confirmation dialogs.
- **Automated Demo Seeding**:
  - One-line script to populate realistic sample projects, user stories, tasks, and initial alerts.

---

## Architecture

The application adopts a decoupled layered architecture:

```
[ Frontend: React 18 + TypeScript + Tailwind CSS ]
                       |
                       | HTTP / REST (JSON)
                       v
[ REST API Routers: FastAPI / Pydantic v2 ]
                       |
                       v
[ Service Layer: Business Logic & Orchestration ]
                       |
                       v
[ ORM Layer: SQLAlchemy 2.0 with Foreign Keys ON ]
                       |
                       v
[ Persistent Storage: SQLite (agile_pm.db) ]
                       ^
                       |
[ Asynchronous Worker: Background Task Monitor ]
```

For comprehensive details and sequence diagrams, refer to [docs/architecture.md](docs/architecture.md).

---

## Technology Stack

### Frontend
- **Framework**: React 18 (with Vite bundler)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Architecture**: Centralized Service Layer (`services/api.ts`, `projectService.ts`, etc.)

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Validation & Serialization**: Pydantic v2 & `pydantic-settings`
- **ORM & Database Toolkit**: SQLAlchemy 2.0
- **Server**: Uvicorn ASGI

### Database
- **Engine**: SQLite 3 (persistent file-based storage with `PRAGMA foreign_keys = ON;`)

### Testing
- **Test Framework**: Pytest 8+ with `pytest-asyncio` and `httpx` TestClient

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entrypoint & lifespan
│   │   ├── config.py            # Pydantic BaseSettings configuration
│   │   ├── database.py          # SQLAlchemy engine, session & SQLite pragma
│   │   ├── models/              # SQLAlchemy database models
│   │   │   ├── enums.py         # Domain enumerations (statuses, priorities)
│   │   │   ├── project.py       # Project entity
│   │   │   ├── story.py         # User Story entity
│   │   │   ├── task.py          # Task entity
│   │   │   └── notification.py  # Notification entity
│   │   ├── schemas/             # Pydantic validation & response schemas
│   │   │   ├── project.py
│   │   │   ├── story.py
│   │   │   ├── task.py
│   │   │   ├── hierarchy.py
│   │   │   └── notification.py
│   │   ├── services/            # Business logic & database operations
│   │   │   ├── project_service.py
│   │   │   ├── story_service.py
│   │   │   ├── task_service.py
│   │   │   └── notification_service.py
│   │   ├── routers/             # API route handlers
│   │   │   ├── projects.py
│   │   │   ├── stories.py
│   │   │   ├── tasks.py
│   │   │   └── notifications.py
│   │   └── workers/             # Asynchronous background tasks
│   │       └── task_monitor.py  # Periodic deadline monitor worker
│   ├── tests/                   # Pytest test suite (30 test cases)
│   │   ├── conftest.py          # In-memory test DB fixture
│   │   ├── test_projects.py
│   │   ├── test_stories.py
│   │   ├── test_tasks.py
│   │   ├── test_hierarchy.py
│   │   └── test_notifications.py
│   ├── seed.py                  # Demo data population script
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.tsx       # Navigation & notifications bell
│   │   │   ├── StatusBadge.tsx  # Color-coded status/priority badges
│   │   │   ├── ConfirmModal.tsx # Destructive action confirmation
│   │   │   ├── ProjectModal.tsx # Project Create/Edit modal
│   │   │   ├── StoryModal.tsx   # Story Create/Edit modal
│   │   │   ├── TaskModal.tsx    # Task Create/Edit modal
│   │   │   └── Toast.tsx        # Toast alerts container
│   │   ├── pages/               # Top-level screen views
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── ProjectDetailsPage.tsx
│   │   ├── services/            # Centralized API service layer
│   │   │   ├── api.ts
│   │   │   ├── projectService.ts
│   │   │   ├── storyService.ts
│   │   │   ├── taskService.ts
│   │   │   └── notificationService.ts
│   │   ├── types/               # TypeScript interfaces & domain types
│   │   │   └── index.ts
│   │   ├── App.tsx              # Application layout & state coordinator
│   │   ├── main.tsx             # React DOM root mounting
│   │   └── index.css            # Tailwind CSS styling
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docs/
│   ├── architecture.md          # Architectural patterns and system flow
│   ├── database-schema.md       # ER diagram, table schemas, cascade behavior
│   ├── api.md                   # REST API specification & payloads
│   ├── security.md              # Security hardening & defensive practices
│   └── design-decisions.md      # Trade-offs, rationale, and technology choices
│
├── .env.example                 # Safe environment configuration template
├── .gitignore                   # Version control exclusion rules
└── README.md                    # Project documentation & runbook
```

---

## Database Schema

```
Project (1) ────< User Story (N) ────< Task (N) ────< Notification (N)
```

- Every **User Story** strictly belongs to exactly one **Project**.
- Every **Task** strictly belongs to exactly one **User Story**.
- Relational integrity is enforced with `ON DELETE CASCADE`.
- SQLite foreign key checks are activated on connection via `PRAGMA foreign_keys = ON;`.

For the detailed column data types, constraints, and ER diagram, see [docs/database-schema.md](docs/database-schema.md).

---

## API Documentation

FastAPI provides interactive OpenAPI documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Detailed markdown documentation with request/response schemas is available in [docs/api.md](docs/api.md).

### Key Endpoints Summary:
- **Projects**:
  - `POST /api/projects` - Create project
  - `GET /api/projects` - List all projects
  - `GET /api/projects/{project_id}` - Get project details
  - `PUT /api/projects/{project_id}` - Update project
  - `DELETE /api/projects/{project_id}` - Delete project (cascades)
  - `GET /api/projects/{project_id}/hierarchy` - Complete nested hierarchy
- **User Stories**:
  - `POST /api/projects/{project_id}/stories` - Create story
  - `GET /api/projects/{project_id}/stories` - List stories for project
  - `GET /api/stories/{story_id}` - Get story
  - `PUT /api/stories/{story_id}` - Update story
  - `DELETE /api/stories/{story_id}` - Delete story (cascades)
- **Tasks**:
  - `POST /api/stories/{story_id}/tasks` - Create task
  - `GET /api/stories/{story_id}/tasks` - List tasks for story
  - `GET /api/tasks/{task_id}` - Get task
  - `PUT /api/tasks/{task_id}` - Update task
  - `DELETE /api/tasks/{task_id}` - Delete task
- **Notifications**:
  - `GET /api/notifications` - List notifications
  - `PATCH /api/notifications/{id}/read` - Mark notification as read
  - `POST /api/notifications/read-all` - Mark all notifications as read
  - `POST /api/notifications/run-worker` - Manually trigger background deadline scan

---

## Background Workflow

The background notification monitor runs independently from API requests:

1. **Scheduled Polling**: Runs on a periodic timer (default: every 60 seconds) managed by FastAPI's `lifespan` context.
2. **Deadline Detection**:
   - Identifies non-completed tasks (`status != DONE`) with non-null `due_date`.
   - Compares task deadlines against UTC `now()`.
   - Tasks with `due_date < now` are flagged as **`OVERDUE`**.
   - Tasks due within the next 24 hours (`now <= due_date <= now + 24h`) are flagged as **`DUE_SOON`**.
3. **Deduplication Strategy**:
   - Before inserting, queries the `notifications` table for `(task_id, type)`.
   - If an alert of that type already exists for the task, duplicate generation is skipped.
4. **Resilience & Retries**:
   - Database operations are offloaded to worker threads via `asyncio.to_thread`.
   - Transient database errors trigger a 3-stage exponential backoff retry before logging failures.

---

## Security Considerations

- **Input Validation**: All incoming JSON payloads pass through Pydantic v2 schemas enforcing string lengths, types, and valid enums.
- **SQL Injection Prevention**: All queries use SQLAlchemy 2.0 parameterized queries and ORM operations; raw SQL is never executed.
- **Information Leakage Prevention**: Custom exception handlers trap unexpected server exceptions, log detailed diagnostics internally, and return sanitized HTTP 500 JSON without exposing stack traces.
- **CORS Protection**: Restricted to configured origins via `CORS_ORIGINS`.
- **Environment Isolation**: Sensitive configuration is managed via `.env` files (never committed), with `.env.example` provided.

See [docs/security.md](docs/security.md) for full security documentation.

---

## Setup Instructions

### Prerequisites
- **Python**: Version 3.10+ (Python 3.12 recommended)
- **Node.js**: Version 18+ (Node 20+ recommended)
- **npm**: Version 9+

---

## Running Backend

### 1. Create and Activate Virtual Environment

**Windows (PowerShell)**:
```powershell
cd "KPIT company project"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux**:
```bash
cd "KPIT company project"
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Seed Demo Data (Optional)
```bash
python backend/seed.py
```
*Creates initial projects ("AgileFlow Development", "Mobile Companion App"), stories, tasks, and initial deadline alerts.*

### 4. Start the Backend API Server
```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://localhost:8000`
- Swagger UI Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Running Frontend

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Testing

The backend includes a comprehensive Pytest test suite covering Project CRUD, User Story CRUD, Task CRUD, the hierarchy endpoint, cascading deletions, validation errors, background notifications, and duplicate prevention.

To run tests:

```bash
# From the project root with venv activated
pytest backend/tests -v
```

### Test Results
```text
backend/tests/test_hierarchy.py::test_project_hierarchy_retrieval PASSED
backend/tests/test_hierarchy.py::test_project_hierarchy_not_found PASSED
backend/tests/test_hierarchy.py::test_cascade_delete_project PASSED
backend/tests/test_hierarchy.py::test_cascade_delete_story PASSED
backend/tests/test_notifications.py::test_notification_generation_and_duplicate_prevention PASSED
backend/tests/test_notifications.py::test_mark_notification_as_read PASSED
backend/tests/test_notifications.py::test_cascade_delete_task_deletes_notifications PASSED
backend/tests/test_projects.py::test_create_project_success PASSED
backend/tests/test_projects.py::test_create_project_validation_failure PASSED
backend/tests/test_projects.py::test_get_projects_list PASSED
backend/tests/test_projects.py::test_get_project_by_id PASSED
backend/tests/test_projects.py::test_get_project_not_found PASSED
backend/tests/test_projects.py::test_update_project PASSED
backend/tests/test_projects.py::test_update_project_not_found PASSED
backend/tests/test_projects.py::test_delete_project PASSED
backend/tests/test_projects.py::test_delete_project_not_found PASSED
backend/tests/test_stories.py::test_create_story_success PASSED
backend/tests/test_stories.py::test_create_story_nonexistent_project PASSED
backend/tests/test_stories.py::test_create_story_invalid_enums PASSED
backend/tests/test_stories.py::test_get_stories_by_project PASSED
backend/tests/test_stories.py::test_get_stories_nonexistent_project PASSED
backend/tests/test_stories.py::test_get_story_by_id PASSED
backend/tests/test_stories.py::test_update_story PASSED
backend/tests/test_stories.py::test_delete_story PASSED
backend/tests/test_tasks.py::test_create_task_success PASSED
backend/tests/test_tasks.py::test_create_task_nonexistent_story PASSED
backend/tests/test_tasks.py::test_create_task_invalid_validation PASSED
backend/tests/test_tasks.py::test_get_tasks_by_story PASSED
backend/tests/test_tasks.py::test_update_task PASSED
backend/tests/test_tasks.py::test_delete_task PASSED

======================== 30 passed in 1.86s =========================
```

---

## Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `PROJECT_NAME` | `"Agile Project Management Tool"` | Application title |
| `API_V1_STR` | `"/api"` | API prefix |
| `DATABASE_URL` | `"sqlite:///./agile_pm.db"` | Database connection string |
| `CORS_ORIGINS` | `["http://localhost:5173", ...]` | Allowed CORS origins |
| `WORKER_INTERVAL_SECONDS` | `60` | Background monitor check frequency |
| `TASK_DUE_SOON_HOURS` | `24` | Lookahead threshold for approaching deadlines |

---

## API Documentation Links

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Interactive Reference**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Markdown Specification**: [docs/api.md](docs/api.md)

---

## AI Usage

During development, generative AI pair programming (Google Antigravity / Gemini) was leveraged to:
- Accelerate architectural scaffolding adhering to clean layered software patterns.
- Formulate complete Pydantic v2 schemas and SQLAlchemy 2.0 models with cascade constraints.
- Generate comprehensive Pytest unit and integration test coverage across edge cases.
- Draft documentation (ER diagrams, REST API specs, and architectural trade-off analyses).

All generated code was audited, verified through automated compilation (`npm run build`) and test execution (`pytest`), and verified against all acceptance criteria.

---

## Design Decisions

Key architectural choices:
1. **SQLite over PostgreSQL**: Ensures zero-friction local development for small teams while retaining full ACID compliance.
2. **FastAPI over Django/Flask**: Type hints, asynchronous performance, and automatic OpenAPI schema generation.
3. **In-Process Async Worker over Celery/Redis**: Fulfills background polling requirements without imposing operational overhead of external message brokers.
4. **Cascading Deletes over Blocked Deletes**: In agile workflows, orphaned stories or tasks lead to corrupted project state; cascading purges maintain clean data integrity.

For the full rationale behind all 10 architectural questions, read [docs/design-decisions.md](docs/design-decisions.md).

---

## Future Improvements

- **WebSockets / Server-Sent Events (SSE)**: Push real-time deadline notifications and task status changes to connected team members instantly.
- **Drag-and-Drop Kanban**: Enhance the board with HTML5 Drag and Drop or `@hello-pangea/dnd`.
- **Role-Based Access Control (RBAC)**: Support project roles (`Admin`, `Scrum Master`, `Developer`, `Viewer`).
- **Story Points & Velocity Tracking**: Add estimation metrics and burn-down charts.
- **File Attachments**: Allow uploading specifications or screenshots to user stories and tasks.

---

## Known Limitations

- **Single SQLite Writer**: SQLite handles concurrent reads gracefully, but concurrent writes acquire a database lock. For teams scaling past 50 concurrent active write operations per second, switching `DATABASE_URL` to PostgreSQL is recommended.
- **Local Browser Session Notifications**: Notifications are persisted in SQLite, but push delivery currently relies on in-app polling (every 30 seconds) rather than native OS Web Push notifications.

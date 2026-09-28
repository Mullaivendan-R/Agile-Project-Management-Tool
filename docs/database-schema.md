# Database Schema

The Agile Project Management Tool uses a relational database to manage projects, user stories, tasks, and notifications.

The data follows a simple hierarchy:

```text
Project
   ↓
User Story
   ↓
Task
   ↓
Notification
```

Each project can contain multiple user stories, each user story can contain multiple tasks, and each task can generate multiple notifications.

---

## 1. Database Structure

The application uses four main tables:

* `projects` – Stores project information.
* `stories` – Stores user stories belonging to a project.
* `tasks` – Stores individual tasks belonging to a user story.
* `notifications` – Stores deadline reminders and overdue alerts.

### Entity Relationship Diagram

```text
+----------------------+
|       PROJECT        |
+----------------------+
| id                   |
| name                 |
| description          |
| status               |
| created_at           |
| updated_at           |
+----------+-----------+
           |
           | 1 : N
           ↓
+----------------------+
|        STORY         |
+----------------------+
| id                   |
| project_id           |
| title                |
| description          |
| status               |
| priority             |
| created_at           |
| updated_at           |
+----------+-----------+
           |
           | 1 : N
           ↓
+----------------------+
|        TASK          |
+----------------------+
| id                   |
| user_story_id        |
| title                |
| description          |
| status               |
| priority             |
| assigned_to          |
| due_date             |
| created_at           |
| updated_at           |
+----------+-----------+
           |
           | 1 : N
           ↓
+----------------------+
|    NOTIFICATION      |
+----------------------+
| id                   |
| task_id              |
| message              |
| type                 |
| created_at           |
| read_at              |
+----------------------+
```

---

## 2. Projects

The `projects` table stores the main details of each project.

Each project has a unique `id` and a required `name`. A project can also have a description that explains its purpose or scope.

The `status` field represents the current stage of the project.

Possible project statuses are:

```text
PLANNING
ACTIVE
COMPLETED
ARCHIVED
```

The table also stores `created_at` and `updated_at` timestamps to keep track of when the project was created and last modified.

---

## 3. User Stories

The `stories` table stores user stories that belong to a project.

Every story contains a `project_id`, which connects it to the parent project.

A story contains:

* A title
* A description
* A status
* A priority
* Creation and update timestamps

The available story statuses are:

```text
BACKLOG
TODO
IN_PROGRESS
DONE
```

The priority can be:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The relationship is:

```text
One Project
     |
     +---- Story 1
     +---- Story 2
     +---- Story 3
```

This allows a single project to contain any number of user stories.

---

## 4. Tasks

The `tasks` table stores the actual work that needs to be completed.

Every task belongs to a user story through the `user_story_id` field.

A task contains:

* Title
* Description
* Status
* Priority
* Assigned person
* Due date
* Creation time
* Last update time

The available task statuses are:

```text
TODO
IN_PROGRESS
DONE
```

Task priority can be:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The `assigned_to` field stores the person responsible for completing the task.

The `due_date` field is especially important because the background worker uses it to identify tasks that are approaching their deadline or have already become overdue.

The relationship looks like:

```text
User Story
     |
     +---- Task 1
     +---- Task 2
     +---- Task 3
```

---

## 5. Notifications

The `notifications` table stores alerts related to tasks.

Notifications are generated automatically by the background monitoring system.

There are two main notification types:

```text
DUE_SOON
OVERDUE
```

A `DUE_SOON` notification is created when a task is approaching its deadline.

An `OVERDUE` notification is created when a task has passed its deadline and is still not completed.

Each notification contains:

* The related task ID
* Notification message
* Notification type
* Creation timestamp
* Read timestamp

The `read_at` field remains empty until the notification is marked as read.

---

## 6. Relationship Between Tables

The database follows a clear parent-child structure.

### Project → User Story

One project can contain multiple user stories.

```text
Project
   |
   +---- User Story
   +---- User Story
   +---- User Story
```

The connection is maintained using `project_id`.

### User Story → Task

One user story can contain multiple tasks.

```text
User Story
   |
   +---- Task
   +---- Task
   +---- Task
```

The connection is maintained using `user_story_id`.

### Task → Notification

One task can have multiple notifications.

```text
Task
   |
   +---- DUE_SOON
   +---- OVERDUE
```

The connection is maintained using `task_id`.

---

## 7. Cascade Delete

The database uses `ON DELETE CASCADE` for the relationships.

This means that when a parent record is deleted, its related records are automatically removed.

For example, deleting a project will remove everything under that project:

```text
Delete Project
      ↓
Delete User Stories
      ↓
Delete Tasks
      ↓
Delete Notifications
```

Similarly:

```text
Delete User Story
      ↓
Delete Tasks
      ↓
Delete Notifications
```

And:

```text
Delete Task
      ↓
Delete Notifications
```

This keeps the database clean and prevents orphaned records.

---

## 8. SQLite Foreign Key Enforcement

SQLite does not enable foreign key enforcement by default in every connection.

To make sure that the relationships defined in the database are always enforced, the application explicitly enables foreign keys whenever a new database connection is created.

The application uses SQLAlchemy's connection event:

```python
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

This ensures that:

* Invalid foreign key references are prevented.
* Parent-child relationships are maintained.
* Cascade deletion works correctly.
* Orphaned records are avoided.

---

## 9. Complete Database Flow

The complete database structure can be understood as:

```text
                    PROJECT
                       |
                       | 1 : N
                       ↓
                  USER STORY
                       |
                       | 1 : N
                       ↓
                     TASK
                       |
                       | 1 : N
                       ↓
                 NOTIFICATION
```

This structure matches the way the Agile Project Management Tool works in practice.

A **Project** contains multiple **User Stories**, each User Story contains multiple **Tasks**, and Tasks can generate **Notifications** when deadlines are approaching or have been missed.

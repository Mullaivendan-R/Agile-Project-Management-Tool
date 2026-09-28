# REST API Documentation

The Agile Project Management API is hosted by default at `http://localhost:8000/api`. Interactive OpenAPI / Swagger UI is available at `/docs` and ReDoc is available at `/redoc`.

---

## 1. Project Endpoints

### 1.1 Create Project
- **Method / Endpoint**: `POST /api/projects`
- **Purpose**: Creates a new project in the system.
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Cloud Native Platform",
  "description": "Migration to containerized microservices",
  "status": "PLANNING"
}
```
- **Response**: `201 Created`
```json
{
  "id": 1,
  "name": "Cloud Native Platform",
  "description": "Migration to containerized microservices",
  "status": "PLANNING",
  "created_at": "2026-09-28T07:00:00Z",
  "updated_at": "2026-09-28T07:00:00Z"
}
```
- **Possible Errors**:
  - `422 Unprocessable Content`: If name is empty or status is invalid.

---

### 1.2 Get All Projects
- **Method / Endpoint**: `GET /api/projects`
- **Query Parameters**:
  - `skip` (optional, integer, default: `0`)
  - `limit` (optional, integer, default: `100`)
- **Response**: `200 OK` (Array of Project objects ordered by creation date descending)

---

### 1.3 Get Single Project
- **Method / Endpoint**: `GET /api/projects/{project_id}`
- **Path Parameters**: `project_id` (integer, required)
- **Response**: `200 OK` (Project object)
- **Possible Errors**:
  - `404 Not Found`: Project with given ID does not exist.

---

### 1.4 Update Project
- **Method / Endpoint**: `PUT /api/projects/{project_id}`
- **Path Parameters**: `project_id` (integer, required)
- **Request Body**:
```json
{
  "name": "Cloud Native Platform v2",
  "status": "ACTIVE"
}
```
- **Response**: `200 OK` (Updated Project object)
- **Possible Errors**:
  - `404 Not Found`: Project with given ID does not exist.
  - `422 Unprocessable Content`: Invalid field format.

---

### 1.5 Delete Project
- **Method / Endpoint**: `DELETE /api/projects/{project_id}`
- **Path Parameters**: `project_id` (integer, required)
- **Response**: `204 No Content`
- **Cascade Behavior**: Deleting a project cascades to all child User Stories, Tasks, and Notifications.
- **Possible Errors**:
  - `404 Not Found`: Project not found.

---

### 1.6 Get Project Hierarchy
- **Method / Endpoint**: `GET /api/projects/{project_id}/hierarchy`
- **Purpose**: Returns the full hierarchical tree: `Project -> User Stories -> Tasks` in a single query.
- **Path Parameters**: `project_id` (integer, required)
- **Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Website Development",
  "description": "Redesign corporate website",
  "status": "ACTIVE",
  "created_at": "2026-09-28T07:00:00Z",
  "updated_at": "2026-09-28T07:00:00Z",
  "stories": [
    {
      "id": 1,
      "project_id": 1,
      "title": "User Authentication",
      "description": "Secure login via OAuth/JWT",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "created_at": "2026-09-28T07:05:00Z",
      "updated_at": "2026-09-28T07:05:00Z",
      "tasks": [
        {
          "id": 1,
          "user_story_id": 1,
          "title": "Create Login UI",
          "description": "React form with validation",
          "status": "DONE",
          "priority": "HIGH",
          "assigned_to": "Alice",
          "due_date": "2026-09-27T18:00:00Z",
          "created_at": "2026-09-28T07:10:00Z",
          "updated_at": "2026-09-28T07:10:00Z"
        }
      ]
    }
  ]
}
```
- **Possible Errors**:
  - `404 Not Found`: Project with given ID does not exist.

---

## 2. User Story Endpoints

### 2.1 Create Story Under Project
- **Method / Endpoint**: `POST /api/projects/{project_id}/stories`
- **Path Parameters**: `project_id` (integer, required)
- **Request Body**:
```json
{
  "title": "User Profile Management",
  "description": "Allow users to upload an avatar and update biographical data",
  "status": "TODO",
  "priority": "HIGH"
}
```
- **Response**: `201 Created`
- **Possible Errors**:
  - `404 Not Found`: Parent project does not exist.
  - `422 Unprocessable Content`: Empty title or invalid enum value.

---

### 2.2 Get Stories for Project
- **Method / Endpoint**: `GET /api/projects/{project_id}/stories`
- **Path Parameters**: `project_id` (integer, required)
- **Response**: `200 OK` (Array of Story objects)
- **Possible Errors**:
  - `404 Not Found`: Parent project does not exist.

---

### 2.3 Get Single Story
- **Method / Endpoint**: `GET /api/stories/{story_id}`
- **Path Parameters**: `story_id` (integer, required)
- **Response**: `200 OK`
- **Possible Errors**: `404 Not Found`

---

### 2.4 Update Story
- **Method / Endpoint**: `PUT /api/stories/{story_id}`
- **Path Parameters**: `story_id` (integer, required)
- **Request Body**: Fields to update (`title`, `description`, `status`, `priority`)
- **Response**: `200 OK`
- **Possible Errors**: `404 Not Found`, `422 Unprocessable Content`

---

### 2.5 Delete Story
- **Method / Endpoint**: `DELETE /api/stories/{story_id}`
- **Path Parameters**: `story_id` (integer, required)
- **Response**: `204 No Content`
- **Cascade Behavior**: Deletes all child Tasks and their Notifications.
- **Possible Errors**: `404 Not Found`

---

## 3. Task Endpoints

### 3.1 Create Task Under Story
- **Method / Endpoint**: `POST /api/stories/{story_id}/tasks`
- **Path Parameters**: `story_id` (integer, required)
- **Request Body**:
```json
{
  "title": "Build Avatar Upload API",
  "description": "Store uploaded file in object storage and persist URL",
  "status": "TODO",
  "priority": "MEDIUM",
  "assigned_to": "engineer@example.com",
  "due_date": "2026-10-02T12:00:00Z"
}
```
- **Response**: `201 Created`
- **Possible Errors**:
  - `404 Not Found`: Parent user story does not exist.
  - `422 Unprocessable Content`: Empty title or invalid format.

---

### 3.2 Get Tasks for Story
- **Method / Endpoint**: `GET /api/stories/{story_id}/tasks`
- **Path Parameters**: `story_id` (integer, required)
- **Response**: `200 OK` (Array of Task objects)
- **Possible Errors**: `404 Not Found`

---

### 3.3 Get Single Task
- **Method / Endpoint**: `GET /api/tasks/{task_id}`
- **Path Parameters**: `task_id` (integer, required)
- **Response**: `200 OK`
- **Possible Errors**: `404 Not Found`

---

### 3.4 Update Task
- **Method / Endpoint**: `PUT /api/tasks/{task_id}`
- **Path Parameters**: `task_id` (integer, required)
- **Request Body**: Fields to update (`title`, `description`, `status`, `priority`, `assigned_to`, `due_date`)
- **Response**: `200 OK`
- **Possible Errors**: `404 Not Found`, `422 Unprocessable Content`

---

### 3.5 Delete Task
- **Method / Endpoint**: `DELETE /api/tasks/{task_id}`
- **Path Parameters**: `task_id` (integer, required)
- **Response**: `204 No Content`
- **Cascade Behavior**: Deletes any associated deadline notifications.
- **Possible Errors**: `404 Not Found`

---

## 4. Notification & Background Worker Endpoints

### 4.1 Get Notifications
- **Method / Endpoint**: `GET /api/notifications`
- **Query Parameters**:
  - `unread_only` (optional, boolean, default: `false`)
  - `limit` (optional, integer, default: `50`)
- **Response**: `200 OK` (Array of Notification objects)

---

### 4.2 Mark Notification as Read
- **Method / Endpoint**: `PATCH /api/notifications/{notification_id}/read`
- **Path Parameters**: `notification_id` (integer, required)
- **Response**: `200 OK` (Updated Notification object with `read_at` timestamp)
- **Possible Errors**: `404 Not Found`

---

### 4.3 Mark All Notifications as Read
- **Method / Endpoint**: `POST /api/notifications/read-all`
- **Response**: `200 OK` (`{"marked_read": 3}`)

---

### 4.4 Trigger Background Worker Cycle (On Demand)
- **Method / Endpoint**: `POST /api/notifications/run-worker`
- **Purpose**: Immediately triggers the background task deadline monitor scan cycle.
- **Response**: `200 OK`
```json
{
  "checked_tasks": 5,
  "notifications_created": 1,
  "message": "Checked 5 tasks, generated 1 new notifications."
}
```

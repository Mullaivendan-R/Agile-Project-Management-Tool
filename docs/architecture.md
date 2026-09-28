# Agile Project Management Tool

## System Architecture

The **Agile Project Management Tool** is designed using a simple and scalable client-server architecture. The application has a React-based frontend and a FastAPI backend, with SQLite used for data storage.

The frontend provides an interactive interface where users can manage projects, user stories, tasks, and notifications. The backend handles the application logic, API requests, database operations, and deadline monitoring.

A separate background worker continuously checks task deadlines and creates notifications when tasks are approaching their due date or have become overdue.

---

## 1. System Overview

The application is divided into four main parts:

* **Frontend** – React, TypeScript, Tailwind CSS and Lucide Icons
* **Backend** – FastAPI with Python
* **Database** – SQLite with SQLAlchemy ORM
* **Background Worker** – Monitors task deadlines and creates notifications

### Basic System Flow

```text
User
  |
  v
React Frontend
  |
  | HTTP / JSON
  v
FastAPI Backend
  |
  +--> API Routers
  |
  +--> Business Services
  |
  +--> SQLAlchemy ORM
  |
  v
SQLite Database
  |
  +--> Projects
  +--> Stories
  +--> Tasks
  +--> Notifications

Background Worker
  |
  +--> Checks task deadlines
  +--> Finds overdue / upcoming tasks
  +--> Creates notifications
```

---

## 2. Frontend Architecture

The frontend is developed as a **React Single Page Application (SPA)** using TypeScript and Tailwind CSS.

The main goal of the frontend is to provide users with an easy way to view and manage their projects and tasks.

### Main Pages

#### Dashboard

The dashboard provides an overview of the project activities. It displays:

* Project statistics
* Task completion rates
* Overdue tasks
* Recent projects
* Notifications and alerts

#### Projects Page

The projects page allows users to:

* View all projects
* Search for projects
* Filter projects
* Create and delete projects
* Confirm before deleting a project

#### Project Details Page

The project details page is the main workspace of the application.

It supports two different views:

**1. Hierarchical View**

Users can manage the project structure in the following order:

```text
Project
   |
   +-- User Story
          |
          +-- Task
```

Users can expand and collapse sections, update task statuses, and perform CRUD operations.

**2. Kanban Board**

The Kanban board provides a visual way to track task progress.

```text
TODO  →  IN_PROGRESS  →  DONE
```

This makes it easier for users to understand the current status of their work.

---

## 3. Frontend Services

The frontend uses a separate service layer for communicating with the backend.

Instead of making API calls directly from UI components, the application keeps API-related code inside dedicated service files.

### Main Services

* `api.ts` – Handles common HTTP requests and errors
* `projectService.ts` – Handles project-related APIs
* `storyService.ts` – Handles user story APIs
* `taskService.ts` – Handles task APIs
* `notificationService.ts` – Handles notification APIs

This structure keeps the frontend code organized and makes it easier to maintain and update.

TypeScript interfaces are also used to make sure that the data received from the backend follows the expected structure.

---

## 4. Backend Architecture

The backend is developed using **FastAPI and Python 3.12**. It provides REST APIs that are consumed by the React frontend.

The backend follows a layered architecture so that API handling, business logic, and database operations remain separated.

### API Routers

The routers are responsible for handling HTTP requests and responses.

The main API endpoints include:

```text
/api/projects
/api/stories
/api/tasks
/api/notifications
```

The routers validate incoming data, return appropriate HTTP status codes, and pass the actual business logic to the service layer.

Common responses include:

* `200` – Successful request
* `201` – Resource created
* `204` – Successful request with no response body
* `404` – Resource not found
* `422` – Invalid request data
* `500` – Internal server error

---

## 5. Service Layer

The service layer contains the main business logic of the application.

For example, before creating a user story, the backend checks whether the related project actually exists.

The service layer is also responsible for:

* Database transactions
* Checking project and story relationships
* Fetching related data
* Managing queries
* Handling database operations
* Improving database queries through eager loading where required

This keeps the API routers simple and easier to maintain.

---

## 6. Database Architecture

The application uses **SQLite** as its database and **SQLAlchemy 2.0** as the ORM.

The main tables are:

```text
Projects
   |
   +-- Stories
          |
          +-- Tasks

Notifications
```

SQLAlchemy models define the database tables, relationships, constraints, and foreign keys.

Foreign key relationships use **cascade delete** where required. This means that when a parent record is removed, its related child records can also be removed automatically.

For example:

```text
Project Deleted
      |
      +-- Stories Deleted
              |
              +-- Tasks Deleted
```

This helps maintain database consistency.

---

## 7. Data Validation

The backend uses **Pydantic schemas** to validate incoming and outgoing data.

The schemas are responsible for:

* Checking request data
* Validating required fields
* Setting default values
* Checking string lengths
* Validating status values
* Converting database objects into API responses

This prevents invalid data from entering the application.

---

# 8. Background Task Monitoring

One of the important features of the application is its background task monitoring system.

The system automatically checks task deadlines without requiring the user to manually refresh or check every task.

The background worker runs separately from normal API requests.

### How It Works

Every **60 seconds**, the worker performs the following steps:

```text
1. Wake up
      ↓
2. Check pending tasks
      ↓
3. Find tasks with due dates
      ↓
4. Check whether a notification already exists
      ↓
5. Create OVERDUE or DUE_SOON notification
      ↓
6. Wait for the next cycle
```

The worker only checks tasks that:

* Are not marked as `DONE`
* Have a valid due date

---

## 9. Notifications

The system can generate two types of deadline notifications:

### DUE_SOON

Created when a task is approaching its deadline.

### OVERDUE

Created when a task has passed its deadline and is still not completed.

The system also performs a duplicate check before creating a notification. This prevents the same alert from being generated repeatedly for the same task.

---

## 10. Worker Reliability

The background worker is designed to continue working even when temporary database problems occur.

### Database Session Management

Each monitoring cycle creates its own database session and closes it after the operation is completed.

This helps prevent:

* Connection leaks
* Database session conflicts
* Unnecessary resource usage

### Retry Mechanism

If a database error occurs, the worker does not immediately stop.

It retries the operation up to **3 times**, using an exponential backoff between attempts.

If all attempts fail, the error is logged and the worker waits until the next scheduled monitoring cycle.

---

## 11. Application Startup and Shutdown

The background worker is started together with the FastAPI application using FastAPI's **lifespan mechanism**.

The worker runs without blocking normal API requests.

When the application is stopped, the worker is also stopped gracefully by cancelling any pending background tasks.

This helps ensure that the application shuts down cleanly without leaving unfinished worker processes.

---

## 12. Overall Architecture

The complete application can be summarized as:

```text
                    USER
                      |
                      v
            +-------------------+
            |   React Frontend  |
            | TypeScript + CSS  |
            +---------+---------+
                      |
                 HTTP / JSON
                      |
                      v
            +-------------------+
            |    FastAPI API    |
            +---------+---------+
                      |
                      v
            +-------------------+
            |  Service Layer    |
            | Business Logic    |
            +---------+---------+
                      |
                      v
            +-------------------+
            | SQLAlchemy ORM    |
            +---------+---------+
                      |
                      v
            +-------------------+
            |   SQLite Database |
            +-------------------+

                      ^
                      |
            +---------+---------+
            | Background Worker |
            | Deadline Monitor  |
            +-------------------+
```

Overall, this architecture keeps the frontend, backend, database, and background processing responsibilities separate. This makes the application easier to understand, maintain, and extend with additional features in the future.

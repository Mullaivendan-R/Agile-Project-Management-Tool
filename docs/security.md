# Security Considerations & Hardening

This document outlines the security architecture, threat model mitigation, and defensive coding practices implemented in the Agile Project Management Tool.

---

## 1. Input Validation and Type Safety

### 1.1 Strict Pydantic Schema Enforcement
- Every request payload passing through the API is validated by Pydantic models prior to reaching the service layer.
- Field constraints include:
  - String length bounds (`min_length=1`, `max_length=255`) preventing buffer or denial-of-service storage attempts.
  - Strict enum validation for statuses (`ProjectStatus`, `StoryStatus`, `TaskStatus`) and `Priority` levels.
  - Type coercion checks for dates and numeric identifiers.
- Malformed or malicious requests are rejected immediately at the boundary with an HTTP `422 Unprocessable Content` status without touching business logic or the database.

---

## 2. SQL Injection Prevention

### 2.1 Parameterized ORM Operations
- All database interactions are executed via SQLAlchemy 2.0 object-relational mapping (ORM) and parameterized queries.
- Raw SQL strings and string concatenation are strictly prohibited across the entire codebase.
- User input is bound as parameterized arguments, ensuring SQLite treats all client inputs strictly as data, never as executable SQL instructions.

---

## 3. Information Disclosure & Exception Sanitization

### 3.1 Traceback Masking
- In production environments, database error traces or stack traces can leak schema details, file paths, and internal libraries to attackers.
- Global exception handlers are implemented in `backend/app/main.py`:
  - `RequestValidationError`: Formats validation errors into concise, safe field-level messages.
  - Generic `Exception`: Catches all unexpected server errors, logs the full exception and traceback to server-side logs securely, and returns a sanitized JSON response:
    ```json
    {
      "error": "Internal Server Error",
      "message": "An unexpected server error occurred. Please try again later."
    }
    ```

---

## 4. Cross-Origin Resource Sharing (CORS)

- CORS is explicitly configured via FastAPI's `CORSMiddleware`.
- Rather than a blanket wildcard (`*`) in production, the allowed origins are configurable via environment variables (`CORS_ORIGINS`).
- Default development hosts include `http://localhost:5173` and `http://127.0.0.1:5173` to prevent unauthorized cross-origin script executions from untrusted domains.

---

## 5. Secrets and Configuration Management

- Zero secrets, keys, or passwords are hardcoded in the codebase.
- Configuration is loaded via `pydantic-settings` from environment variables and `.env` files.
- `.env.example` is committed with safe, documentation-friendly defaults.
- The real `.env` file and SQLite database files (`*.db`, `*.sqlite`) are strictly blacklisted in `.gitignore`.

---

## 6. Relational Integrity & Data Protection

- SQLite foreign key pragma (`PRAGMA foreign_keys = ON;`) ensures that database operations cannot produce orphaned records or corrupt relational state.
- Cascading deletes are enforced at the database schema level (`ON DELETE CASCADE`), ensuring child entities are cleanly purged when parents are deleted.
- Destructive operations in the frontend are guarded by two-factor visual confirmation dialogs specifying cascading implications.

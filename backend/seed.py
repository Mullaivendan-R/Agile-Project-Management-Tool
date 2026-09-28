import os
import sys
from datetime import datetime, timezone, timedelta

# Add workspace root to sys.path so backend imports work
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.enums import ProjectStatus, StoryStatus, TaskStatus, Priority
from backend.app.models.project import Project
from backend.app.models.story import Story
from backend.app.models.task import Task
from backend.app.services.notification_service import NotificationService


def seed_database():
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if demo project already exists
        existing = db.query(Project).filter(Project.name == "AgileFlow Development").first()
        if existing:
            print("Demo data already seeded. Skipping.")
            return

        print("Seeding demo data...")
        now = datetime.now(timezone.utc)

        # 1. Project: AgileFlow Development
        project = Project(
            name="AgileFlow Development",
            description="Core agile project management web application for cross-functional engineering teams.",
            status=ProjectStatus.ACTIVE,
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # 2. Stories under AgileFlow Development
        story1 = Story(
            project_id=project.id,
            title="User Authentication & Session Management",
            description="As a team member, I want to securely log in and maintain my session.",
            status=StoryStatus.DONE,
            priority=Priority.HIGH,
        )
        story2 = Story(
            project_id=project.id,
            title="Project Dashboard & Analytics",
            description="As a project manager, I want a high-level view of sprint metrics and pending tasks.",
            status=StoryStatus.IN_PROGRESS,
            priority=Priority.CRITICAL,
        )
        story3 = Story(
            project_id=project.id,
            title="Task Management & Board",
            description="As a developer, I want to create, assign, and update task statuses on an interactive board.",
            status=StoryStatus.TODO,
            priority=Priority.MEDIUM,
        )
        db.add_all([story1, story2, story3])
        db.commit()
        db.refresh(story1)
        db.refresh(story2)
        db.refresh(story3)

        # 3. Tasks under Story 1 (Authentication)
        task1_1 = Task(
            user_story_id=story1.id,
            title="Design JWT token authentication flow",
            description="Specify token expiration, refresh mechanism, and claims schema.",
            status=TaskStatus.DONE,
            priority=Priority.HIGH,
            assigned_to="Alice Johnson",
            due_date=now - timedelta(days=5),
        )
        task1_2 = Task(
            user_story_id=story1.id,
            title="Implement password hashing and security tests",
            description="Use bcrypt for password hashing with appropriate work factor.",
            status=TaskStatus.DONE,
            priority=Priority.HIGH,
            assigned_to="Bob Smith",
            due_date=now - timedelta(days=3),
        )

        # 4. Tasks under Story 2 (Dashboard)
        task2_1 = Task(
            user_story_id=story2.id,
            title="Aggregate project completion metrics API",
            description="Query project statistics including total stories, done tasks, and velocity.",
            status=TaskStatus.IN_PROGRESS,
            priority=Priority.CRITICAL,
            assigned_to="Alice Johnson",
            due_date=now - timedelta(hours=6),  # OVERDUE task!
        )
        task2_2 = Task(
            user_story_id=story2.id,
            title="Build Dashboard UI widgets and charts",
            description="Render summary cards, status badges, and interactive progress bars.",
            status=TaskStatus.IN_PROGRESS,
            priority=Priority.HIGH,
            assigned_to="Charlie Brown",
            due_date=now + timedelta(hours=12),  # DUE SOON task!
        )

        # 5. Tasks under Story 3 (Task Board)
        task3_1 = Task(
            user_story_id=story3.id,
            title="Create Task CRUD endpoints with validations",
            description="Ensure story existence checks and Pydantic validation.",
            status=TaskStatus.TODO,
            priority=Priority.MEDIUM,
            assigned_to="Diana Prince",
            due_date=now + timedelta(days=3),  # Future task
        )
        task3_2 = Task(
            user_story_id=story3.id,
            title="Build Drag-and-Drop or Dropdown Status transitions",
            description="Implement status update triggers on the frontend UI.",
            status=TaskStatus.TODO,
            priority=Priority.LOW,
            assigned_to="Bob Smith",
            due_date=now + timedelta(days=5),  # Future task
        )

        db.add_all([task1_1, task1_2, task2_1, task2_2, task3_1, task3_2])
        db.commit()

        # Seed another Project in PLANNING status to demonstrate multiple projects
        project2 = Project(
            name="Mobile Companion App",
            description="React Native companion application for offline task updates.",
            status=ProjectStatus.PLANNING,
        )
        db.add(project2)
        db.commit()
        db.refresh(project2)

        story_m1 = Story(
            project_id=project2.id,
            title="Architect offline-first SQLite sync engine",
            description="Evaluate CRDTs or timestamp-based last-write-wins replication.",
            status=StoryStatus.BACKLOG,
            priority=Priority.HIGH,
        )
        db.add(story_m1)
        db.commit()

        print("Database seeded successfully with demo projects, stories, and tasks!")

        # Run background notification check to create initial notifications for overdue / due soon demo tasks
        checked, created = NotificationService.check_and_create_notifications(db)
        print(f"Initial notification scan complete: {checked} tasks checked, {created} notifications created.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

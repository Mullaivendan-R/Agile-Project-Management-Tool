from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.story import Story
from backend.app.models.task import Task
from backend.app.schemas.task import TaskCreate, TaskUpdate


class TaskService:
    @staticmethod
    def get_by_story(db: Session, story_id: int) -> Optional[List[Task]]:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            return None
        return db.query(Task).filter(Task.user_story_id == story_id).order_by(Task.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create(db: Session, story_id: int, task_in: TaskCreate) -> Optional[Task]:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            return None

        db_task = Task(
            user_story_id=story_id,
            title=task_in.title,
            description=task_in.description,
            status=task_in.status,
            priority=task_in.priority,
            assigned_to=task_in.assigned_to,
            due_date=task_in.due_date,
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def update(db: Session, task_id: int, task_in: TaskUpdate) -> Optional[Task]:
        db_task = db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            return None

        update_data = task_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)

        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def delete(db: Session, task_id: int) -> bool:
        db_task = db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            return False

        db.delete(db_task)
        db.commit()
        return True

from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.project import Project
from backend.app.models.story import Story
from backend.app.schemas.story import StoryCreate, StoryUpdate


class StoryService:
    @staticmethod
    def get_by_project(db: Session, project_id: int) -> Optional[List[Story]]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
        return db.query(Story).filter(Story.project_id == project_id).order_by(Story.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, story_id: int) -> Optional[Story]:
        return db.query(Story).filter(Story.id == story_id).first()

    @staticmethod
    def create(db: Session, project_id: int, story_in: StoryCreate) -> Optional[Story]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        db_story = Story(
            project_id=project_id,
            title=story_in.title,
            description=story_in.description,
            status=story_in.status,
            priority=story_in.priority,
        )
        db.add(db_story)
        db.commit()
        db.refresh(db_story)
        return db_story

    @staticmethod
    def update(db: Session, story_id: int, story_in: StoryUpdate) -> Optional[Story]:
        db_story = db.query(Story).filter(Story.id == story_id).first()
        if not db_story:
            return None

        update_data = story_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_story, field, value)

        db.commit()
        db.refresh(db_story)
        return db_story

    @staticmethod
    def delete(db: Session, story_id: int) -> bool:
        db_story = db.query(Story).filter(Story.id == story_id).first()
        if not db_story:
            return False

        db.delete(db_story)
        db.commit()
        return True

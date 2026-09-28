from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from backend.app.models.project import Project
from backend.app.models.story import Story
from backend.app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Project]:
        return db.query(Project).order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def create(db: Session, project_in: ProjectCreate) -> Project:
        db_project = Project(
            name=project_in.name,
            description=project_in.description,
            status=project_in.status,
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def update(db: Session, project_id: int, project_in: ProjectUpdate) -> Optional[Project]:
        db_project = db.query(Project).filter(Project.id == project_id).first()
        if not db_project:
            return None

        update_data = project_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)

        db.commit()
        db.refresh(db_project)
        return db_project

    @staticmethod
    def delete(db: Session, project_id: int) -> bool:
        db_project = db.query(Project).filter(Project.id == project_id).first()
        if not db_project:
            return False

        db.delete(db_project)
        db.commit()
        return True

    @staticmethod
    def get_hierarchy(db: Session, project_id: int) -> Optional[Project]:
        # Eager load stories and their tasks in a single optimized query
        return (
            db.query(Project)
            .options(
                selectinload(Project.stories).selectinload(Story.tasks)
            )
            .filter(Project.id == project_id)
            .first()
        )

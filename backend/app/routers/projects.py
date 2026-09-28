from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from backend.app.schemas.story import StoryCreate, StoryResponse
from backend.app.schemas.hierarchy import ProjectHierarchyResponse
from backend.app.services.project_service import ProjectService
from backend.app.services.story_service import StoryService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    return ProjectService.create(db=db, project_in=project_in)


@router.get("", response_model=List[ProjectResponse])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all projects ordered by newest first."""
    return ProjectService.get_all(db=db, skip=skip, limit=limit)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Retrieve a single project by ID."""
    project = ProjectService.get_by_id(db=db, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    """Update project details or status."""
    project = ProjectService.update(db=db, project_id=project_id, project_in=project_in)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project and cascade-delete its user stories and tasks."""
    success = ProjectService.delete(db=db, project_id=project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return None


@router.get("/{project_id}/hierarchy", response_model=ProjectHierarchyResponse)
def get_project_hierarchy(project_id: int, db: Session = Depends(get_db)):
    """Retrieve the complete project hierarchy (Project -> User Stories -> Tasks)."""
    project = ProjectService.get_hierarchy(db=db, project_id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return project


@router.post("/{project_id}/stories", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
def create_story_for_project(project_id: int, story_in: StoryCreate, db: Session = Depends(get_db)):
    """Create a new user story associated with the given project."""
    story = StoryService.create(db=db, project_id=project_id, story_in=story_in)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return story


@router.get("/{project_id}/stories", response_model=List[StoryResponse])
def get_stories_for_project(project_id: int, db: Session = Depends(get_db)):
    """Retrieve all user stories belonging to a project."""
    stories = StoryService.get_by_project(db=db, project_id=project_id)
    if stories is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )
    return stories

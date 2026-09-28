from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.story import StoryUpdate, StoryResponse
from backend.app.schemas.task import TaskCreate, TaskResponse
from backend.app.services.story_service import StoryService
from backend.app.services.task_service import TaskService

router = APIRouter(prefix="/stories", tags=["User Stories"])


@router.get("/{story_id}", response_model=StoryResponse)
def get_story(story_id: int, db: Session = Depends(get_db)):
    """Retrieve a single user story by ID."""
    story = StoryService.get_by_id(db=db, story_id=story_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Story with ID {story_id} not found",
        )
    return story


@router.put("/{story_id}", response_model=StoryResponse)
def update_story(story_id: int, story_in: StoryUpdate, db: Session = Depends(get_db)):
    """Update user story details, priority, or status."""
    story = StoryService.update(db=db, story_id=story_id, story_in=story_in)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Story with ID {story_id} not found",
        )
    return story


@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(story_id: int, db: Session = Depends(get_db)):
    """Delete a user story and cascade-delete its child tasks."""
    success = StoryService.delete(db=db, story_id=story_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Story with ID {story_id} not found",
        )
    return None


@router.post("/{story_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task_for_story(story_id: int, task_in: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task associated with the given user story."""
    task = TaskService.create(db=db, story_id=story_id, task_in=task_in)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Story with ID {story_id} not found",
        )
    return task


@router.get("/{story_id}/tasks", response_model=List[TaskResponse])
def get_tasks_for_story(story_id: int, db: Session = Depends(get_db)):
    """Retrieve all tasks belonging to a user story."""
    tasks = TaskService.get_by_story(db=db, story_id=story_id)
    if tasks is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Story with ID {story_id} not found",
        )
    return tasks

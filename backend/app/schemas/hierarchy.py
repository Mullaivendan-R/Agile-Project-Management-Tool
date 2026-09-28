from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import ProjectStatus, StoryStatus, TaskStatus, Priority


class HierarchyTaskResponse(BaseModel):
    id: int
    user_story_id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: Priority
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HierarchyStoryResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: StoryStatus
    priority: Priority
    created_at: datetime
    updated_at: datetime
    tasks: List[HierarchyTaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProjectHierarchyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    stories: List[HierarchyStoryResponse] = []

    model_config = ConfigDict(from_attributes=True)

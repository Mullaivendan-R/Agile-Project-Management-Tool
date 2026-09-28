from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import TaskStatus, Priority


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, description="Task details and instructions")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: Priority = Field(default=Priority.MEDIUM, description="Task priority")
    assigned_to: Optional[str] = Field(None, max_length=255, description="Assignee name or email")
    due_date: Optional[datetime] = Field(None, description="Task due date in ISO format")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, description="Task details and instructions")
    status: Optional[TaskStatus] = Field(None, description="Task status")
    priority: Optional[Priority] = Field(None, description="Task priority")
    assigned_to: Optional[str] = Field(None, max_length=255, description="Assignee name or email")
    due_date: Optional[datetime] = Field(None, description="Task due date in ISO format")


class TaskResponse(TaskBase):
    id: int
    user_story_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

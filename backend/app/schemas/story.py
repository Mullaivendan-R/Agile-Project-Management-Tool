from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import StoryStatus, Priority


class StoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Story title")
    description: Optional[str] = Field(None, description="Detailed story acceptance criteria / description")
    status: StoryStatus = Field(default=StoryStatus.BACKLOG, description="Story status")
    priority: Priority = Field(default=Priority.MEDIUM, description="Story priority")


class StoryCreate(StoryBase):
    pass


class StoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Story title")
    description: Optional[str] = Field(None, description="Detailed story acceptance criteria / description")
    status: Optional[StoryStatus] = Field(None, description="Story status")
    priority: Optional[Priority] = Field(None, description="Story priority")


class StoryResponse(StoryBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

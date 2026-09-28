from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.models.enums import NotificationType


class NotificationResponse(BaseModel):
    id: int
    task_id: int
    message: str
    type: NotificationType
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationReadUpdate(BaseModel):
    read: bool = True


class WorkerRunSummary(BaseModel):
    checked_tasks: int
    notifications_created: int
    message: str

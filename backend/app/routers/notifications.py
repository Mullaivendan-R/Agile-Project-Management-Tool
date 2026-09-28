from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.notification import NotificationResponse, WorkerRunSummary
from backend.app.services.notification_service import NotificationService
from backend.app.workers.task_monitor import task_monitor

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_notifications(unread_only: bool = False, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve notifications (due-soon and overdue tasks alerts)."""
    return NotificationService.get_all(db=db, unread_only=unread_only, limit=limit)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a notification as read."""
    notification = NotificationService.mark_as_read(db=db, notification_id=notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found",
        )
    return notification


@router.post("/read-all", response_model=dict)
def mark_all_notifications_as_read(db: Session = Depends(get_db)):
    """Mark all unread notifications as read."""
    count = NotificationService.mark_all_as_read(db=db)
    return {"marked_read": count}


@router.post("/run-worker", response_model=WorkerRunSummary)
def trigger_worker_check():
    """Manually invoke a background task monitor cycle on demand."""
    checked, created = task_monitor.run_check_cycle()
    return WorkerRunSummary(
        checked_tasks=checked,
        notifications_created=created,
        message=f"Checked {checked} tasks, generated {created} new notifications.",
    )

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.enums import TaskStatus, NotificationType
from backend.app.models.task import Task
from backend.app.models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def get_all(db: Session, unread_only: bool = False, limit: int = 50) -> List[Notification]:
        query = db.query(Notification)
        if unread_only:
            query = query.filter(Notification.read_at.is_(None))
        return query.order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int) -> Optional[Notification]:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            return None
        if not notification.read_at:
            notification.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session) -> int:
        now = datetime.now(timezone.utc)
        count = (
            db.query(Notification)
            .filter(Notification.read_at.is_(None))
            .update({"read_at": now}, synchronize_session="fetch")
        )
        db.commit()
        return count

    @staticmethod
    def check_and_create_notifications(db: Session, due_soon_hours: int = 24) -> Tuple[int, int]:
        """
        Scans pending tasks (status != DONE) with due dates.
        Identifies OVERDUE and DUE_SOON tasks.
        Inserts notifications while preventing duplicates.
        Returns: (checked_count, created_count)
        """
        now = datetime.now(timezone.utc)
        due_soon_threshold = now + timedelta(hours=due_soon_hours)

        # Query pending tasks with a due date
        pending_tasks = (
            db.query(Task)
            .filter(Task.status != TaskStatus.DONE, Task.due_date.isnot(None))
            .all()
        )

        checked_count = len(pending_tasks)
        created_count = 0

        for task in pending_tasks:
            # Normalize task due_date timezone if naive
            task_due = task.due_date
            if task_due.tzinfo is None:
                task_due = task_due.replace(tzinfo=timezone.utc)

            notification_type: Optional[NotificationType] = None
            message: str = ""

            if task_due < now:
                notification_type = NotificationType.OVERDUE
                formatted_date = task_due.strftime("%Y-%m-%d %H:%M")
                message = f'Task "{task.title}" is overdue (was due {formatted_date}).'
            elif now <= task_due <= due_soon_threshold:
                notification_type = NotificationType.DUE_SOON
                formatted_date = task_due.strftime("%Y-%m-%d %H:%M")
                message = f'Task "{task.title}" is due soon (due {formatted_date}).'

            if notification_type:
                # Duplicate prevention: Check if notification of same type already exists for this task
                exists = (
                    db.query(Notification)
                    .filter(
                        Notification.task_id == task.id,
                        Notification.type == notification_type,
                    )
                    .first()
                )

                if not exists:
                    try:
                        new_notification = Notification(
                            task_id=task.id,
                            message=message,
                            type=notification_type,
                        )
                        db.add(new_notification)
                        db.commit()
                        created_count += 1
                        logger.info(
                            f"Created {notification_type.value} notification for task {task.id}: '{task.title}'"
                        )
                    except Exception as e:
                        db.rollback()
                        logger.error(f"Failed to create notification for task {task.id}: {e}")

        return checked_count, created_count

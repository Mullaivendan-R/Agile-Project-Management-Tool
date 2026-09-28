from datetime import datetime, timezone, timedelta
from fastapi import status
from backend.app.models.enums import TaskStatus, NotificationType
from backend.app.models.notification import Notification
from backend.app.services.notification_service import NotificationService


def test_notification_generation_and_duplicate_prevention(client, db_session):
    # Setup project and story
    p_res = client.post("/api/projects", json={"name": "Alert System Project"})
    proj_id = p_res.json()["id"]
    s_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Notification Story"})
    story_id = s_res.json()["id"]

    now = datetime.now(timezone.utc)

    # 1. Overdue task (due 2 days ago)
    t1_res = client.post(
        f"/api/stories/{story_id}/tasks",
        json={
            "title": "Overdue Bugfix",
            "status": "TODO",
            "due_date": (now - timedelta(days=2)).isoformat(),
        },
    )
    t1_id = t1_res.json()["id"]

    # 2. Due soon task (due in 5 hours)
    t2_res = client.post(
        f"/api/stories/{story_id}/tasks",
        json={
            "title": "Due Soon Feature",
            "status": "IN_PROGRESS",
            "due_date": (now + timedelta(hours=5)).isoformat(),
        },
    )
    t2_id = t2_res.json()["id"]

    # 3. Already DONE task (due 2 days ago) - should NOT trigger alert
    client.post(
        f"/api/stories/{story_id}/tasks",
        json={
            "title": "Completed Task",
            "status": "DONE",
            "due_date": (now - timedelta(days=2)).isoformat(),
        },
    )

    # 4. Far future task (due in 10 days) - should NOT trigger alert
    client.post(
        f"/api/stories/{story_id}/tasks",
        json={
            "title": "Future Task",
            "status": "TODO",
            "due_date": (now + timedelta(days=10)).isoformat(),
        },
    )

    # First run: should create 2 notifications
    checked, created = NotificationService.check_and_create_notifications(db_session, due_soon_hours=24)
    assert checked == 3  # 3 pending tasks with due_date
    assert created == 2  # t1 (overdue) and t2 (due soon)

    # Second run: duplicate prevention check -> created should be 0!
    checked2, created2 = NotificationService.check_and_create_notifications(db_session, due_soon_hours=24)
    assert checked2 == 3
    assert created2 == 0  # No duplicates created

    # Verify notifications via API
    notif_res = client.get("/api/notifications")
    assert notif_res.status_code == status.HTTP_200_OK
    notifications = notif_res.json()
    assert len(notifications) == 2

    types = {n["task_id"]: n["type"] for n in notifications}
    assert types[t1_id] == NotificationType.OVERDUE.value
    assert types[t2_id] == NotificationType.DUE_SOON.value


def test_mark_notification_as_read(client, db_session):
    p_res = client.post("/api/projects", json={"name": "Read Test Project"})
    proj_id = p_res.json()["id"]
    s_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Read Story"})
    story_id = s_res.json()["id"]

    now = datetime.now(timezone.utc)
    t_res = client.post(
        f"/api/stories/{story_id}/tasks",
        json={"title": "Urgent Action", "due_date": (now - timedelta(hours=1)).isoformat()},
    )
    task_id = t_res.json()["id"]

    NotificationService.check_and_create_notifications(db_session)
    notifs = client.get("/api/notifications?unread_only=true").json()
    assert len(notifs) >= 1
    notif_id = notifs[0]["id"]
    assert notifs[0]["read_at"] is None

    # Mark single notification as read
    patch_res = client.patch(f"/api/notifications/{notif_id}/read")
    assert patch_res.status_code == status.HTTP_200_OK
    assert patch_res.json()["read_at"] is not None

    # Mark all as read
    all_read_res = client.post("/api/notifications/read-all")
    assert all_read_res.status_code == status.HTTP_200_OK


def test_cascade_delete_task_deletes_notifications(client, db_session):
    p_res = client.post("/api/projects", json={"name": "Notif Cascade Project"})
    proj_id = p_res.json()["id"]
    s_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Notif Story"})
    story_id = s_res.json()["id"]

    now = datetime.now(timezone.utc)
    t_res = client.post(
        f"/api/stories/{story_id}/tasks",
        json={"title": "Task To Delete", "due_date": (now - timedelta(hours=1)).isoformat()},
    )
    task_id = t_res.json()["id"]

    NotificationService.check_and_create_notifications(db_session)
    notifications_before = db_session.query(Notification).filter(Notification.task_id == task_id).all()
    assert len(notifications_before) == 1

    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    # Notification should be deleted via cascade
    notifications_after = db_session.query(Notification).filter(Notification.task_id == task_id).all()
    assert len(notifications_after) == 0

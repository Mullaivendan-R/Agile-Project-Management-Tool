from datetime import datetime, timezone, timedelta
from fastapi import status


def test_create_task_success(client):
    proj_res = client.post("/api/projects", json={"name": "Task Test Project"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Story For Task"})
    story_id = story_res.json()["id"]

    due = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    task_payload = {
        "title": "Write unit tests",
        "description": "Ensure 90% code coverage",
        "status": "TODO",
        "priority": "HIGH",
        "assigned_to": "engineer@example.com",
        "due_date": due,
    }

    response = client.post(f"/api/stories/{story_id}/tasks", json=task_payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] is not None
    assert data["user_story_id"] == story_id
    assert data["title"] == task_payload["title"]
    assert data["status"] == "TODO"
    assert data["priority"] == "HIGH"
    assert data["assigned_to"] == "engineer@example.com"
    assert data["due_date"] is not None


def test_create_task_nonexistent_story(client):
    response = client.post(
        "/api/stories/99999/tasks",
        json={"title": "Orphan Task", "status": "TODO"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_task_invalid_validation(client):
    proj_res = client.post("/api/projects", json={"name": "Test Project"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Test Story"})
    story_id = story_res.json()["id"]

    # Missing title / empty title
    res_bad_title = client.post(f"/api/stories/{story_id}/tasks", json={"title": ""})
    assert res_bad_title.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid status
    res_bad_status = client.post(
        f"/api/stories/{story_id}/tasks",
        json={"title": "Valid Title", "status": "BLOCKED"},
    )
    assert res_bad_status.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_tasks_by_story(client):
    proj_res = client.post("/api/projects", json={"name": "Test Project"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Test Story"})
    story_id = story_res.json()["id"]

    client.post(f"/api/stories/{story_id}/tasks", json={"title": "Task 1"})
    client.post(f"/api/stories/{story_id}/tasks", json={"title": "Task 2"})

    response = client.get(f"/api/stories/{story_id}/tasks")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2


def test_update_task(client):
    proj_res = client.post("/api/projects", json={"name": "Test Project"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Test Story"})
    story_id = story_res.json()["id"]
    task_res = client.post(f"/api/stories/{story_id}/tasks", json={"title": "Initial Task", "status": "TODO"})
    task_id = task_res.json()["id"]

    update_payload = {
        "title": "Updated Task Title",
        "status": "IN_PROGRESS",
        "priority": "CRITICAL",
        "assigned_to": "senior_dev@example.com",
    }
    response = client.put(f"/api/tasks/{task_id}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Task Title"
    assert data["status"] == "IN_PROGRESS"
    assert data["priority"] == "CRITICAL"
    assert data["assigned_to"] == "senior_dev@example.com"


def test_delete_task(client):
    proj_res = client.post("/api/projects", json={"name": "Test Project"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Test Story"})
    story_id = story_res.json()["id"]
    task_res = client.post(f"/api/stories/{story_id}/tasks", json={"title": "Delete Me"})
    task_id = task_res.json()["id"]

    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND

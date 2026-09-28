from fastapi import status
from backend.app.models.project import Project
from backend.app.models.story import Story
from backend.app.models.task import Task


def test_project_hierarchy_retrieval(client):
    # 1. Create Project
    proj_res = client.post("/api/projects", json={"name": "Cloud Platform", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]

    # 2. Create Stories under Project
    s1_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Infrastructure", "status": "IN_PROGRESS"})
    s1_id = s1_res.json()["id"]

    s2_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Monitoring", "status": "TODO"})
    s2_id = s2_res.json()["id"]

    # 3. Create Tasks under Story 1
    t1_res = client.post(f"/api/stories/{s1_id}/tasks", json={"title": "Provision VPC", "status": "DONE"})
    t2_res = client.post(f"/api/stories/{s1_id}/tasks", json={"title": "Setup Subnets", "status": "IN_PROGRESS"})

    # 4. Create Task under Story 2
    t3_res = client.post(f"/api/stories/{s2_id}/tasks", json={"title": "Configure Prometheus", "status": "TODO"})

    # 5. Fetch Hierarchy
    response = client.get(f"/api/projects/{proj_id}/hierarchy")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["id"] == proj_id
    assert data["name"] == "Cloud Platform"
    assert len(data["stories"]) == 2

    # Map stories by ID
    story_map = {s["id"]: s for s in data["stories"]}
    assert s1_id in story_map
    assert s2_id in story_map

    s1_tasks = story_map[s1_id]["tasks"]
    assert len(s1_tasks) == 2
    s1_task_titles = [t["title"] for t in s1_tasks]
    assert "Provision VPC" in s1_task_titles
    assert "Setup Subnets" in s1_task_titles

    s2_tasks = story_map[s2_id]["tasks"]
    assert len(s2_tasks) == 1
    assert s2_tasks[0]["title"] == "Configure Prometheus"


def test_project_hierarchy_not_found(client):
    response = client.get("/api/projects/99999/hierarchy")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_cascade_delete_project(client, db_session):
    # Create project, story, and task
    proj_res = client.post("/api/projects", json={"name": "Cascade Test Project"})
    proj_id = proj_res.json()["id"]

    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Cascade Story"})
    story_id = story_res.json()["id"]

    task_res = client.post(f"/api/stories/{story_id}/tasks", json={"title": "Cascade Task"})
    task_id = task_res.json()["id"]

    # Delete project
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    # Check database: stories and tasks should be deleted due to cascade
    story_in_db = db_session.query(Story).filter(Story.id == story_id).first()
    task_in_db = db_session.query(Task).filter(Task.id == task_id).first()
    assert story_in_db is None
    assert task_in_db is None


def test_cascade_delete_story(client, db_session):
    proj_res = client.post("/api/projects", json={"name": "Story Cascade Project"})
    proj_id = proj_res.json()["id"]

    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Parent Story"})
    story_id = story_res.json()["id"]

    task_res = client.post(f"/api/stories/{story_id}/tasks", json={"title": "Child Task"})
    task_id = task_res.json()["id"]

    # Delete story
    del_res = client.delete(f"/api/stories/{story_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    # Check database: child task should be deleted
    task_in_db = db_session.query(Task).filter(Task.id == task_id).first()
    assert task_in_db is None
    # Project should still exist
    proj_in_db = db_session.query(Project).filter(Project.id == proj_id).first()
    assert proj_in_db is not None

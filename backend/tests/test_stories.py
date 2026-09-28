from fastapi import status


def test_create_story_success(client):
    proj_res = client.post("/api/projects", json={"name": "Core Sprint", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]

    story_payload = {
        "title": "Implement User Registration",
        "description": "User should provide email and password",
        "status": "TODO",
        "priority": "HIGH",
    }
    response = client.post(f"/api/projects/{proj_id}/stories", json=story_payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] is not None
    assert data["project_id"] == proj_id
    assert data["title"] == story_payload["title"]
    assert data["status"] == "TODO"
    assert data["priority"] == "HIGH"


def test_create_story_nonexistent_project(client):
    response = client.post(
        "/api/projects/99999/stories",
        json={"title": "Orphan Story", "status": "BACKLOG", "priority": "LOW"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_story_invalid_enums(client):
    proj_res = client.post("/api/projects", json={"name": "Test Project", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]

    # Invalid status
    bad_res1 = client.post(
        f"/api/projects/{proj_id}/stories",
        json={"title": "Test", "status": "NOT_A_STATUS"},
    )
    assert bad_res1.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid priority
    bad_res2 = client.post(
        f"/api/projects/{proj_id}/stories",
        json={"title": "Test", "priority": "SUPER_URGENT"},
    )
    assert bad_res2.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_stories_by_project(client):
    proj_res = client.post("/api/projects", json={"name": "Story Listing Project", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]

    client.post(f"/api/projects/{proj_id}/stories", json={"title": "Story A", "status": "TODO"})
    client.post(f"/api/projects/{proj_id}/stories", json={"title": "Story B", "status": "IN_PROGRESS"})

    response = client.get(f"/api/projects/{proj_id}/stories")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    titles = [s["title"] for s in data]
    assert "Story A" in titles
    assert "Story B" in titles


def test_get_stories_nonexistent_project(client):
    response = client.get("/api/projects/99999/stories")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_story_by_id(client):
    proj_res = client.post("/api/projects", json={"name": "Project X", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Story X1", "status": "TODO"})
    story_id = story_res.json()["id"]

    response = client.get(f"/api/stories/{story_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == story_id
    assert response.json()["title"] == "Story X1"


def test_update_story(client):
    proj_res = client.post("/api/projects", json={"name": "Project Y", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Story Init", "status": "TODO"})
    story_id = story_res.json()["id"]

    update_payload = {"title": "Story Updated", "status": "DONE", "priority": "CRITICAL"}
    response = client.put(f"/api/stories/{story_id}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["title"] == "Story Updated"
    assert response.json()["status"] == "DONE"
    assert response.json()["priority"] == "CRITICAL"


def test_delete_story(client):
    proj_res = client.post("/api/projects", json={"name": "Project Z", "status": "ACTIVE"})
    proj_id = proj_res.json()["id"]
    story_res = client.post(f"/api/projects/{proj_id}/stories", json={"title": "Story To Delete"})
    story_id = story_res.json()["id"]

    del_res = client.delete(f"/api/stories/{story_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    get_res = client.get(f"/api/stories/{story_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND

from fastapi import status


def test_create_project_success(client):
    payload = {
        "name": "E-Commerce Migration",
        "description": "Porting monolith to modern architecture",
        "status": "ACTIVE",
    }
    response = client.post("/api/projects", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == payload["name"]
    assert data["description"] == payload["description"]
    assert data["status"] == "ACTIVE"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_project_validation_failure(client):
    # Empty name violates min_length=1
    payload = {"name": "", "status": "ACTIVE"}
    response = client.post("/api/projects", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid status enum
    payload_bad_status = {"name": "Valid Name", "status": "INVALID_STATUS"}
    response_bad_status = client.post("/api/projects", json=payload_bad_status)
    assert response_bad_status.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_projects_list(client):
    client.post("/api/projects", json={"name": "Project 1", "status": "PLANNING"})
    client.post("/api/projects", json={"name": "Project 2", "status": "ACTIVE"})

    response = client.get("/api/projects")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2
    names = [p["name"] for p in data]
    assert "Project 1" in names
    assert "Project 2" in names


def test_get_project_by_id(client):
    create_res = client.post("/api/projects", json={"name": "Alpha Project", "status": "PLANNING"})
    project_id = create_res.json()["id"]

    response = client.get(f"/api/projects/{project_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == project_id
    assert response.json()["name"] == "Alpha Project"


def test_get_project_not_found(client):
    response = client.get("/api/projects/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_update_project(client):
    create_res = client.post("/api/projects", json={"name": "Old Project Name", "status": "PLANNING"})
    project_id = create_res.json()["id"]

    update_payload = {"name": "Updated Project Name", "status": "COMPLETED"}
    response = client.put(f"/api/projects/{project_id}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Project Name"
    assert data["status"] == "COMPLETED"


def test_update_project_not_found(client):
    response = client.put("/api/projects/99999", json={"name": "Nonexistent"})
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_project(client):
    create_res = client.post("/api/projects", json={"name": "To Be Deleted", "status": "ARCHIVED"})
    project_id = create_res.json()["id"]

    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    # Verify project is gone
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND


def test_delete_project_not_found(client):
    response = client.delete("/api/projects/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND

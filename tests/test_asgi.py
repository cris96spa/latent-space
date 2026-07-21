import pytest
from fastapi.testclient import TestClient

from asgi import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health_is_served_under_api_prefix(client: TestClient):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_version_is_served_under_api_prefix(client: TestClient):
    response = client.get("/api/version")

    assert response.status_code == 200
    assert isinstance(response.json()["version"], str)


def test_content_router_is_reachable_under_api_prefix(client: TestClient):
    # Proves the whole app (not just monitoring) is mounted, without asserting on
    # specific authored content: an empty content dir still yields 200 + a list.
    response = client.get("/api/projects")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_unprefixed_path_is_not_served(client: TestClient):
    # The mount is at /api; the outer app has no bare /health. A 404 here is what
    # proves Vercel's non-stripped /api/* path lands on the app's /health.
    response = client.get("/health")

    assert response.status_code == 404

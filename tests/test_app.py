import pytest
from fastapi.testclient import TestClient

from latent_space.app import create_app
from latent_space.constants import ALLOWED_ORIGINS
from latent_space.core.settings import AppSettings


@pytest.fixture
def client() -> TestClient:
    app = create_app(settings=AppSettings(allowed_origins=[]))
    return TestClient(app)


def test_health_reports_ok(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_version_returns_installed_version(client: TestClient):
    from latent_space.core.version import get_app_version

    response = client.get("/version")

    assert response.status_code == 200
    assert response.json() == {"version": get_app_version()}


def test_root_returns_name_and_version(client: TestClient):
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "latent-space"
    assert isinstance(body["version"], str) and body["version"]


def test_cors_header_present_for_allowed_origin():
    app = create_app(settings=AppSettings(allowed_origins=ALLOWED_ORIGINS))
    client = TestClient(app)

    response = client.get("/health", headers={"Origin": ALLOWED_ORIGINS[0]})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGINS[0]

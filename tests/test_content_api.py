from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient

from latent_space.api.dependencies import get_content_service
from latent_space.app import create_app
from latent_space.core.settings import AppSettings
from latent_space.models.content import ChatEntry, Project
from latent_space.services.content import ContentService


def _fixture_service() -> ContentService:
    projects = [
        Project(
            slug="alpha",
            title="Alpha",
            summary="A summary",
            stack=["Python"],
            tags=["x"],
            repository_url="https://github.com/cris96spa/alpha",
            published_at=date(2024, 1, 1),
            body_markdown="Alpha **body**.",
        ),
        Project(
            slug="bravo",
            title="Bravo",
            summary="B summary",
            published_at=date(2025, 1, 1),
            body_markdown="Bravo body.",
        ),
        Project(
            slug="secret",
            title="Secret",
            summary="hidden",
            published_at=date(2026, 1, 1),
            body_markdown="nope",
            draft=True,
        ),
    ]
    chat_entries = [
        ChatEntry(
            slug="say-hi",
            question="Q?",
            category="now",
            order=0,
            answer_markdown="An *answer*.",
        ),
    ]
    return ContentService(projects, chat_entries)


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = create_app(settings=AppSettings(allowed_origins=[]))
    app.dependency_overrides[get_content_service] = _fixture_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_list_projects_returns_published_newest_first(client: TestClient):
    response = client.get("/projects")

    assert response.status_code == 200
    slugs = [project["slug"] for project in response.json()]
    assert slugs == ["bravo", "alpha"]


def test_list_projects_omits_body_and_draft_fields(client: TestClient):
    project = client.get("/projects").json()[0]

    assert "body_html" not in project
    assert "body_markdown" not in project
    assert "draft" not in project


def test_get_project_detail_returns_rendered_body(client: TestClient):
    response = client.get("/projects/alpha")

    assert response.status_code == 200
    body = response.json()
    assert "<strong>body</strong>" in body["body_html"]
    assert body["repository_url"].startswith("https://github.com/cris96spa/alpha")


def test_get_unknown_project_returns_404(client: TestClient):
    response = client.get("/projects/does-not-exist")

    assert response.status_code == 404


def test_get_draft_project_returns_404(client: TestClient):
    response = client.get("/projects/secret")

    assert response.status_code == 404


def test_list_chat_entries_returns_rendered_answers(client: TestClient):
    response = client.get("/chat/entries")

    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 1
    assert entries[0]["question"] == "Q?"
    assert "<em>answer</em>" in entries[0]["answer_html"]

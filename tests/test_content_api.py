from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient

from latent_space.api.dependencies import get_content_service
from latent_space.app import create_app
from latent_space.core.settings import AppSettings
from latent_space.models.content import ChatEntry, Post, Project
from latent_space.services.content import ContentService


def _fixture_service() -> ContentService:
    projects = [
        Project(
            public_identifier="alpha",
            title="Alpha",
            summary="A summary",
            stack=["Python"],
            tags=["x"],
            repository_url="https://github.com/cris96spa/alpha",
            published_at=date(2024, 1, 1),
            body_markdown="Alpha **body**.",
        ),
        Project(
            public_identifier="bravo",
            title="Bravo",
            summary="B summary",
            published_at=date(2025, 1, 1),
            body_markdown="Bravo body.",
        ),
        Project(
            public_identifier="secret",
            title="Secret",
            summary="hidden",
            published_at=date(2026, 1, 1),
            body_markdown="nope",
            draft=True,
        ),
    ]
    chat_entries = [
        ChatEntry(
            public_identifier="say-hi",
            question="Q?",
            category="now",
            attachment="resume",
            order=0,
            answer_markdown="An *answer*.",
        ),
    ]
    posts = [
        Post(
            public_identifier="warm-start",
            title="Warm start",
            summary="Notes on resuming a run.",
            external_url="https://cris.substack.com/p/warm-start",
            tags=["training"],
            published_at=date(2025, 6, 1),
        ),
        Post(
            public_identifier="second-epoch",
            title="Second epoch",
            summary="What changed the second time around.",
            external_url="https://cris.substack.com/p/second-epoch",
            published_at=date(2026, 2, 1),
        ),
        Post(
            public_identifier="draft-post",
            title="Draft post",
            summary="not ready",
            external_url="https://cris.substack.com/p/draft",
            published_at=date(2027, 1, 1),
            draft=True,
        ),
    ]
    return ContentService(projects, chat_entries, posts)


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = create_app(settings=AppSettings(allowed_origins=[]))
    app.dependency_overrides[get_content_service] = _fixture_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_list_projects_returns_published_newest_first(client: TestClient):
    response = client.get("/projects")

    assert response.status_code == 200
    public_identifiers = [project["public_identifier"] for project in response.json()]
    assert public_identifiers == ["bravo", "alpha"]


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


def test_get_project_with_malformed_identifier_returns_422(client: TestClient):
    response = client.get("/projects/Not_A_Valid_Id")

    assert response.status_code == 422


def test_list_posts_returns_published_newest_first(client: TestClient):
    response = client.get("/posts")

    assert response.status_code == 200
    public_identifiers = [post["public_identifier"] for post in response.json()]
    assert public_identifiers == ["second-epoch", "warm-start"]


def test_list_posts_omits_draft_field_and_exposes_external_url(client: TestClient):
    post = client.get("/posts").json()[0]

    assert "draft" not in post
    assert post["external_url"].startswith("https://cris.substack.com/p/")


def test_list_chat_entries_returns_rendered_answers(client: TestClient):
    response = client.get("/chat/entries")

    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 1
    assert entries[0]["question"] == "Q?"
    assert entries[0]["attachment"] == "resume"
    assert "<em>answer</em>" in entries[0]["answer_html"]

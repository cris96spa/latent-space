from datetime import date
from pathlib import Path

import pytest

from latent_space.models.content import ChatEntry, Project
from latent_space.services.content import (
    ContentLoadError,
    ContentService,
    load_projects_from_directory,
    parse_frontmatter_document,
    sort_chat_entries,
    sort_projects_newest_first,
)


def _project(slug: str, published_at: date, *, draft: bool = False) -> Project:
    return Project(
        slug=slug,
        title=slug,
        summary="summary",
        published_at=published_at,
        body_markdown="body",
        draft=draft,
    )


def _chat(slug: str, order: int, *, draft: bool = False) -> ChatEntry:
    return ChatEntry(
        slug=slug,
        question="q",
        category="c",
        order=order,
        answer_markdown="answer",
        draft=draft,
    )


def _write_project_file(directory: Path, filename: str, body: str) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / filename).write_text(body, encoding="utf-8")


def test_parse_frontmatter_splits_metadata_and_body():
    metadata, body = parse_frontmatter_document("---\ntitle: Hi\norder: 3\n---\nThe **body**.")

    assert metadata == {"title": "Hi", "order": 3}
    assert body == "The **body**."


def test_parse_frontmatter_requires_opening_delimiter():
    with pytest.raises(ContentLoadError):
        parse_frontmatter_document("no frontmatter here")


def test_parse_frontmatter_requires_closing_delimiter():
    with pytest.raises(ContentLoadError):
        parse_frontmatter_document("---\ntitle: Hi\nbody with no close")


def test_loads_valid_project(tmp_path: Path):
    _write_project_file(
        tmp_path / "projects",
        "alpha.md",
        "---\nslug: alpha\ntitle: Alpha\nsummary: s\npublished_at: 2024-01-01\n---\nBody **x**.",
    )

    projects = load_projects_from_directory(tmp_path / "projects")

    assert len(projects) == 1
    assert projects[0].slug == "alpha"
    assert projects[0].body_markdown == "Body **x**."


def test_missing_required_field_fails_loudly(tmp_path: Path):
    _write_project_file(
        tmp_path / "projects",
        "alpha.md",
        "---\nslug: alpha\ntitle: Alpha\npublished_at: 2024-01-01\n---\nBody.",
    )

    with pytest.raises(ContentLoadError):
        load_projects_from_directory(tmp_path / "projects")


def test_duplicate_slug_fails_loudly(tmp_path: Path):
    directory = tmp_path / "projects"
    _write_project_file(
        directory,
        "one.md",
        "---\nslug: dup\ntitle: One\nsummary: s\npublished_at: 2024-01-01\n---\nBody.",
    )
    _write_project_file(
        directory,
        "two.md",
        "---\nslug: dup\ntitle: Two\nsummary: s\npublished_at: 2024-01-02\n---\nBody.",
    )

    with pytest.raises(ContentLoadError, match="duplicate project slug 'dup'"):
        load_projects_from_directory(directory)


def test_missing_directory_returns_empty_list(tmp_path: Path):
    assert load_projects_from_directory(tmp_path / "absent") == []


def test_sort_projects_newest_first_breaks_date_ties_by_slug():
    projects = [
        _project("bravo", date(2025, 6, 1)),
        _project("charlie", date(2024, 1, 1)),
        _project("alpha", date(2024, 1, 1)),
        _project("delta", date(2023, 12, 31)),
    ]

    ordered = sort_projects_newest_first(projects)

    assert [project.slug for project in ordered] == ["bravo", "alpha", "charlie", "delta"]


def test_sort_chat_entries_by_order_then_slug():
    entries = [
        _chat("z-last", 2),
        _chat("mid-b", 1),
        _chat("mid-a", 1),
        _chat("first", 0),
    ]

    ordered = sort_chat_entries(entries)

    assert [entry.slug for entry in ordered] == ["first", "mid-a", "mid-b", "z-last"]


def test_service_excludes_drafts_and_prerenders_html():
    projects = [
        Project(
            slug="published-one",
            title="Published One",
            summary="s",
            published_at=date(2024, 1, 1),
            body_markdown="**hi**",
        ),
        _project("a-draft", date(2025, 1, 1), draft=True),
    ]
    chat_entries = [
        ChatEntry(
            slug="visible",
            question="q",
            category="c",
            order=0,
            answer_markdown="*yes*",
        ),
        _chat("hidden", 1, draft=True),
    ]

    service = ContentService(projects, chat_entries)

    assert [summary.slug for summary in service.published_project_summaries()] == ["published-one"]
    detail = service.published_project_detail("published-one")
    assert detail is not None
    assert "<strong>hi</strong>" in detail.body_html
    assert service.published_project_detail("a-draft") is None
    assert service.published_project_detail("unknown") is None

    responses = service.chat_entries()
    assert [response.slug for response in responses] == ["visible"]
    assert "<em>yes</em>" in responses[0].answer_html

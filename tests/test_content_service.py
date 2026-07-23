from datetime import date
from pathlib import Path

import pytest
from pydantic import ValidationError

from latent_space.models.content import ChatEntry, Post, Project
from latent_space.services.content import (
    ContentLoadError,
    ContentService,
    load_chat_entries_from_directory,
    load_posts_from_directory,
    load_projects_from_directory,
    parse_frontmatter_document,
    sort_chat_entries,
    sort_posts_newest_first,
    sort_projects_newest_first,
)


def _project(public_identifier: str, published_at: date, *, draft: bool = False) -> Project:
    return Project(
        public_identifier=public_identifier,
        title=public_identifier,
        summary="summary",
        published_at=published_at,
        body_markdown="body",
        draft=draft,
    )


def _chat(public_identifier: str, order: int, *, draft: bool = False) -> ChatEntry:
    return ChatEntry(
        public_identifier=public_identifier,
        question="q",
        category="c",
        order=order,
        answer_markdown="answer",
        draft=draft,
    )


def _post(public_identifier: str, published_at: date, *, draft: bool = False) -> Post:
    return Post(
        public_identifier=public_identifier,
        title=public_identifier,
        summary="summary",
        external_url="https://cris.substack.com/p/one",
        published_at=published_at,
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


def test_public_identifier_is_derived_from_filename(tmp_path: Path):
    _write_project_file(
        tmp_path / "projects",
        "alpha-project.md",
        "---\ntitle: Alpha\nsummary: s\npublished_at: 2024-01-01\n---\nBody **x**.",
    )

    projects = load_projects_from_directory(tmp_path / "projects")

    assert len(projects) == 1
    assert projects[0].public_identifier == "alpha-project"
    assert projects[0].body_markdown == "Body **x**."


def test_authored_public_identifier_in_frontmatter_is_rejected(tmp_path: Path):
    _write_project_file(
        tmp_path / "projects",
        "alpha.md",
        "---\npublic_identifier: something-else\ntitle: Alpha\n"
        "summary: s\npublished_at: 2024-01-01\n---\nB.",
    )

    with pytest.raises(ContentLoadError, match="public_identifier is derived from the filename"):
        load_projects_from_directory(tmp_path / "projects")


def test_non_public_identifier_filename_fails_loudly(tmp_path: Path):
    _write_project_file(
        tmp_path / "projects",
        "Bad Name.md",
        "---\ntitle: Bad\nsummary: s\npublished_at: 2024-01-01\n---\nBody.",
    )

    with pytest.raises(ContentLoadError):
        load_projects_from_directory(tmp_path / "projects")


def test_missing_required_field_fails_loudly(tmp_path: Path):
    _write_project_file(
        tmp_path / "projects",
        "alpha.md",
        "---\ntitle: Alpha\npublished_at: 2024-01-01\n---\nBody.",
    )

    with pytest.raises(ContentLoadError):
        load_projects_from_directory(tmp_path / "projects")


def test_chat_attachment_loads_from_frontmatter(tmp_path: Path):
    _write_project_file(
        tmp_path / "chat",
        "banner.md",
        "---\nquestion: q\ncategory: c\norder: 0\nattachment: playbook-banner\n---\nBody.",
    )

    entries = load_chat_entries_from_directory(tmp_path / "chat")

    assert entries[0].attachment == "playbook-banner"


def test_chat_without_attachment_defaults_to_none(tmp_path: Path):
    _write_project_file(
        tmp_path / "chat",
        "plain.md",
        "---\nquestion: q\ncategory: c\norder: 0\n---\nBody.",
    )

    entries = load_chat_entries_from_directory(tmp_path / "chat")

    assert entries[0].attachment is None


def test_unknown_attachment_value_fails_loudly(tmp_path: Path):
    _write_project_file(
        tmp_path / "chat",
        "bad.md",
        "---\nquestion: q\ncategory: c\norder: 0\nattachment: not-a-widget\n---\nBody.",
    )

    with pytest.raises(ContentLoadError):
        load_chat_entries_from_directory(tmp_path / "chat")


def test_missing_directory_returns_empty_list(tmp_path: Path):
    assert load_projects_from_directory(tmp_path / "absent") == []


def test_load_posts_derives_public_identifier_and_ignores_body(tmp_path: Path):
    _write_project_file(
        tmp_path / "posts",
        "first-epoch.md",
        "---\ntitle: First epoch\nsummary: s\n"
        "external_url: https://cris.substack.com/p/first-epoch\n"
        "published_at: 2026-01-02\n---\n",
    )

    posts = load_posts_from_directory(tmp_path / "posts")

    assert len(posts) == 1
    assert posts[0].public_identifier == "first-epoch"
    assert str(posts[0].external_url) == "https://cris.substack.com/p/first-epoch"


def test_load_posts_requires_external_url(tmp_path: Path):
    _write_project_file(
        tmp_path / "posts",
        "no-link.md",
        "---\ntitle: No link\nsummary: s\npublished_at: 2026-01-02\n---\n",
    )

    with pytest.raises(ContentLoadError):
        load_posts_from_directory(tmp_path / "posts")


def test_load_posts_missing_directory_returns_empty_list(tmp_path: Path):
    assert load_posts_from_directory(tmp_path / "absent") == []


def test_sort_posts_newest_first_breaks_date_ties_by_public_identifier():
    posts = [
        _post("bravo", date(2026, 6, 1)),
        _post("charlie", date(2025, 1, 1)),
        _post("alpha", date(2025, 1, 1)),
        _post("delta", date(2024, 12, 31)),
    ]

    ordered = sort_posts_newest_first(posts)

    assert [post.public_identifier for post in ordered] == ["bravo", "alpha", "charlie", "delta"]


def test_sort_projects_newest_first_breaks_date_ties_by_public_identifier():
    projects = [
        _project("bravo", date(2025, 6, 1)),
        _project("charlie", date(2024, 1, 1)),
        _project("alpha", date(2024, 1, 1)),
        _project("delta", date(2023, 12, 31)),
    ]

    ordered = sort_projects_newest_first(projects)

    assert [project.public_identifier for project in ordered] == [
        "bravo",
        "alpha",
        "charlie",
        "delta",
    ]


def test_service_publishes_posts_newest_first_excluding_drafts():
    posts = [
        _post("older", date(2025, 1, 1)),
        _post("newer", date(2026, 1, 1)),
        _post("hidden", date(2027, 1, 1), draft=True),
    ]

    service = ContentService([], [], posts)

    summaries = service.published_post_summaries()
    assert [summary.public_identifier for summary in summaries] == ["newer", "older"]
    assert all(not hasattr(summary, "draft") for summary in summaries)


def test_sort_chat_entries_by_order_then_public_identifier():
    entries = [
        _chat("z-last", 2),
        _chat("mid-b", 1),
        _chat("mid-a", 1),
        _chat("first", 0),
    ]

    ordered = sort_chat_entries(entries)

    assert [entry.public_identifier for entry in ordered] == ["first", "mid-a", "mid-b", "z-last"]


def test_service_excludes_drafts_and_prerenders_html():
    projects = [
        Project(
            public_identifier="published-one",
            title="Published One",
            summary="s",
            published_at=date(2024, 1, 1),
            body_markdown="**hi**",
        ),
        _project("a-draft", date(2025, 1, 1), draft=True),
    ]
    chat_entries = [
        ChatEntry(
            public_identifier="visible",
            question="q",
            category="c",
            order=0,
            answer_markdown="*yes*",
        ),
        _chat("hidden", 1, draft=True),
    ]

    service = ContentService(projects, chat_entries, [])

    summaries = service.published_project_summaries()
    assert [summary.public_identifier for summary in summaries] == ["published-one"]
    detail = service.published_project_detail("published-one")
    assert detail is not None
    assert "<strong>hi</strong>" in detail.body_html
    assert service.published_project_detail("a-draft") is None
    assert service.published_project_detail("unknown") is None

    responses = service.chat_entries()
    assert [response.public_identifier for response in responses] == ["visible"]
    assert "<em>yes</em>" in responses[0].answer_html


def test_published_projections_are_immutable():
    service = ContentService(
        [_project("alpha", date(2024, 1, 1))],
        [_chat("say-hi", 0)],
        [_post("first-post", date(2024, 1, 1))],
    )

    summary = service.published_project_summaries()[0]
    detail = service.published_project_detail("alpha")
    assert detail is not None
    response = service.chat_entries()[0]
    post_summary = service.published_post_summaries()[0]

    with pytest.raises(ValidationError):
        summary.title = "mutated"
    with pytest.raises(ValidationError):
        detail.title = "mutated"
    with pytest.raises(ValidationError):
        response.question = "mutated"
    with pytest.raises(ValidationError):
        post_summary.title = "mutated"

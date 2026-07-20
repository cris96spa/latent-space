from collections.abc import Iterable
from pathlib import Path

import yaml
from pydantic import ValidationError

from latent_space.constants import (
    CHAT_CONTENT_SUBDIRECTORY,
    CONTENT_FILE_SUFFIX,
    PROJECTS_CONTENT_SUBDIRECTORY,
)
from latent_space.models.content import (
    ChatEntry,
    ChatEntryResponse,
    Project,
    ProjectDetail,
    ProjectSummary,
)
from latent_space.services.markdown import render_markdown_to_safe_html

FRONTMATTER_DELIMITER = "---"


class ContentLoadError(RuntimeError):
    """Raised when authored content on disk is malformed, invalid, or ambiguous.

    Loading raises rather than skipping a bad file so a missing required field
    or a duplicate slug fails the process at load time instead of silently
    serving partial or wrong content (CLAUDE.md content conventions).
    """


def parse_frontmatter_document(text: str) -> tuple[dict[str, object], str]:
    """Split a Markdown-with-frontmatter document into metadata and body.

    The document must open with a `---` line, hold a YAML mapping, close the
    block with another `---` line, and then contain the Markdown body.

    Args:
        text: Full document text, opening with a `---` frontmatter block.

    Returns:
        The parsed frontmatter mapping and the body text with surrounding
        whitespace stripped.

    Raises:
        ContentLoadError: If the leading frontmatter block is missing, is not
            terminated by a closing `---`, or does not parse to a YAML mapping.
    """
    lines = text.splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_DELIMITER:
        raise ContentLoadError("document does not open with a '---' frontmatter block")

    for index in range(1, len(lines)):
        if lines[index].strip() == FRONTMATTER_DELIMITER:
            frontmatter_text = "\n".join(lines[1:index])
            body = "\n".join(lines[index + 1 :]).strip()
            metadata = yaml.safe_load(frontmatter_text) or {}
            if not isinstance(metadata, dict):
                raise ContentLoadError("frontmatter must be a YAML mapping")
            return metadata, body

    raise ContentLoadError("frontmatter block is not terminated by a closing '---'")


def load_projects_from_directory(directory: Path) -> list[Project]:
    """Load and validate every project file in `directory`.

    The authoritative identifier is each file's frontmatter `slug`, which must be
    unique across the directory.

    Args:
        directory: Directory scanned for project Markdown files.

    Returns:
        The validated projects, including drafts; an empty list when the
        directory does not exist, since absent content is not an error.

    Raises:
        ContentLoadError: On a malformed file, a schema validation failure, or a
            duplicate slug.
    """
    if not directory.is_dir():
        return []

    projects: list[Project] = []
    seen_slugs: set[str] = set()
    for path in sorted(directory.glob(f"*{CONTENT_FILE_SUFFIX}")):
        metadata, body = parse_frontmatter_document(path.read_text(encoding="utf-8"))
        metadata["body_markdown"] = body
        try:
            project = Project.model_validate(metadata)
        except ValidationError as error:
            raise ContentLoadError(f"invalid project content in '{path.name}': {error}") from error
        if project.slug in seen_slugs:
            raise ContentLoadError(f"duplicate project slug '{project.slug}' in '{path.name}'")
        seen_slugs.add(project.slug)
        projects.append(project)
    return projects


def load_chat_entries_from_directory(directory: Path) -> list[ChatEntry]:
    """Load and validate every chat-entry file in `directory`.

    Same authoritative-slug uniqueness rule as `load_projects_from_directory`.

    Args:
        directory: Directory scanned for chat-entry Markdown files.

    Returns:
        The validated chat entries, including drafts; an empty list when the
        directory does not exist.

    Raises:
        ContentLoadError: On a malformed file, a schema validation failure, or a
            duplicate slug.
    """
    if not directory.is_dir():
        return []

    entries: list[ChatEntry] = []
    seen_slugs: set[str] = set()
    for path in sorted(directory.glob(f"*{CONTENT_FILE_SUFFIX}")):
        metadata, body = parse_frontmatter_document(path.read_text(encoding="utf-8"))
        metadata["answer_markdown"] = body
        try:
            entry = ChatEntry.model_validate(metadata)
        except ValidationError as error:
            raise ContentLoadError(f"invalid chat content in '{path.name}': {error}") from error
        if entry.slug in seen_slugs:
            raise ContentLoadError(f"duplicate chat entry slug '{entry.slug}' in '{path.name}'")
        seen_slugs.add(entry.slug)
        entries.append(entry)
    return entries


def sort_projects_newest_first(projects: Iterable[Project]) -> list[Project]:
    """Order projects for display, most recently published first.

    Ranking rule: descending `published_at`; ties are broken by ascending `slug`
    so the ordering is total and independent of filesystem iteration order.
    Implemented as a stable sort by slug followed by a stable reverse sort by
    date, which leaves same-date projects in ascending-slug order.
    """
    by_slug_ascending = sorted(projects, key=lambda project: project.slug)
    return sorted(by_slug_ascending, key=lambda project: project.published_at, reverse=True)


def sort_chat_entries(entries: Iterable[ChatEntry]) -> list[ChatEntry]:
    """Order chat entries by ascending `order`, ties broken by ascending `slug`."""
    return sorted(entries, key=lambda entry: (entry.order, entry.slug))


class ContentService:
    """Read-only, in-memory view of validated site content.

    Constructed once from already-loaded projects and chat entries: it excludes
    drafts, orders the survivors deterministically, and pre-renders project
    bodies and chat answers to sanitized HTML. Rendering up front keeps request
    handlers thin and makes any rendering failure surface at load time. The
    published projections it returns are copies, so callers cannot mutate the
    cached content.
    """

    def __init__(self, projects: list[Project], chat_entries: list[ChatEntry]) -> None:
        published_projects = sort_projects_newest_first(
            project for project in projects if not project.draft
        )
        self._project_summaries = [self._to_summary(project) for project in published_projects]
        self._project_details = {
            project.slug: self._to_detail(project) for project in published_projects
        }
        published_chat = sort_chat_entries(entry for entry in chat_entries if not entry.draft)
        self._chat_responses = [self._to_chat_response(entry) for entry in published_chat]

    @classmethod
    def from_content_root(cls, content_root: Path) -> "ContentService":
        """Load, validate, and build the service from a content root directory."""
        projects = load_projects_from_directory(content_root / PROJECTS_CONTENT_SUBDIRECTORY)
        chat_entries = load_chat_entries_from_directory(content_root / CHAT_CONTENT_SUBDIRECTORY)
        return cls(projects, chat_entries)

    def published_project_summaries(self) -> list[ProjectSummary]:
        return list(self._project_summaries)

    def published_project_detail(self, slug: str) -> ProjectDetail | None:
        """Return the published project with `slug`, or `None` if there is none.

        Drafts are absent from the index, so a draft slug also returns `None`.
        """
        return self._project_details.get(slug)

    def chat_entries(self) -> list[ChatEntryResponse]:
        return list(self._chat_responses)

    @staticmethod
    def _to_summary(project: Project) -> ProjectSummary:
        return ProjectSummary.model_validate(project.model_dump(exclude={"draft", "body_markdown"}))

    @staticmethod
    def _to_detail(project: Project) -> ProjectDetail:
        return ProjectDetail(
            **project.model_dump(exclude={"draft", "body_markdown"}),
            body_html=render_markdown_to_safe_html(project.body_markdown),
        )

    @staticmethod
    def _to_chat_response(entry: ChatEntry) -> ChatEntryResponse:
        return ChatEntryResponse(
            slug=entry.slug,
            question=entry.question,
            category=entry.category,
            answer_html=render_markdown_to_safe_html(entry.answer_markdown),
        )

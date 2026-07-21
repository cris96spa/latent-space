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
    or a duplicate public identifier fails the process at load time instead of silently
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


def _public_identifier_from_filename(path: Path, metadata: dict[str, object]) -> str:
    """Return the public identifier for `path`, guarding the single-source-of-truth rule.

    The public identifier is the filename stem, never the frontmatter, so filenames and URLs
    cannot drift apart. Uniqueness within the directory is guaranteed by the
    filesystem: two files cannot share a stem.

    Args:
        path: Content file whose stem becomes the public identifier.
        metadata: Parsed frontmatter; must not declare its own `public_identifier`.

    Returns:
        The filename stem.

    Raises:
        ContentLoadError: If the frontmatter declares a `public_identifier` key, which
            would introduce a second, competing identifier.
    """
    if "public_identifier" in metadata:
        raise ContentLoadError(
            f"'{path.name}': public_identifier is derived from the filename; "
            "remove the 'public_identifier' key from the frontmatter"
        )
    return path.stem


def load_projects_from_directory(directory: Path) -> list[Project]:
    """Load and validate every project file in `directory`.

    Each project's public identifier is its filename stem (see `_public_identifier_from_filename`).

    Args:
        directory: Directory scanned for project Markdown files.

    Returns:
        The validated projects, including drafts; an empty list when the
        directory does not exist, since absent content is not an error.

    Raises:
        ContentLoadError: On a malformed file, a schema validation failure, or a
            frontmatter that declares its own `public_identifier`.
    """
    if not directory.is_dir():
        return []

    projects: list[Project] = []
    for path in sorted(directory.glob(f"*{CONTENT_FILE_SUFFIX}")):
        metadata, body = parse_frontmatter_document(path.read_text(encoding="utf-8"))
        metadata["public_identifier"] = _public_identifier_from_filename(path, metadata)
        metadata["body_markdown"] = body
        try:
            project = Project.model_validate(metadata)
        except ValidationError as error:
            raise ContentLoadError(f"invalid project content in '{path.name}': {error}") from error
        projects.append(project)
    return projects


def load_chat_entries_from_directory(directory: Path) -> list[ChatEntry]:
    """Load and validate every chat-entry file in `directory`.

    Each entry's public identifier is its filename stem, exactly as for projects (see
    `_public_identifier_from_filename`).

    Args:
        directory: Directory scanned for chat-entry Markdown files.

    Returns:
        The validated chat entries, including drafts; an empty list when the
        directory does not exist.

    Raises:
        ContentLoadError: On a malformed file, a schema validation failure, or a
            frontmatter that declares its own `public_identifier`.
    """
    if not directory.is_dir():
        return []

    entries: list[ChatEntry] = []
    for path in sorted(directory.glob(f"*{CONTENT_FILE_SUFFIX}")):
        metadata, body = parse_frontmatter_document(path.read_text(encoding="utf-8"))
        metadata["public_identifier"] = _public_identifier_from_filename(path, metadata)
        metadata["answer_markdown"] = body
        try:
            entry = ChatEntry.model_validate(metadata)
        except ValidationError as error:
            raise ContentLoadError(f"invalid chat content in '{path.name}': {error}") from error
        entries.append(entry)
    return entries


def sort_projects_newest_first(projects: Iterable[Project]) -> list[Project]:
    """Order projects for display, most recently published first.

    Ranking rule: descending `published_at`; ties are broken by ascending `public_identifier`
    so the ordering is total and independent of filesystem iteration order.
    Implemented as a stable sort by public identifier followed by a stable reverse sort by
    date, which leaves same-date projects in ascending-public-identifier order.
    """
    by_public_identifier = sorted(projects, key=lambda project: project.public_identifier)
    return sorted(by_public_identifier, key=lambda project: project.published_at, reverse=True)


def sort_chat_entries(entries: Iterable[ChatEntry]) -> list[ChatEntry]:
    """Order chat entries by ascending `order`, ties broken by ascending `public_identifier`."""
    return sorted(entries, key=lambda entry: (entry.order, entry.public_identifier))


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
            project.public_identifier: self._to_detail(project) for project in published_projects
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

    def published_project_detail(self, public_identifier: str) -> ProjectDetail | None:
        """Return the published project with `public_identifier`, or `None` if there is none.

        Drafts are absent from the index, so a draft public identifier also returns `None`.
        """
        return self._project_details.get(public_identifier)

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
            public_identifier=entry.public_identifier,
            question=entry.question,
            category=entry.category,
            attachment=entry.attachment,
            answer_html=render_markdown_to_safe_html(entry.answer_markdown),
        )

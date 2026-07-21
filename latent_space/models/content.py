from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"

Slug = Annotated[
    str,
    Field(
        pattern=SLUG_PATTERN,
        description="Lowercase, hyphen-separated persistent identifier used in URLs.",
    ),
]


class Project(BaseModel):
    """A portfolio project loaded from a Markdown-with-frontmatter file.

    Frontmatter carries the metadata; the Markdown body becomes `body_markdown`.
    `slug` is the persistent public identifier and must equal the source file's
    stem - the loader enforces this so filenames and URLs cannot drift apart.
    Instances may be drafts; excluding drafts from published output is the
    content service's responsibility, not this model's. Unknown frontmatter keys
    are rejected so a typo fails loudly at load time instead of being ignored.
    """

    model_config = ConfigDict(extra="forbid")

    slug: Slug
    title: str
    summary: str
    stack: list[str] = Field(
        default_factory=list,
        description="Technologies and tools the project is built with.",
    )
    tags: list[str] = Field(default_factory=list)
    repository_url: HttpUrl | None = None
    demo_url: HttpUrl | None = None
    cover_image: str | None = None
    draft: bool = False
    published_at: date
    updated_at: date | None = None
    body_markdown: str = Field(description="Markdown source of the project description.")


class ProjectSummary(BaseModel):
    """Project as returned in list responses: metadata without the body.

    Drafts are excluded before this projection is built, so it carries no
    `draft` flag.
    """

    slug: str
    title: str
    summary: str
    stack: list[str]
    tags: list[str]
    repository_url: HttpUrl | None
    demo_url: HttpUrl | None
    cover_image: str | None
    published_at: date
    updated_at: date | None


class ProjectDetail(ProjectSummary):
    """Single-project response: the summary fields plus the rendered body."""

    body_html: str = Field(description="Sanitized HTML rendered from the Markdown body.")


class ChatEntry(BaseModel):
    """A preset question and its authored answer for the scripted chat.

    Authored as content (frontmatter question/metadata, Markdown-body answer)
    rather than inline component strings, so a later retrieval- or LLM-backed
    mode can reuse the same questions and answers without touching the UI.
    `order` gives a deterministic display sequence within the chat.
    """

    model_config = ConfigDict(extra="forbid")

    slug: Slug
    question: str
    category: str
    order: int = Field(ge=0, description="Ascending display order within the chat.")
    draft: bool = False
    answer_markdown: str = Field(description="Markdown source of the authored answer.")


class ChatEntryResponse(BaseModel):
    """Chat entry as returned by the API: the answer rendered to safe HTML."""

    slug: str
    question: str
    category: str
    answer_html: str = Field(description="Sanitized HTML rendered from the answer Markdown.")

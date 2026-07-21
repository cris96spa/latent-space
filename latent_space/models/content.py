from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

PUBLIC_IDENTIFIER_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"

PublicIdentifier = Annotated[
    str,
    Field(
        pattern=PUBLIC_IDENTIFIER_PATTERN,
        description="Lowercase, hyphen-separated persistent identifier used in URLs.",
    ),
]

# A rich, non-text widget rendered beneath a chat answer. Declared in the answer's
# frontmatter so the mapping lives with the content, not in the frontend.
AnswerAttachment = Literal["resume", "ablation-sweep"]


class Project(BaseModel):
    """A portfolio project loaded from a Markdown-with-frontmatter file.

    Frontmatter carries the metadata; the Markdown body becomes `body_markdown`.
    `public_identifier` is the persistent public identifier: the loader derives it from the
    source file's stem rather than the frontmatter, so the filename and the URL
    are one thing and cannot drift apart. Instances may be drafts; excluding
    drafts from published output is the content service's responsibility, not
    this model's. Unknown frontmatter keys are rejected so a typo fails loudly at
    load time instead of being ignored.
    """

    model_config = ConfigDict(extra="forbid")

    public_identifier: PublicIdentifier
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

    public_identifier: PublicIdentifier
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


class Post(BaseModel):
    """An outbound link to writing published elsewhere (Substack).

    A "link post": metadata only, no Markdown body. The canonical text lives at
    `external_url`, so there is no `body_markdown` and no detail projection.
    `public_identifier` is derived from the source file's stem by the loader, exactly as
    for `Project`, so the filename and the URL cannot drift apart. Instances may be
    drafts; excluding drafts is the content service's responsibility. Unknown frontmatter
    keys are rejected so a typo fails loudly at load time.
    """

    model_config = ConfigDict(extra="forbid")

    public_identifier: PublicIdentifier
    title: str
    summary: str
    external_url: HttpUrl = Field(description="Absolute URL of the post on its host (Substack).")
    tags: list[str] = Field(default_factory=list)
    cover_image: str | None = None
    draft: bool = False
    published_at: date
    updated_at: date | None = None


class PostSummary(BaseModel):
    """Post as returned in list responses: metadata for a card.

    Drafts are excluded before this projection is built, so it carries no `draft` flag.
    There is no post-detail projection: a link post's body lives at `external_url`.
    """

    public_identifier: PublicIdentifier
    title: str
    summary: str
    external_url: HttpUrl
    tags: list[str]
    cover_image: str | None
    published_at: date
    updated_at: date | None


class ChatEntry(BaseModel):
    """A preset question and its authored answer for the scripted chat.

    Authored as content (frontmatter question/metadata, Markdown-body answer)
    rather than inline component strings, so a later retrieval- or LLM-backed
    mode can reuse the same questions and answers without touching the UI.
    `public_identifier` is derived from the filename stem by the loader, as for `Project`.
    `order` gives a deterministic display sequence within the chat.
    """

    model_config = ConfigDict(extra="forbid")

    public_identifier: PublicIdentifier
    question: str
    category: str
    attachment: AnswerAttachment | None = Field(
        default=None,
        description="Rich widget rendered beneath the answer, e.g. the resume viewer.",
    )
    order: int = Field(ge=0, description="Ascending display order within the chat.")
    draft: bool = False
    answer_markdown: str = Field(description="Markdown source of the authored answer.")


class ChatEntryResponse(BaseModel):
    """Chat entry as returned by the API: the answer rendered to safe HTML."""

    public_identifier: PublicIdentifier
    question: str
    category: str
    attachment: AnswerAttachment | None = None
    answer_html: str = Field(description="Sanitized HTML rendered from the answer Markdown.")

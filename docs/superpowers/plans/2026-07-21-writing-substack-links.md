# Writing — Substack Link Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/writing` page that lists posts published on Substack as outbound link cards, authored through the existing content pipeline, shipping empty with an in-voice empty state.

**Architecture:** Mirror the projects pipeline, dropping its body/detail half. A `Post` is metadata only — title, summary, a required `external_url`, date, tags — loaded from `content/posts/*.md` frontmatter, validated by Pydantic, served at `GET /posts`, and rendered as a card grid whose cards link straight out to Substack. No Markdown body, no `PostDetail`, no detail route, no RSS.

**Tech Stack:** FastAPI + Pydantic + PyYAML (backend); Vite + React + TypeScript + React Router + Tailwind v4 (frontend); pytest (backend tests); Vitest in a Node env (frontend pure-logic tests).

## Global Constraints

- **Authored content, never inline component data.** Posts come from `content/posts/*.md`; no post data in components (CLAUDE.md).
- **Filename is the public identifier.** The loader derives `public_identifier` from the file stem; frontmatter declaring `public_identifier` must fail loudly (existing `_public_identifier_from_filename` rule).
- **Drafts never reach published output.** Exclusion is the content service's job.
- **Ruff line length 100; type every signature; Google-style docstrings; no module-level docstrings** (CLAUDE.md Python style).
- **Python changes must pass** `make format-check`, `make lint`, `make lint-doc`, `make test`.
- **Frontend changes must pass** `make fe-lint`, `make fe-test`, `make fe-build`.
- **CVD-safe:** never encode meaning in hue alone; external-link affordance uses the ↗ glyph (`&#8599;`) + underline, not colour. Check both light and dark themes.
- **Only pure logic is unit-tested on the frontend** (Node env); component/page correctness is verified by `fe-build` + `fe-lint`, not a DOM test (CLAUDE.md).
- **Substack URL is unknown:** wire the "Follow" affordance to a `TODO(content)` placeholder in `frontend/src/lib/links.ts`; do not invent a real publication URL.
- **Conventional Commits**; commit after each task. Do **not** push (Cristian manages his own git).

---

### Task 1: `Post` / `PostSummary` models and the post loader + sort

**Files:**
- Modify: `latent_space/models/content.py` (add `Post`, `PostSummary` after `ProjectDetail`)
- Modify: `latent_space/services/content.py` (import `Post`; add `load_posts_from_directory`, `sort_posts_newest_first`)
- Test: `tests/test_content_service.py` (add loader + sort tests)

**Interfaces:**
- Consumes: existing `parse_frontmatter_document`, `_public_identifier_from_filename`, `ContentLoadError`, `PublicIdentifier`, `CONTENT_FILE_SUFFIX`.
- Produces:
  - `Post` (Pydantic) with fields `public_identifier: PublicIdentifier`, `title: str`, `summary: str`, `external_url: HttpUrl`, `tags: list[str]`, `cover_image: str | None`, `draft: bool`, `published_at: date`, `updated_at: date | None`.
  - `PostSummary` (Pydantic): same fields minus `draft`.
  - `load_posts_from_directory(directory: Path) -> list[Post]`
  - `sort_posts_newest_first(posts: Iterable[Post]) -> list[Post]`

- [ ] **Step 1: Write the failing tests**

Add to `tests/test_content_service.py`. First extend the imports from `latent_space.models.content` and `latent_space.services.content`:

```python
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
```

Add a `Post` factory next to `_project` / `_chat`:

```python
def _post(public_identifier: str, published_at: date, *, draft: bool = False) -> Post:
    return Post(
        public_identifier=public_identifier,
        title=public_identifier,
        summary="summary",
        external_url="https://cris.substack.com/p/one",
        published_at=published_at,
        draft=draft,
    )
```

Add these tests (reuse the existing `_write_project_file` helper, which just writes a file into a subdirectory):

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `make test` (or `uv run pytest tests/test_content_service.py -v`)
Expected: FAIL — `ImportError` for `Post` / `load_posts_from_directory` / `sort_posts_newest_first`.

- [ ] **Step 3: Add the models**

In `latent_space/models/content.py`, insert after the `ProjectDetail` class (before `ChatEntry`):

```python
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
```

- [ ] **Step 4: Add the loader and sort**

In `latent_space/services/content.py`, extend the model import to include `Post`:

```python
from latent_space.models.content import (
    ChatEntry,
    ChatEntryResponse,
    Post,
    Project,
    ProjectDetail,
    ProjectSummary,
)
```

Add these two functions after `load_chat_entries_from_directory` (before `sort_projects_newest_first`):

```python
def load_posts_from_directory(directory: Path) -> list[Post]:
    """Load and validate every post file in `directory`.

    A post is a link to writing published elsewhere: frontmatter metadata only. Any
    Markdown body is ignored, since the canonical text lives at the post's `external_url`.
    Each post's public identifier is its filename stem (see `_public_identifier_from_filename`).

    Args:
        directory: Directory scanned for post Markdown files.

    Returns:
        The validated posts, including drafts; an empty list when the directory does not
        exist, since absent content is not an error.

    Raises:
        ContentLoadError: On a malformed file, a schema validation failure, or a
            frontmatter that declares its own `public_identifier`.
    """
    if not directory.is_dir():
        return []

    posts: list[Post] = []
    for path in sorted(directory.glob(f"*{CONTENT_FILE_SUFFIX}")):
        metadata, _ = parse_frontmatter_document(path.read_text(encoding="utf-8"))
        metadata["public_identifier"] = _public_identifier_from_filename(path, metadata)
        try:
            post = Post.model_validate(metadata)
        except ValidationError as error:
            raise ContentLoadError(f"invalid post content in '{path.name}': {error}") from error
        posts.append(post)
    return posts


def sort_posts_newest_first(posts: Iterable[Post]) -> list[Post]:
    """Order posts for display, most recently published first.

    Same ranking as projects: descending `published_at`, ties broken by ascending
    `public_identifier`, so the order is total and independent of filesystem iteration
    order.
    """
    by_public_identifier = sorted(posts, key=lambda post: post.public_identifier)
    return sorted(by_public_identifier, key=lambda post: post.published_at, reverse=True)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `make test`
Expected: PASS — the four new tests plus the existing suite.

- [ ] **Step 6: Run format, lint, and doc-lint**

Run: `make format-check && make lint && make lint-doc`
Expected: all pass. (If `make format-check` reports diffs, run `make format` and re-check.)

- [ ] **Step 7: Commit**

```bash
git add latent_space/models/content.py latent_space/services/content.py tests/test_content_service.py
git commit -m "feat(content): add Post model, loader, and newest-first sort"
```

---

### Task 2: Wire posts through `ContentService`, constants, and `from_content_root`

**Files:**
- Modify: `latent_space/constants.py` (add `POSTS_CONTENT_SUBDIRECTORY`)
- Modify: `latent_space/services/content.py` (`ContentService` constructor, `published_post_summaries`, `_to_post_summary`, `from_content_root`; import `PostSummary`, `POSTS_CONTENT_SUBDIRECTORY`)
- Modify: `tests/test_content_service.py` (update the existing service call site; add a posts service test)
- Modify: `tests/test_content_api.py` (update `_fixture_service` to the new constructor signature, with post fixtures for Task 3)

**Interfaces:**
- Consumes: `Post`, `PostSummary`, `load_posts_from_directory`, `sort_posts_newest_first` (Task 1).
- Produces:
  - `ContentService(projects: list[Project], chat_entries: list[ChatEntry], posts: list[Post])` — **note the new required third parameter**.
  - `ContentService.published_post_summaries() -> list[PostSummary]` (returns a copy, newest-first, drafts excluded).
  - Constant `POSTS_CONTENT_SUBDIRECTORY = "posts"`.

- [ ] **Step 1: Write the failing test**

In `tests/test_content_service.py`, add a `Post`-inclusive service test:

```python
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
```

Also update the **existing** `test_service_excludes_drafts_and_prerenders_html` to the new three-argument constructor — its call becomes:

```python
    service = ContentService(projects, chat_entries, [])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest tests/test_content_service.py::test_service_publishes_posts_newest_first_excluding_drafts -v`
Expected: FAIL — `ContentService` takes 2 positional args / has no `published_post_summaries`.

- [ ] **Step 3: Add the constant**

In `latent_space/constants.py`, add below `CHAT_CONTENT_SUBDIRECTORY`:

```python
POSTS_CONTENT_SUBDIRECTORY = "posts"
```

- [ ] **Step 4: Extend the service**

In `latent_space/services/content.py`, add imports:

```python
from latent_space.constants import (
    CHAT_CONTENT_SUBDIRECTORY,
    CONTENT_FILE_SUFFIX,
    POSTS_CONTENT_SUBDIRECTORY,
    PROJECTS_CONTENT_SUBDIRECTORY,
)
from latent_space.models.content import (
    ChatEntry,
    ChatEntryResponse,
    Post,
    PostSummary,
    Project,
    ProjectDetail,
    ProjectSummary,
)
```

Change the constructor signature and add the post projection at the end of `__init__`:

```python
    def __init__(
        self,
        projects: list[Project],
        chat_entries: list[ChatEntry],
        posts: list[Post],
    ) -> None:
        published_projects = sort_projects_newest_first(
            project for project in projects if not project.draft
        )
        self._project_summaries = [self._to_summary(project) for project in published_projects]
        self._project_details = {
            project.public_identifier: self._to_detail(project) for project in published_projects
        }
        published_chat = sort_chat_entries(entry for entry in chat_entries if not entry.draft)
        self._chat_responses = [self._to_chat_response(entry) for entry in published_chat]
        published_posts = sort_posts_newest_first(post for post in posts if not post.draft)
        self._post_summaries = [self._to_post_summary(post) for post in published_posts]
```

Update `from_content_root` to load posts and pass them:

```python
    @classmethod
    def from_content_root(cls, content_root: Path) -> "ContentService":
        """Load, validate, and build the service from a content root directory."""
        projects = load_projects_from_directory(content_root / PROJECTS_CONTENT_SUBDIRECTORY)
        chat_entries = load_chat_entries_from_directory(content_root / CHAT_CONTENT_SUBDIRECTORY)
        posts = load_posts_from_directory(content_root / POSTS_CONTENT_SUBDIRECTORY)
        return cls(projects, chat_entries, posts)
```

Add the accessor next to `published_project_summaries`:

```python
    def published_post_summaries(self) -> list[PostSummary]:
        return list(self._post_summaries)
```

Add the projection next to `_to_summary`:

```python
    @staticmethod
    def _to_post_summary(post: Post) -> PostSummary:
        return PostSummary.model_validate(post.model_dump(exclude={"draft"}))
```

- [ ] **Step 5: Update the API test fixture to the new signature**

In `tests/test_content_api.py`, extend the model import and add post fixtures so Task 3's endpoint test has data. Change the import line to:

```python
from latent_space.models.content import ChatEntry, Post, Project
```

Inside `_fixture_service`, before the `return`, add:

```python
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
```

- [ ] **Step 6: Run the backend suite and checks**

Run: `make test && make format-check && make lint && make lint-doc`
Expected: all pass, including the new service test and the updated existing test.

- [ ] **Step 7: Commit**

```bash
git add latent_space/constants.py latent_space/services/content.py tests/test_content_service.py tests/test_content_api.py
git commit -m "feat(content): publish posts through ContentService"
```

---

### Task 3: `GET /posts` endpoint and the `content/posts/` directory

**Files:**
- Modify: `latent_space/api/content.py` (add `list_posts`; import `PostSummary`)
- Create: `content/posts/.gitkeep` (empty; keeps the empty content directory in the tree)
- Test: `tests/test_content_api.py` (add `/posts` endpoint tests)

**Interfaces:**
- Consumes: `ContentService.published_post_summaries()` (Task 2), `PostSummary` (Task 1), existing `get_content_service` dependency.
- Produces: `GET /posts -> list[PostSummary]`, newest-first, drafts excluded, no `draft` field on the wire.

- [ ] **Step 1: Write the failing tests**

Add to `tests/test_content_api.py`:

```python
def test_list_posts_returns_published_newest_first(client: TestClient):
    response = client.get("/posts")

    assert response.status_code == 200
    public_identifiers = [post["public_identifier"] for post in response.json()]
    assert public_identifiers == ["second-epoch", "warm-start"]


def test_list_posts_omits_draft_field_and_exposes_external_url(client: TestClient):
    post = client.get("/posts").json()[0]

    assert "draft" not in post
    assert post["external_url"].startswith("https://cris.substack.com/p/")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run pytest tests/test_content_api.py -k posts -v`
Expected: FAIL — `GET /posts` returns 404 (route not registered).

- [ ] **Step 3: Add the endpoint**

In `latent_space/api/content.py`, extend the import and add the route. Import line becomes:

```python
from latent_space.models.content import PostSummary, ProjectDetail, ProjectSummary
```

Add after `list_projects` (before `get_project`):

```python
@router.get("/posts")
async def list_posts(
    service: Annotated[ContentService, Depends(get_content_service)],
) -> list[PostSummary]:
    """List published posts, most recently published first.

    Each post is an outbound link to writing hosted elsewhere (Substack); there is no
    detail route, so this list is the whole surface.
    """
    return service.published_post_summaries()
```

- [ ] **Step 4: Create the empty content directory**

```bash
mkdir -p content/posts
touch content/posts/.gitkeep
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `make test && make format-check && make lint && make lint-doc`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add latent_space/api/content.py tests/test_content_api.py content/posts/.gitkeep
git commit -m "feat(api): serve published posts at GET /posts"
```

---

### Task 4: `formatPublishDate` date helper (frontend, TDD)

**Files:**
- Create: `frontend/src/lib/formatDate.ts`
- Test: `frontend/src/lib/formatDate.test.ts`

**Interfaces:**
- Produces: `formatPublishDate(iso: string): string` — turns `YYYY-MM-DD` into `D Mon YYYY` (e.g. `21 Jul 2026`), time-zone-stable, throwing on malformed input.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/formatDate.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'

import { formatPublishDate } from './formatDate'

describe('formatPublishDate', () => {
  it('formats an ISO date as a short day-month-year label', () => {
    expect(formatPublishDate('2026-07-21')).toBe('21 Jul 2026')
    expect(formatPublishDate('2024-01-01')).toBe('1 Jan 2024')
    expect(formatPublishDate('2023-12-31')).toBe('31 Dec 2023')
  })

  it('keeps the calendar date regardless of time zone', () => {
    // `new Date("2026-01-01")` is UTC midnight and renders as 2025 in negative-offset
    // zones; parsing the fields directly avoids that off-by-one-day drift.
    expect(formatPublishDate('2026-01-01')).toBe('1 Jan 2026')
  })

  it('rejects input that is not exactly YYYY-MM-DD', () => {
    expect(() => formatPublishDate('2026-7-1')).toThrow()
    expect(() => formatPublishDate('July 21, 2026')).toThrow()
  })

  it('rejects an out-of-range month', () => {
    expect(() => formatPublishDate('2026-13-01')).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `make fe-test`
Expected: FAIL — cannot resolve `./formatDate`.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/lib/formatDate.ts`:

```typescript
const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/**
 * Formats an ISO `YYYY-MM-DD` date as a short, locale-independent label like `21 Jul 2026`.
 * The fields are parsed directly rather than through `new Date(iso)`, whose UTC-midnight
 * result renders as the previous day in negative-offset time zones. Throws on input that
 * is not exactly `YYYY-MM-DD` or whose month is out of range.
 */
export function formatPublishDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) {
    throw new Error(`Expected an ISO YYYY-MM-DD date, got '${iso}'.`)
  }
  const [, year, month, day] = match
  const monthLabel = MONTH_ABBREVIATIONS[Number(month) - 1]
  if (!monthLabel) {
    throw new Error(`Month out of range in date '${iso}'.`)
  }
  return `${Number(day)} ${monthLabel} ${year}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `make fe-test`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `make fe-lint`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/formatDate.ts frontend/src/lib/formatDate.test.ts
git commit -m "feat(frontend): add time-zone-stable publish-date formatter"
```

---

### Task 5: `Post` type and `getPosts` in the API client

**Files:**
- Modify: `frontend/src/lib/api.ts` (add `Post`, `PostWire`, `toPost`, `getPosts` after `getProject`)

**Interfaces:**
- Consumes: existing `fetchJson`.
- Produces:
  - `interface Post { publicIdentifier; title; summary; externalUrl: string; tags: readonly string[]; coverImage: string | null; publishedAt: string; updatedAt: string | null }`
  - `getPosts(): Promise<Post[]>` hitting `/posts`.

- [ ] **Step 1: Add the type, wire type, mapper, and fetch**

Append to `frontend/src/lib/api.ts` (after `getProject`):

```typescript
/** A published post: an outbound link to writing hosted elsewhere (Substack). */
export interface Post {
  readonly publicIdentifier: string
  readonly title: string
  readonly summary: string
  /** Absolute URL of the post on its host (Substack). */
  readonly externalUrl: string
  readonly tags: readonly string[]
  readonly coverImage: string | null
  /** ISO `YYYY-MM-DD`; the backend returns posts newest-first. */
  readonly publishedAt: string
  readonly updatedAt: string | null
}

/** Wire shape of a post: the backend serializes metadata in snake_case. */
interface PostWire {
  readonly public_identifier: string
  readonly title: string
  readonly summary: string
  readonly external_url: string
  readonly tags: readonly string[]
  readonly cover_image: string | null
  readonly published_at: string
  readonly updated_at: string | null
}

function toPost(wire: PostWire): Post {
  return {
    publicIdentifier: wire.public_identifier,
    title: wire.title,
    summary: wire.summary,
    externalUrl: wire.external_url,
    tags: wire.tags,
    coverImage: wire.cover_image,
    publishedAt: wire.published_at,
    updatedAt: wire.updated_at,
  }
}

/** Fetches the published posts, most recently published first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await fetchJson<PostWire[]>('/posts')
  return posts.map(toPost)
}
```

- [ ] **Step 2: Type-check and lint**

Run: `make fe-lint && make fe-build`
Expected: both pass (build runs `tsc`, so unused/incorrect types fail here).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add Post type and getPosts API client"
```

---

### Task 6: `PostCard` component

**Files:**
- Create: `frontend/src/features/writing/PostCard.tsx`

**Interfaces:**
- Consumes: `Post` (Task 5), `formatPublishDate` (Task 4), existing `Card`, `TextLink`, `TokenChip`.
- Produces: `PostCard({ post }: { post: Post })`.

- [ ] **Step 1: Write the component**

Create `frontend/src/features/writing/PostCard.tsx`:

```tsx
import { Card } from '../../components/Card'
import { TextLink } from '../../components/TextLink'
import { TokenChip } from '../../components/TokenChip'
import type { Post } from '../../lib/api'
import { formatPublishDate } from '../../lib/formatDate'

/**
 * One post on the writing index. The canonical post lives on Substack, so the whole card
 * points outward: the title and the footer link both open the post in a new tab, and there
 * is no internal detail route. The out-link carries an ↗ glyph (a shape, not a colour) so
 * the external affordance survives red-green colour-vision deficiency, and is pinned to the
 * bottom with `mt-auto` so cards keep a common baseline in the grid.
 */
export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex h-full flex-col gap-4 transition-colors hover:border-brand-300">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">
          <a
            href={post.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-fg transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            {post.title}
          </a>
        </h3>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <time dateTime={post.publishedAt}>{formatPublishDate(post.publishedAt)}</time>
        </p>
        <p className="text-sm text-muted">{post.summary}</p>
      </div>

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {post.tags.map((tag) => (
            <li key={tag}>
              <TokenChip tone="neutral">{tag}</TokenChip>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-1">
        <TextLink
          href={post.externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm no-underline hover:underline"
        >
          Read on Substack <span aria-hidden="true">&#8599;</span>
        </TextLink>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Lint and build**

Run: `make fe-lint && make fe-build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/writing/PostCard.tsx
git commit -m "feat(frontend): add PostCard for outbound Substack posts"
```

---

### Task 7: `WritingPage`, route, nav link, and Substack link constant

**Files:**
- Modify: `frontend/src/lib/links.ts` (add `substack` placeholder to `EXTERNAL_LINKS`)
- Create: `frontend/src/pages/WritingPage.tsx`
- Modify: `frontend/src/App.tsx` (import `WritingPage`; add `writing` route)
- Modify: `frontend/src/components/Header.tsx` (add the "Writing" nav link)

**Interfaces:**
- Consumes: `getPosts`, `Post` (Task 5), `PostCard` (Task 6), existing `Button`, `TextLink`, `EXTERNAL_LINKS`.
- Produces: `WritingPage()` component; a `/writing` route; a "Writing" header link.

- [ ] **Step 1: Add the Substack placeholder link**

In `frontend/src/lib/links.ts`, add inside `EXTERNAL_LINKS` (after `chinchillaPaper`):

```typescript
  // TODO(content): Cristian's Substack publication does not exist yet. This points at
  // Substack's home so the "Follow" affordance is never dead; replace with the real
  // publication URL (e.g. https://<name>.substack.com) when it exists.
  substack: 'https://substack.com/',
```

- [ ] **Step 2: Create the page**

Create `frontend/src/pages/WritingPage.tsx`:

```tsx
import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { TextLink } from '../components/TextLink'
import { PostCard } from '../features/writing/PostCard'
import { getPosts, type Post } from '../lib/api'
import { EXTERNAL_LINKS } from '../lib/links'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly posts: readonly Post[] }
  | { readonly status: 'error' }

/**
 * The writing index: outbound cards for posts published on Substack, loaded from the
 * content API. No hard-coded post data and no local detail route (CLAUDE.md) - each card
 * links out. Ships empty by design; the empty state is the launch state and reads as
 * intentional, inviting the visitor to subscribe. Loading, error, and empty states are in
 * voice.
 */
export function WritingPage() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setLoad({ status: 'loading' })
    getPosts()
      .then((posts) => {
        if (active) {
          setLoad({ status: 'ready', posts })
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  return (
    <section className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          training logs
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Writing</h1>
        <p className="text-muted">
          Notes from the lab notebook &mdash; training runs, papers I couldn&rsquo;t stop thinking
          about, and the occasional LLM tangent. Published on Substack; the good bits land there
          first.
        </p>
        <p>
          <TextLink href={EXTERNAL_LINKS.substack} target="_blank" rel="noreferrer noopener">
            Follow on Substack <span aria-hidden="true">&#8599;</span>
          </TextLink>
        </p>
      </header>

      {load.status === 'loading' && <p className="text-muted">Loading the notebook&hellip;</p>}

      {load.status === 'error' && (
        <div className="space-y-3">
          <p className="text-muted">
            The posts didn&rsquo;t load &mdash; the content service might still be warming up.
          </p>
          <Button variant="ghost" onClick={() => setReloadToken((token) => token + 1)}>
            Retry
          </Button>
        </div>
      )}

      {load.status === 'ready' && load.posts.length === 0 && (
        <p className="max-w-2xl text-muted">
          Nothing published yet &mdash; the first post is still overfitting to my drafts folder.
          Subscribe above and you&rsquo;ll catch it on the first epoch.
        </p>
      )}

      {load.status === 'ready' && load.posts.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {load.posts.map((post) => (
            <li key={post.publicIdentifier}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Register the route**

In `frontend/src/App.tsx`, add the import (alphabetical, after `ResumePage`)... actually place it so imports stay sorted:

```tsx
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ResumePage } from './pages/ResumePage'
import { WritingPage } from './pages/WritingPage'
```

Add the route after the resume route:

```tsx
        <Route path="resume" element={<ResumePage />} />
        <Route path="writing" element={<WritingPage />} />
```

- [ ] **Step 4: Add the nav link**

In `frontend/src/components/Header.tsx`, add between the Projects and Resume links:

```tsx
          <Link
            to="/writing"
            className="font-medium text-fg transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            Writing
          </Link>
```

- [ ] **Step 5: Lint, test, and build**

Run: `make fe-lint && make fe-test && make fe-build`
Expected: all pass.

- [ ] **Step 6: Manual check in both themes**

Run: `make fe-dev` (and the backend via `make serve` in another shell), open `/writing`.
Confirm: the empty state renders with the "Follow on Substack" link, nav "Writing" link works and highlights, layout holds on a narrow viewport, and focus rings + the ↗ affordance are visible in **both** light and dark themes.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/links.ts frontend/src/pages/WritingPage.tsx frontend/src/App.tsx frontend/src/components/Header.tsx
git commit -m "feat(frontend): add Writing page, route, and nav link"
```

---

### Task 8: Update task status and spec status

**Files:**
- Modify: `tasks/12-blog-pipeline.md` (Status → Done; note the reshaped scope)
- Modify: `docs/superpowers/specs/2026-07-21-writing-substack-links-design.md` (Status → Implemented)

**Interfaces:** none (documentation only).

- [ ] **Step 1: Update the task file**

In `tasks/12-blog-pipeline.md`, change `**Status:** Not started` to `**Status:** Done`, and add a short note under the Goal that the task was reshaped: implemented as a Substack link-card index (no local bodies, detail pages, syntax highlighting, or RSS), shipped empty by decision; see `docs/superpowers/specs/2026-07-21-writing-substack-links-design.md`.

- [ ] **Step 2: Update the spec status**

In the spec file, change `**Status:** Design approved, awaiting implementation` to `**Status:** Implemented`.

- [ ] **Step 3: Full verification gate**

Run: `make format-check && make lint && make lint-doc && make test && make fe-lint && make fe-test && make fe-build`
Expected: everything passes — the whole feature, end to end.

- [ ] **Step 4: Commit**

```bash
git add tasks/12-blog-pipeline.md docs/superpowers/specs/2026-07-21-writing-substack-links-design.md
git commit -m "docs: mark blog pipeline task done as Substack link index"
```

---

## Self-Review

**Spec coverage:**
- Backend `Post`/`PostSummary` models → Task 1 ✓
- Loader + newest-first sort → Task 1 ✓
- `ContentService` integration, drafts excluded, `POSTS_CONTENT_SUBDIRECTORY`, `from_content_root` → Task 2 ✓
- `GET /posts` (no `/posts/{id}`) → Task 3 ✓
- `content/posts/` directory, ships empty → Task 3 ✓
- Frontend `Post` type + `getPosts` → Task 5 ✓
- `PostCard` external-link card → Task 6 ✓
- `WritingPage` + empty/error/loading states + Follow CTA → Task 7 ✓
- Route + nav link → Task 7 ✓
- Substack `TODO(content)` placeholder → Task 7 (in `links.ts`) ✓
- `formatPublishDate` helper with hand-computed test → Task 4 ✓
- Backend service/API tests → Tasks 1–3 ✓
- CVD-safe external affordance, both themes → Tasks 6–7 ✓
- Dropped detail/markdown/reading-time/RSS → not built (spec "Explicitly dropped") ✓

**Placeholder scan:** The only `TODO` is the sanctioned `TODO(content)` Substack URL (CLAUDE.md pattern), not a plan gap. No "TBD"/"implement later"/vague steps.

**Type consistency:** `ContentService(projects, chat_entries, posts)` (3 args) is used consistently in Tasks 2 (definition + both test call sites) and its fixtures. `published_post_summaries`, `_to_post_summary`, `load_posts_from_directory`, `sort_posts_newest_first`, `PostSummary`, `Post`, `getPosts`, `toPost`, `PostWire`, `formatPublishDate`, `EXTERNAL_LINKS.substack` names match across the tasks that define and consume them. Frontend `Post.externalUrl`/`coverImage` ↔ wire `external_url`/`cover_image` mapping is symmetric in `toPost`.

# Writing — Substack link cards (task 12, reshaped)

**Date:** 2026-07-21
**Task:** [12 — Blog pipeline](../../../tasks/12-blog-pipeline.md) *(stretch)*
**Status:** Implemented

## Summary

Task 12 imagined a full local blog: a `Post` schema with a Markdown body, a loader,
an index *and* a detail page rendering sanitized rich text with syntax highlighting,
reading-time helpers, and an RSS feed. Cristian will instead publish on **Substack**, so
the canonical post — body, code, comments, feed — lives there.

What this site needs is therefore not a blog engine but a **writing index of outbound
link cards**: title, summary, date, and a Substack URL, authored the same way projects
are. No local body, no detail route, no Markdown rendering, no syntax highlighting, no
RSS (Substack emits its own). This is a deliberate, smaller reshaping of task 12, not the
task as written; the task file's acceptance criteria that assume local bodies do not
apply.

It launches **empty**: the machinery ships, zero posts are published, and the page shows
a confident in-voice empty state plus a "Follow on Substack" call to action.

## Product decisions (confirmed with Cristian)

- **Placement:** dedicated `/writing` page with its own nav link, mirroring Projects.
- **Name:** "Writing" (nav label and heading).
- **Launch state:** ship empty with an in-voice empty state; nav link and page live now.
- **Substack URL:** not yet available — CTA wires to a `TODO(content)` placeholder.

## Backend

Mirror the projects pipeline, dropping the body/detail half.

### Model — `latent_space/models/content.py`

```python
class Post(BaseModel):
    """An outbound link to a post published elsewhere (Substack).

    A "link post": all metadata, no body. The canonical text lives at `external_url`,
    so there is no `body_markdown` and no detail projection. `public_identifier` is
    derived from the filename stem by the loader, exactly as for `Project`.
    """
    model_config = ConfigDict(extra="forbid")

    public_identifier: PublicIdentifier
    title: str
    summary: str
    external_url: HttpUrl                       # required: a link post needs its link
    tags: list[str] = Field(default_factory=list)
    cover_image: str | None = None
    draft: bool = False
    published_at: date
    updated_at: date | None = None


class PostSummary(BaseModel):
    """Post as returned by the API: metadata for a card. Drafts already excluded."""
    public_identifier: PublicIdentifier
    title: str
    summary: str
    external_url: HttpUrl
    tags: list[str]
    cover_image: str | None
    published_at: date
    updated_at: date | None
```

No `PostDetail`, no `body_html`.

### Service — `latent_space/services/content.py`

- `load_posts_from_directory(directory) -> list[Post]`: same frontmatter parser and
  filename-as-identifier rule as projects; returns `[]` for a missing directory (so the
  empty launch is free). Unlike projects, does **not** attach a `body_markdown`.
- `sort_posts_newest_first(posts)`: descending `published_at`, ties broken by ascending
  `public_identifier` — identical ordering contract to `sort_projects_newest_first`.
- `ContentService`: also load `content/posts/`, exclude drafts, store
  `_post_summaries`; expose `published_post_summaries() -> list[PostSummary]` returning a
  copy. `from_content_root` loads posts alongside projects and chat.

### API — `latent_space/api/content.py`

- `GET /posts` → `list[PostSummary]`, newest first. No `/posts/{id}` (nothing to render;
  the card links straight to Substack).

### Constants — `latent_space/constants.py`

- `POSTS_CONTENT_SUBDIRECTORY = "posts"`.

### Content — `content/posts/`

- Create the directory. Ships with no published files (an empty `.gitkeep` if the tree
  needs the directory tracked). Authoring a post later is a metadata-only frontmatter
  file with no body.

## Frontend

### API layer — `frontend/src/lib/api.ts`

- `Post` type (camelCase), `PostWire` type (snake_case), `toPost` mapper, and
  `getPosts(): Promise<Post[]>` hitting `/posts`. Mirrors the project equivalents.

### Card — `frontend/src/features/writing/PostCard.tsx`

- Like `ProjectCard`, but the title is an **external** anchor (`target="_blank"`,
  `rel="noreferrer noopener"`) to `post.externalUrl`, not an internal `<Link>`.
- Shows: title (external link), summary, tags as `TokenChip`s, a formatted publish date,
  and a small "Read on Substack ↗" out-link pinned to the bottom (`mt-auto`) — an
  external glyph, not the GitHub mark.
- Cover image is out of scope for the first cut (no post exists to carry one); the schema
  keeps the field for later.

### Page — `frontend/src/pages/WritingPage.tsx`

- Route `/writing`; same `LoadState` machine as `ProjectsPage`.
- Header: an ML-native eyebrow (e.g. `training logs`), an `<h1>Writing</h1>`, and an
  in-voice intro.
- Loading / error / empty states in voice. The empty state is the launch state and must
  read as intentional, not broken — it invites the visitor to follow on Substack.
- A "Follow on Substack" `TextLink` (present in every state, including empty). Its href is
  a `TODO(content)` placeholder until the real publication URL exists.

### Routing & nav

- Add `<Route path="writing" element={<WritingPage />} />` in `App.tsx`.
- Add a "Writing" nav link in `Header.tsx`, between Projects and Resume.

## Accessibility & tokens

- Semantic list/heading structure, visible focus, WCAG AA contrast, both themes checked.
- External links carry a non-hue affordance (the ↗ glyph + underline-on-hover), never
  colour alone — Cristian has red-green CVD.
- Styled entirely from existing `index.css` tokens; no new palette entries.

## Date formatting

- A small `formatPublishDate(iso: string): string` helper in `frontend/src/lib/` turning
  an ISO `YYYY-MM-DD` into a human label (e.g. `Jul 2026`). Pure and co-located with a
  `*.test.ts` asserting hand-computed outputs (CLAUDE.md calculation-bearing code). If
  ProjectCard would benefit from the same format later, it can adopt the helper; this
  spec does not change ProjectCard.

## Testing

- **Backend:** extend `tests/test_content_service.py` (post loading, draft exclusion,
  newest-first ordering, missing-directory → empty) and `tests/test_content_api.py`
  (`GET /posts` shape and ordering via the test client with a dependency override).
- **Frontend:** `formatPublishDate` unit test (Vitest, Node env). No DOM/component test
  is added unless the card logic grows beyond presentation.

## Explicitly dropped from task 12

Post detail pages, Markdown/`body_html` rendering, syntax highlighting, reading-time
helpers, and RSS/Atom — all redundant when the canonical post lives on Substack and this
surface is a link index.

## Out of scope

Comments, CMS, likes, analytics, LLM-generated posts, and any change to the projects or
chat pipelines beyond the shared parser/service they already expose.

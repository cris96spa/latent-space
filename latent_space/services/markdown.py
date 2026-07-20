import nh3
from markdown_it import MarkdownIt

_ALLOWED_HTML_TAGS = {
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "del",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
}

_ALLOWED_HTML_ATTRIBUTES = {"a": {"href", "title"}}

_MARKDOWN_RENDERER = MarkdownIt("commonmark", {"html": False, "linkify": False})


def render_markdown_to_safe_html(markdown_text: str) -> str:
    """Render authored Markdown to sanitized HTML.

    This is the single controlled pipeline for authored rich text (CLAUDE.md
    content conventions), so the sanitization allowlist lives in one place. Two
    steps run for defense in depth: the renderer is configured with
    `html=False`, so raw HTML in the source is escaped rather than emitted (and
    its default link validation refuses `javascript:`/`data:` URLs); the output
    then passes through an `nh3` allowlist that guarantees only the formatting
    tags in `_ALLOWED_HTML_TAGS` — and, for links, only `href`/`title` — can
    reach the browser even if the renderer's behavior changes.
    """
    rendered_html = _MARKDOWN_RENDERER.render(markdown_text)
    return nh3.clean(
        rendered_html,
        tags=_ALLOWED_HTML_TAGS,
        attributes=_ALLOWED_HTML_ATTRIBUTES,
    )

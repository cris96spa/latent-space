from latent_space.services.markdown import render_markdown_to_safe_html


def test_renders_basic_formatting_to_html():
    html = render_markdown_to_safe_html("**bold** and *italic* and `code`")

    assert "<strong>bold</strong>" in html
    assert "<em>italic</em>" in html
    assert "<code>code</code>" in html


def test_renders_lists_and_headings():
    html = render_markdown_to_safe_html("## Heading\n\n- one\n- two\n")

    assert "<h2>Heading</h2>" in html
    assert "<ul>" in html
    assert html.count("<li>") == 2


def test_escapes_raw_html_instead_of_emitting_it():
    html = render_markdown_to_safe_html("hello <script>alert('x')</script> world")

    assert "<script" not in html
    assert "hello" in html
    assert "world" in html


def test_drops_javascript_scheme_from_link_href():
    html = render_markdown_to_safe_html("[click me](javascript:alert(1))")

    assert 'href="javascript:' not in html


def test_preserves_safe_http_link_href():
    html = render_markdown_to_safe_html("[gh](https://github.com/cris96spa)")

    assert 'href="https://github.com/cris96spa"' in html

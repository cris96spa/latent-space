import tiktoken

from latent_space.services.tokenizer import TokenizerService

SERVICE = TokenizerService(tiktoken.get_encoding("gpt2"))


def test_tokenizes_the_hero_prompt_with_real_gpt2_ids():
    result = SERVICE.tokenize("Who is Cristian?")

    assert result.token_count == 5
    assert result.word_count == 3
    assert result.char_count == 16
    assert [(span.id, span.text) for span in result.tokens] == [
        (8241, "Who"),
        (318, " is"),
        (24568, " Crist"),
        (666, "ian"),
        (30, "?"),
    ]


def test_empty_text_yields_no_tokens_and_zero_counts():
    result = SERVICE.tokenize("")

    assert result.tokens == []
    assert (result.token_count, result.word_count, result.char_count) == (0, 0, 0)


def test_emoji_split_across_tokens_stays_lossless():
    # "a" then the hammer-and-wrench emoji, which GPT-2 has no single token for and
    # so spells out as several byte-level tokens (none valid UTF-8 on their own).
    text = "a \U0001f6e0️"
    encoding = tiktoken.get_encoding("gpt2")

    result = SERVICE.tokenize(text)

    # Every real token id is exposed, and the per-token text rejoins to the original.
    assert result.token_count == len(encoding.encode(text))
    assert "".join(span.text for span in result.tokens) == text
    # The emoji's continuation bytes carry no character of their own.
    assert any(span.text == "" for span in result.tokens)

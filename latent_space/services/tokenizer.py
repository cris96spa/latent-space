import tiktoken

from latent_space.models.tokenizer import TokenizeResponse, TokenSpan


class TokenizerService:
    """Tokenizes text with a GPT-2 byte-level BPE encoding.

    Exposes the real token ids and a lossless per-token character mapping so callers
    can render both the integer ids and readable text without ever fabricating a
    token GPT-2 does not have.
    """

    def __init__(self, encoding: tiktoken.Encoding) -> None:
        self._encoding = encoding

    def tokenize(self, text: str) -> TokenizeResponse:
        """Encode `text` and return its tokens, ids, and counts.

        Args:
            text: Arbitrary text; special-token strings are treated as ordinary text.

        Returns:
            The per-token spans and the token, word, and character counts.
        """
        # disallowed_special=() so a literal "<|endoftext|>" in the input tokenizes as
        # ordinary bytes instead of raising, which a public endpoint must not do.
        token_ids = self._encoding.encode(text, disallowed_special=())
        spans = self._attribute_characters_to_tokens(text, token_ids)
        return TokenizeResponse(
            tokens=spans,
            token_count=len(token_ids),
            word_count=len(text.split()),
            char_count=len(text),
        )

    def _attribute_characters_to_tokens(self, text: str, token_ids: list[int]) -> list[TokenSpan]:
        """Attribute each whole character to the token holding its first byte.

        Byte-level BPE can split one character across several tokens. Rather than
        decode tokens individually (which yields invalid UTF-8 fragments), each
        character is assigned to the token whose byte range contains the character's
        first byte. The result is lossless: joining every span's text reproduces `text`.

        Args:
            text: The original text being tokenized.
            token_ids: The GPT-2 token ids `text` encodes to, in order.

        Returns:
            One `TokenSpan` per token id, in order, whose texts join back to `text`.
        """
        token_byte_ends: list[int] = []
        running_bytes = 0
        for token_id in token_ids:
            running_bytes += len(self._encoding.decode_single_token_bytes(token_id))
            token_byte_ends.append(running_bytes)

        span_texts = ["" for _ in token_ids]
        token_index = 0
        character_byte_offset = 0
        for character in text:
            while (
                token_index < len(token_byte_ends)
                and token_byte_ends[token_index] <= character_byte_offset
            ):
                token_index += 1
            span_texts[token_index] += character
            character_byte_offset += len(character.encode("utf-8"))

        return [TokenSpan(id=token_id, text=span_texts[i]) for i, token_id in enumerate(token_ids)]

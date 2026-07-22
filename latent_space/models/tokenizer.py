from pydantic import BaseModel, ConfigDict, Field

# Anti-abuse guardrail on a public POST endpoint, not a content limit: the only
# caller sends the fixed prompt (16 chars) and bio (~600 chars), so this is never
# reached in normal use. It only stops a hand-crafted multi-megabyte body.
MAX_TOKENIZE_INPUT_CHARS = 8000


class TokenizeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(
        max_length=MAX_TOKENIZE_INPUT_CHARS,
        description="Text to tokenize with GPT-2 byte-level BPE.",
    )


class TokenSpan(BaseModel):
    """One GPT-2 token: its id and the characters attributed to it.

    `text` is empty for a token that holds only continuation bytes of a multi-byte
    character (e.g. part of an emoji); that character is attributed to the token
    holding its first byte, keeping the joined text lossless.
    """

    model_config = ConfigDict(frozen=True)

    id: int = Field(description="GPT-2 byte-level BPE token id.")
    text: str = Field(description="Characters attributed to this token; empty for a continuation.")


class TokenizeResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    tokens: list[TokenSpan]
    token_count: int = Field(description="Number of GPT-2 tokens.")
    word_count: int = Field(description="Whitespace-separated word count.")
    char_count: int = Field(description="Unicode code-point length of the input.")

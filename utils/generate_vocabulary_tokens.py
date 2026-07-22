import json
import logging
from pathlib import Path

import tiktoken

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent
LABELS_PATH = REPO_ROOT / "frontend/src/features/vocabulary/vocabulary.labels.json"
OUTPUT_PATH = REPO_ROOT / "frontend/src/features/vocabulary/tokens.ts"
ENCODING_NAME = "gpt2"
REGENERATE_COMMAND = "uv run python utils/generate_vocabulary_tokens.py"


def load_labels(path: Path) -> list[str]:
    """Read the authored label list, failing loudly if it is not a JSON string array.

    Args:
        path: Location of the authored `vocabulary.labels.json`.

    Returns:
        The labels in file order.

    Raises:
        ValueError: If the file does not contain a JSON array of strings.
    """
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
        raise ValueError(f"{path} must contain a JSON array of strings")
    return raw


def encode_labels(labels: list[str], encoding: tiktoken.Encoding) -> list[tuple[str, list[int]]]:
    """Encode each label to GPT-2 token IDs, asserting a lossless round-trip per label.

    Args:
        labels: The authored labels, in order.
        encoding: The GPT-2 tiktoken encoding used to tokenize each label.

    Returns:
        Pairs of each label and its token IDs, in the same order as `labels`.

    Raises:
        ValueError: If a label encodes to no tokens or does not round-trip back to itself.
    """
    encoded: list[tuple[str, list[int]]] = []
    for label in labels:
        ids = encoding.encode(label)
        if not ids:
            raise ValueError(f"Label {label!r} encoded to an empty token sequence")
        if encoding.decode(ids) != label:
            raise ValueError(f"Round-trip mismatch for label {label!r}")
        encoded.append((label, ids))
    return encoded


def render_typescript(encoded: list[tuple[str, list[int]]]) -> str:
    """Render the generated `tokens.ts` source from encoded labels, preserving order."""
    lines = [
        "// GENERATED FILE - do not edit by hand.",
        f"// Regenerate with: {REGENERATE_COMMAND}",
        "// Source of truth: frontend/src/features/vocabulary/vocabulary.labels.json",
        '// IDs are the GPT-2 (124M) byte-level BPE encoding via tiktoken\'s "gpt2".',
        "",
        "export interface VocabularyToken {",
        "  readonly label: string",
        "  readonly ids: readonly number[]",
        "}",
        "",
        "export const VOCABULARY_TOKENS: readonly VocabularyToken[] = [",
    ]
    for label, ids in encoded:
        literal = label.replace("\\", "\\\\").replace("'", "\\'")
        id_list = ", ".join(str(token_id) for token_id in ids)
        lines.append(f"  {{ label: '{literal}', ids: [{id_list}] }},")
    lines.append("]")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    """Regenerate `tokens.ts` from the authored label list."""
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    labels = load_labels(LABELS_PATH)
    encoding = tiktoken.get_encoding(ENCODING_NAME)
    encoded = encode_labels(labels, encoding)
    OUTPUT_PATH.write_text(render_typescript(encoded), encoding="utf-8")
    logger.info("Wrote %d vocabulary tokens to %s", len(encoded), OUTPUT_PATH)


if __name__ == "__main__":
    main()

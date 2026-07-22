# Vocabulary token encoding toggle — design

Date: 2026-07-22

## Summary

The home page "vocabulary" section renders Cristian's skills and tooling as monospace
token chips ("The tokens in my vocabulary"). This adds a **"For Humans" / "For LLMs" toggle**
over that grid. In the default "For Humans" view each chip shows the word as today. In the
"For LLMs" view each chip shows the **real GPT-2 BPE token IDs** for that word — the integer
vector an LLM actually consumes (for example `Hugging Face → 48098 2667 15399`).

The IDs are precomputed offline from a fixed authored label list, committed as generated
data, and kept honest by a pre-commit hook that recomputes them whenever the list changes.
Nothing tokenizes in the browser.

## Motivation

The site's premise is showing what a PDF resume cannot: the same content a human reads and
the representation a model sees. The vocabulary grid already leans on the token metaphor;
this makes the metaphor literal and checkable. It also reinforces the deliberate decision in
`features/forward-pass-hero/tokenize.ts` not to ship the 50k tokenizer — we show real IDs
without shipping the encoder, because the vocabulary is a small fixed set we can precompute.

## Goals

- Toggle the vocabulary grid between human strings and real GPT-2 token IDs.
- Token IDs are the authoritative GPT-2 124M BPE encoding, reproducible and checkable.
- Editing the vocabulary list recomputes the IDs automatically; the two never drift.
- Keyboard-accessible, `prefers-reduced-motion`-aware, CVD-safe, and readable with no JS.
- No tokenizer, BPE merges, or 50k vocabulary shipped to the browser bundle.

## Non-goals

- No live/browser tokenization. No embedding vectors (the 768-dim `wte` rows) — IDs only.
- No change to the skills-radar, the forward-pass hero, or the chat section.
- No general-purpose "tokenize arbitrary text" widget. The set is the authored vocabulary.

## Architecture

### Module layout

A new feature module `frontend/src/features/vocabulary/`, mirroring the existing
`chat/`, `forward-pass-hero/`, and `skills-radar/` feature modules:

```
frontend/src/features/vocabulary/
  vocabulary.labels.json      # AUTHORED. Plain ["Python", "Java", ...] string array.
  tokens.ts                   # GENERATED, do-not-edit. { label, ids }[] the UI imports.
  VocabularySection.tsx       # Section: eyebrow, heading, toggle, chip grid, skills radar.
  index.ts                    # Barrel -> VocabularySection.
  tokens.data.test.ts         # Node: generated data matches labels, IDs in range.
  VocabularySection.test.tsx  # jsdom: toggle behaviour + axe.
```

`utils/generate_vocabulary_tokens.py` — the Python generator, alongside the existing repo
tooling scripts (`utils/post_checkout.py`, `utils/release.py`, ...).

### Data flow

```
vocabulary.labels.json  ──(pre-commit: uv run python utils/generate_vocabulary_tokens.py)──▶  tokens.ts
   (you edit)                     tiktoken.get_encoding("gpt2")                          (generated)
                                                                                             │
                                                                        import VOCABULARY_TOKENS
                                                                                             ▼
                                                                                  VocabularySection.tsx
```

`vocabulary.labels.json` is the single source of truth for *which* tokens exist and their
order. `tokens.ts` is a pure derivation of it. The frontend imports only `tokens.ts`; the
generator is the only reader of the JSON at build/commit time.

## Data generation

### The authored list

`vocabulary.labels.json` holds the 43 strings currently inlined as `VOCABULARY_TOKENS` in
`pages/HomePage.tsx`, in the same order, as a JSON array of strings. This is the file a human
edits to add, remove, or reorder tokens. The existing prettier pre-commit hook (`types_or:
[json, yaml]`) keeps it formatted.

### The generator

`utils/generate_vocabulary_tokens.py`:

1. Reads `vocabulary.labels.json` (preserving order).
2. Encodes each label with `tiktoken.get_encoding("gpt2")` — the canonical GPT-2 124M
   byte-level BPE, the same tokenizer named in `architecture.ts`.
3. Writes `frontend/src/features/vocabulary/tokens.ts` from a fixed template: a
   `VocabularyToken` interface (`{ label: string; ids: number[] }`), the
   `export const VOCABULARY_TOKENS: readonly VocabularyToken[] = [...] ` data, and a header
   comment marking the file generated and naming the exact regeneration command.

The output is deterministic (input order preserved, no sorting) and must be oxlint-clean and
type-check under `tsc` so `make fe-lint` and `make fe-build` pass. The script types its
signatures, raises a narrow error if a label encodes to an empty ID list, and follows the
repository's Python style (Google-style docstrings, no module docstring, standard logging at
the boundary, 100-char lines).

Encoding is verified against a hand-checked example in the generator's own reasoning and in
the frontend data test (see Testing): single-piece words yield one ID; multi-piece strings
such as `Hugging Face` yield several. `tiktoken`'s `gpt2` encoding round-trips
(`enc.decode(enc.encode(label)) == label`), which the generator asserts per label before
writing.

### Pre-commit hooks

Two `local` hooks added to `.pre-commit-config.yaml`, in order, mirroring the established
`uv-lock-update` → `uv-lock-add` regenerate-then-stage pattern:

```yaml
- id: generate-vocabulary-tokens
  name: Generate vocabulary token IDs
  entry: uv run python utils/generate_vocabulary_tokens.py
  language: system
  pass_filenames: false
  files: >-
    ^(frontend/src/features/vocabulary/vocabulary\.labels\.json|utils/generate_vocabulary_tokens\.py)$
  stages: [pre-commit]
- id: add-vocabulary-tokens
  name: Stage generated vocabulary token IDs
  entry: git add frontend/src/features/vocabulary/tokens.ts
  language: system
  pass_filenames: false
  files: >-
    ^(frontend/src/features/vocabulary/vocabulary\.labels\.json|utils/generate_vocabulary_tokens\.py)$
  stages: [pre-commit]
```

Both hooks watch the same paths (the label list and the generator), in this order, so any
regeneration — whether triggered by editing the vocabulary or the script — is followed by
staging the refreshed `tokens.ts`, and the commit contains matching label and ID data without
a manual step. Contributors who never touch the vocabulary never invoke the generator.

### Dependency

Add `tiktoken` to the project's **development** dependencies (`pyproject.toml`); the existing
`uv-lock-update` hook refreshes `uv.lock`. Purpose: it is the canonical GPT-2 BPE and the
authority that makes the committed IDs honest and reproducible. It is a commit-time tool only
— it is never imported by the FastAPI app and never reaches the browser bundle, which
receives only the precomputed integers.

**Known wrinkle:** `tiktoken` downloads and caches the GPT-2 BPE vocabulary on first use, so
the *first* regeneration on a fresh machine needs network access. This is acceptable because
regeneration runs only when the vocabulary changes, and the result is cached thereafter. If
offline determinism is later required, the BPE files can be vendored and `tiktoken` pointed at
a local cache; that hardening is out of scope here.

## UI and interaction

`VocabularySection.tsx` is a faithful extraction of today's
`<section aria-labelledby="vocabulary-heading">` from `HomePage.tsx` — the `vocabulary`
eyebrow, the "The tokens in my vocabulary" heading, the chip grid, and the nested
`<SkillsRadarSection />` — plus the new toggle. `HomePage` then renders `<VocabularySection />`
in place of the inline list and markup.

### The toggle

A two-option control that selects the current view, implemented as a **radiogroup** of two
radios labelled "For Humans" (default, checked) and "For LLMs":

- Native radio keyboard semantics (arrow keys move, focus visible).
- The selected option is distinguished by **indicator position and weight**, never by hue
  alone (Cristian has red-green CVD); the two options must also be legible when told apart by
  lightness/shape.
- `role="radiogroup"` with an accessible label (for example `aria-label="Token view"`).

State lives in `VocabularySection` as `useState<'humans' | 'llms'>('humans')`.

### The chips

Reuse the `TokenChip` primitive (`components/TokenChip.tsx`), `tone="neutral"` as today.

- **For Humans:** the label string, exactly as today.
- **For LLMs:** `ids.join(' ')` — e.g. `48098 2667 15399`.
- Each chip's accessible name always carries **both** representations regardless of the active
  view, so identity is never lost to screen readers, e.g.
  `aria-label="Hugging Face — GPT-2 token IDs 48098 2667 15399"`.
- Chips **size to their content** (the grid already `flex-wrap`s). ID lists are short
  (a handful of integers), so nothing is truncated and no truncation machinery is needed.
- **Cross-tab hover cross-reference.** On hover, each chip shows a small styled tooltip with
  the *other* representation, labelled the way a tokenizer names them: in the "For Humans"
  view hovering a word reveals its `input_ids` (the integer vector); in the "For LLMs" view
  hovering the IDs reveals the `text` (the decoded string). This makes the toggle read as a
  real encode/decode round-trip. Because each chip's accessible name already carries both
  representations, the tooltip is a **mouse-only affordance**: it is `aria-hidden`, the chips
  stay non-focusable (no new keyboard tab stops), and screen-reader users lose nothing. The
  tooltip is an inverted `bg-fg` / `text-background` surface so it reads in both themes, and
  it fades in only under `motion-safe`.

### Motion

The only motion is CSS: the toggle's colour transition and the hover tooltip's fade. Both use
Tailwind's `motion-safe:` variant, so they are suppressed under `prefers-reduced-motion: reduce`
without needing the JS `usePrefersReducedMotion()` hook. The chip content swap on toggle is
instant. No layout-shifting or looping motion.

### Progressive enhancement

"For Humans" is the initial render, so the vocabulary strings are present and readable with
JavaScript disabled; the toggle and the ID view are pure enhancement. This satisfies the
requirement that core portfolio content stay readable without interaction.

## Testing

- **`tokens.data.test.ts`** (Node env, `.test.ts`): reads `vocabulary.labels.json` from disk
  with `fs` and imports `VOCABULARY_TOKENS`, then asserts:
  - the generated `label` sequence equals the JSON array exactly (order and content), which
    catches a stale `tokens.ts` committed with `--no-verify` or a bypassed hook;
  - every entry has at least one ID;
  - every ID is an integer in `[0, 50257)` (GPT-2's vocabulary size).
  This is the deterministic frontend guard. It intentionally does not re-tokenize (the browser
  has no encoder); correctness of the specific IDs is owned by the generator and its
  round-trip assertion.
- **`VocabularySection.test.tsx`** (jsdom, `renderInApp` + Testing Library + `user-event` +
  `vitest-axe`, following the branch's existing `*.test.tsx` conventions):
  - default view renders the human words;
  - selecting "For LLMs" renders a known chip's `ids.join(' ')` and hides nothing;
  - selecting "For Humans" restores the words;
  - `axe` reports no violations in either view.

## File-by-file changes

- **Add** `frontend/src/features/vocabulary/vocabulary.labels.json` — the 43 labels moved from
  `HomePage.tsx`, same order.
- **Add** `frontend/src/features/vocabulary/tokens.ts` — generated data (committed).
- **Add** `frontend/src/features/vocabulary/VocabularySection.tsx` — extracted section + toggle.
- **Add** `frontend/src/features/vocabulary/index.ts` — barrel export.
- **Add** `frontend/src/features/vocabulary/tokens.data.test.ts`.
- **Add** `frontend/src/features/vocabulary/VocabularySection.test.tsx`.
- **Add** `utils/generate_vocabulary_tokens.py` — the generator.
- **Edit** `frontend/src/pages/HomePage.tsx` — remove the inline `VOCABULARY_TOKENS` array and
  the section markup; render `<VocabularySection />`. Keep the `ForwardPassHero` and
  `ChatSection` above it.
- **Edit** `.pre-commit-config.yaml` — add the two generation hooks.
- **Edit** `pyproject.toml` — add `tiktoken` to dev dependencies; `uv.lock` refreshed by hook.

## Verification

- Frontend: `make fe-lint`, `make fe-test`, `make fe-build`.
- Python: `make format-check`, `make lint`, `make lint-doc` (generator script).
- Generation loop: edit `vocabulary.labels.json`, run
  `uv run python utils/generate_vocabulary_tokens.py`, confirm `tokens.ts` regenerates and
  `git diff` shows only expected ID changes; confirm the pre-commit hooks regenerate and stage
  on a real commit that touches the label list.

## Risks and considerations

- **tiktoken first-run network** — documented above; bounded to vocabulary edits.
- **Generated-file drift** — mitigated by the data test and the auto-staging hook; the header
  comment marks the file do-not-edit and names the regeneration command.
- **Accessibility of a numbers-only view** — mitigated by always carrying both representations
  in each chip's accessible name and by the axe assertions in both views.
- **Scope discipline** — the extraction touches only the vocabulary section; the skills radar
  moves verbatim inside `VocabularySection` with no behavioural change.

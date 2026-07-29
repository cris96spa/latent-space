# Mobile forward-pass hero layout stability - design

Date: 2026-07-29

## Summary

On a phone the forward-pass hero reflows continuously while it plays. The card's height
oscillates by up to 32px several times a second, which shoves the streamed bio the visitor
is reading up and down, and in the `ids` token view the output box grows a row at a time
from 160px to 416px, taking the whole page with it.

This reserves the space that moves, so playback changes what the hero says and never how
tall it is.

## Measurements

Playwright, Chromium, iPhone 13 (390x844) and 320x700, sampling element heights every
250ms through a full pass against the real backend tokenizer:

| Element | Height | Behaviour |
| --- | --- | --- |
| `ids` output box (`StreamingBio`) | 160 -> 416px | grows a chip row at a time, no reserve |
| status strip, phase and kv cache (`ForwardPassHero`) | 34 <-> 50px | wraps and unwraps every stage tick |
| phase caption (`PlaybackControls`) | 16 <-> 32px | wraps and unwraps on every phase change |
| output counts header (`ForwardPassHero`) | +17px at 320px | wraps once the counts appear |
| `text` output box (`StreamingBio`) | 352px constant | already reserved by the invisible sizer |
| pipeline diagram | 293px constant | fixed `viewBox`, `h-auto w-full` |

Card height in the `text` view cycles 1124 <-> 1140 <-> 1156px; `document.body.scrollHeight`
cycles 4368 <-> 4401. The animation itself is not the problem: every jump comes from a chrome
row whose text length crosses a wrap boundary, or from the unreserved `ids` box.

## Goals

- Hero card height is constant across every frame of a pass, at every mobile width.
- The default `text` view keeps its exact, no-scroll reserve; the bio never needs interaction.
- Heights are derived from content that already exists, not from hardcoded pixel numbers.
- Reduced-motion, keyboard access, and CVD-safe styling are unchanged.

## Non-goals

- No change to the hero's mobile composition (its total height, section order, or the
  diagram's compact layout). That is a separate, larger piece of work.
- No change to frame timing, the data-source seam, or any authored content.

## Design

### 1. Status strip and output counts header (`ForwardPassHero.tsx`)

Both are `flex` rows holding two spans whose text length changes as the pass runs
(`decode · attention` versus `decode · mlp`; `9 tokens` versus `108 tokens`). Whether they
fit on one line is therefore a function of the current frame.

Stack them into two `whitespace-nowrap` rows below `sm` and keep the single row from `sm`.
Height then depends only on the breakpoint. The longest mobile string, `kv cache 1024/1024
ctx · 12 blocks`, is roughly 224px in 11px mono against 288px of available width at 320px,
so nothing truncates.

### 2. Phase caption (`PlaybackControls.tsx`)

Reuse the invisible-sizer pattern already in `StreamingBio`: a grid cell rendering the
longest caption invisibly, with the live caption stacked in the same cell. The reserve then
follows the caption text and the viewport width automatically, with no `min-h` constant to
go stale when a caption is reworded.

### 3. `ids` output box (`StreamingBio.tsx`)

An exact sizer is impossible here. The text view reserves against `CANONICAL_BIO`, which is
authored content the page already renders; reserving the `ids` grid would instead require
the answer's tokenization up front, which the streamed-source contract forbids, since a live
model does not know its own output in advance.

So the `ids` view gets a height budget rather than a sizer: the same reserved footprint the
text view occupies, with the chip grid scrolling inside it and pinned to the bottom as
tokens arrive. Pinning assigns `scrollTop` directly, which jumps rather than animates, so
reduced motion needs no special case. The `text` view is untouched and keeps its exact,
scroll-free reserve, so the core content still reads with no interaction.

`overflow-y-auto` alone is not enough. A grid row still sizes to its tallest item's content
even when that item can scroll, so the box grew exactly as before against the real 128-token
tokenization. The scrolling cell is therefore taken out of flow (`absolute inset-0` inside a
`relative` box), which leaves the invisible sizer as the only thing deciding the row height.

The rejected alternative is a hardcoded `min-h` per breakpoint sized for today's bio: fewer
lines, but a magic number that goes stale when the bio or the chip metrics change, and one
that still grows if the bio gets longer.

## Testing

- Playwright e2e at 390x844 and 320x700: seek the slider to fixed frames spanning tokenize,
  prefill, decode, and complete, and assert the hero card's height is identical at each, in
  both token views. Deterministic, with no dependence on playback timing.
- The e2e API stub gains a `/tokenize` route, since without it the hero takes its
  pretokenizer fallback and hides the ids view. It has to split at roughly BPE granularity:
  a coarser word-level stub produced a grid that fit inside the reserve, and so passed
  against a build whose ids box still grew against the real tokenizer.
- jsdom unit: the `ids` view renders its bounded scroll container; the `text` view still
  renders the invisible reserve sizer and no scroll container.
- `make fe-lint`, `make fe-test`, `make fe-build`, `make fe-e2e`.

## Found on the way: the site header

Measuring the hero turned up a second mobile defect. The header's nav is a rigid 272px and
its wordmark wants 162px, so against 288px of usable width at 320px the row could not hold
both: the wordmark was being squeezed onto two lines ("latent-" / "space") and the page
still scrolled sideways by 71px at 320px and 1px at 390px.

Below `sm` the row now wraps and the nav takes a line of its own, with the wordmark held to
one line and the mobile padding shortened to pay for the extra row. Nothing is hidden behind
a menu, so every link keeps its label and its tap target. The header measures 85px on a
phone against 81px before, and page overflow is 0 at 320px, 360px, and 390px.

`e2e/header.spec.ts` pins all three properties: no horizontal page scroll, every primary nav
link visible, and a single-line wordmark.

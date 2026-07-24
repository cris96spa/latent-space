# Self-eval: the radar plus a diverging positive/negative split

Date: 2026-07-24
Status: implemented

## Context

The `self-eval · n=1` block on the home page rendered one Plotly `scatterpolar` radar over
self-scored engineering virtues (`frontend/src/features/self-eval/`, renamed from
`skills-radar/`). This work keeps the radar and adds a second, toggleable view of the same
data: a diverging bar chart that splits the virtues by sign, strengths against quirks.

The Plotly radar is decorative (`aria-hidden`); a visually-hidden `<ul>` in the section is
the real content assistive tech reads. That decoupling is preserved for both views.

### Iteration note

A 3D Plotly loss/capability surface was prototyped first and dropped: it read as isolated
spikes with markers floating over flat ground ("empty peaks"), and a self-eval is clearer as
honest bars than as an interpolated terrain. The diverging split replaced it.

## Decisions

1. **Keep the radar, add a second view.** Both read the same `ENGINEERING_VIRTUES`.
2. **Toggle, radar default.** A segmented `radar / split` control; the radar leads because the
   split caption frames its bars as the same scores "by sign".
3. **Twelve virtues.** Added `Get the job done` (positive), giving a balanced 6 positive /
   6 negative split.
4. **Polarity is authored data.** Each virtue carries `polarity: 'positive' | 'negative'`,
   declaring which end is aspirational rather than inferring it from the raw score.
5. **A proper scale for the negatives.** On the diverging axis a positive virtue keeps its raw
   score (grows right); a negative one is scaled by its distance from a perfect ten
   (`VIRTUE_SCALE_MAX - rating`) and grows left, so a proud `1/10` (R tolerance, buzzword
   tolerance) reads as a strong lean rather than a stub.
6. **Plain DOM, no Plotly for the split.** The split view is a CSS/DOM bar chart, so it adds
   nothing to the bundle and needs no lazy boundary; only the radar stays lazy.
7. **CVD-safe by construction.** Polarity is encoded by side (left/right), hue (amber/blue),
   and a header on each side together, never hue alone.

## Architecture

`frontend/src/features/self-eval/`:

- `virtues.ts` - data + types. `EngineeringVirtue` gains `polarity`; adds the twelfth virtue;
  exports `RADAR_CAPTION` and `SPLIT_CAPTION`.
- `virtues.test.ts` - existing invariants plus polarity coverage.
- `split.ts` - **pure**: `divergingValue(virtue)` (signed) and `toDivergingBars(virtues)`
  (enriched `VirtueBar[]`, ordered strongest strength first down to deepest quirk).
- `split.test.ts` - hand-checked scale and ordering.
- `SkillsRadar.tsx` - the existing Plotly radar, unchanged, still lazy and `aria-hidden`.
- `SplitBars.tsx` - the diverging bar chart. A symmetric `1fr | label | 1fr` grid per row:
  positive bars grow right in `brand-600`/`dark:brand-500`, negative left in
  `attention-500`/`dark:attention-400`, labels centred, side headers `quirks` / `strengths`.
  Bar length is `magnitude / VIRTUE_SCALE_MAX`. Decorative (`aria-hidden`); each row's hover
  `title` carries the exact score and caption.
- `SelfEvalSection.tsx` - the toggle shell. Segmented `radar / split` radiogroup (the
  `VocabularySection` toggle pattern), radar default, per-view caption, and the always-present
  `sr-only` list of all twelve scores.
- `index.ts` - re-exports `SelfEvalSection`.

`VocabularySection` renders `<SelfEvalSection />`; its test mocks `../self-eval`.

## The diverging scale

`divergingValue(v) = v.polarity === 'positive' ? v.rating : -(VIRTUE_SCALE_MAX - v.rating)`.
Worked examples: positive `9 -> +9`; positive `10 -> +10`; negative `1 -> -9`; negative
`4 -> -6`. `toDivergingBars` maps each virtue to `{label, rating, caption, polarity, value,
magnitude}` (`magnitude = |value|`) and sorts by `value` descending.

## Accessibility, theme, performance

- Both visualizations `aria-hidden`; the `sr-only` list is the view-independent source of
  truth for all twelve scores.
- Both themes verified by eye; the split encodes polarity on side, hue, and header.
- The split is static DOM (no motion, no canvas); the radar keeps its existing reduced-motion
  and theme handling. No new dependency; the radar stays a lazy chunk.

## Testing

- `split.test.ts` (pure): the signed scale and the strongest-first ordering.
- `virtues.test.ts`: label/axis sync, integer range, uniqueness, and polarity populated on
  both sides.
- `VocabularySection.test.tsx`: mock path/name unchanged from the toggle rework.
- Frontend gate: `make fe-lint`, `make fe-test`, `make fe-build`, plus a light/dark eyeball.

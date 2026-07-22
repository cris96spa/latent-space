import type { ContextToken } from '../types'

export interface ColumnBox {
  readonly x: number
  readonly width: number
}

/**
 * Geometry for one rendering of the pipeline, in SVG user units.
 *
 * Two instances exist rather than one parametric layout: the diagram is decorative,
 * and a narrow viewport is better served by drawing fewer things at a readable size
 * than by scaling the full drawing down until its labels vanish. Columns a layout
 * omits are `null` and `verbose` says whether there is room for full stage labels;
 * every panel reads its box from here, so both variants share all the drawing code.
 */
export interface DiagramLayout {
  readonly width: number
  readonly height: number
  readonly panelTop: number
  readonly panelHeight: number
  readonly railY: number
  readonly laneY: number
  readonly contextWindow: number
  readonly candidateCount: number
  readonly labelSize: number
  readonly tokenSize: number
  readonly verbose: boolean
  /** Character budgets, so long tokens cannot run out of their column or bar. */
  readonly maxTokenChars: number
  readonly maxCandidateChars: number
  /** How many just-sampled tokens stay in flight on the way to the lane. */
  readonly trailLength: number
  readonly context: ColumnBox
  readonly embed: ColumnBox
  readonly qkv: ColumnBox | null
  readonly attention: ColumnBox
  readonly mlp: ColumnBox
  readonly unembed: ColumnBox | null
  readonly logits: ColumnBox
  /** LayerNorm markers, dropped when the layout has no room for them. */
  readonly attentionNormX: number | null
  readonly mlpNormX: number | null
  /** Where the residual stream rejoins after each sub-layer. */
  readonly attentionAddX: number
  readonly mlpAddX: number
}

export const FULL_DIAGRAM_LAYOUT: DiagramLayout = {
  width: 1000,
  height: 420,
  panelTop: 74,
  panelHeight: 236,
  railY: 192,
  laneY: 356,
  contextWindow: 7,
  candidateCount: 5,
  labelSize: 11,
  tokenSize: 12,
  verbose: true,
  maxTokenChars: 12,
  maxCandidateChars: 18,
  trailLength: 5,
  context: { x: 6, width: 112 },
  embed: { x: 128, width: 68 },
  qkv: { x: 220, width: 90 },
  attention: { x: 324, width: 176 },
  mlp: { x: 554, width: 126 },
  unembed: { x: 714, width: 32 },
  logits: { x: 752, width: 214 },
  attentionNormX: 206,
  mlpNormX: 540,
  attentionAddX: 512,
  mlpAddX: 692,
}

export const COMPACT_DIAGRAM_LAYOUT: DiagramLayout = {
  width: 430,
  height: 380,
  panelTop: 66,
  panelHeight: 190,
  railY: 161,
  laneY: 300,
  contextWindow: 5,
  candidateCount: 3,
  labelSize: 11,
  tokenSize: 11,
  verbose: false,
  maxTokenChars: 7,
  maxCandidateChars: 6,
  trailLength: 3,
  context: { x: 2, width: 62 },
  embed: { x: 70, width: 36 },
  qkv: null,
  attention: { x: 116, width: 106 },
  mlp: { x: 244, width: 62 },
  unembed: null,
  logits: { x: 328, width: 100 },
  attentionNormX: null,
  mlpNormX: null,
  attentionAddX: 232,
  mlpAddX: 316,
}

/**
 * A token as the diagram shows it: whitespace trimmed away (the SVG cannot show it
 * anyway), a middle dot standing in for whitespace-only tokens, and an ellipsis where
 * the column runs out of room. Layout, not content - the readable text is the bio.
 */
export function tokenLabel(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return '·'
  }
  return trimmed.length > maxChars ? `${trimmed.slice(0, maxChars - 1)}…` : trimmed
}

export function centerX(box: ColumnBox): number {
  return box.x + box.width / 2
}

export function rightX(box: ColumnBox): number {
  return box.x + box.width
}

export function panelBottom(layout: DiagramLayout): number {
  return layout.panelTop + layout.panelHeight
}

/** The trailing slice of the context the layout has room to draw, newest last. */
export function visibleContextTokens(
  context: readonly ContextToken[],
  layout: DiagramLayout,
): ContextToken[] {
  return context.slice(Math.max(0, context.length - layout.contextWindow))
}

/**
 * Vertical centre of context row `slot`, counting from the top of the visible window.
 * Rows spread evenly over the panel with a fixed inset; a lone row centres on it.
 */
export function contextRowY(slot: number, visibleCount: number, layout: DiagramLayout): number {
  const inset = 14
  const top = layout.panelTop + inset
  const usable = layout.panelHeight - inset * 2
  if (visibleCount <= 1) {
    return top + usable / 2
  }
  return top + (slot * usable) / (visibleCount - 1)
}

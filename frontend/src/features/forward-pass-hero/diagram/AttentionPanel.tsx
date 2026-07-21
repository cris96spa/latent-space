import { cn } from '../../../lib/cn'
import { TARGET_MODEL } from '../architecture'
import { ATTENTION_HEADS } from '../frames'
import { hashUnitInterval } from '../../../lib/hash'
import type { AttentionEdge, ContextToken } from '../types'
import { centerX, contextRowY, rightX, type DiagramLayout } from './layout'

const HEAD_STROKES: readonly string[] = [
  'stroke-attention-400',
  'stroke-brand-400',
  'stroke-activation-400',
  'stroke-attention-300',
]
const HEAD_FILLS: readonly string[] = [
  'fill-attention-400',
  'fill-brand-400',
  'fill-activation-400',
  'fill-attention-300',
]

const LINES_PER_HEAD = 1
const QKV_CELLS = 5
const QKV_LABELS: readonly string[] = ['Q', 'K', 'V']
const HEAD_ROW_HEIGHT = 22
// The compact layout only has room for `h0`..`h3`; the full layout widens the gutter
// so each row can carry its head's specialisation name instead of an anonymous index.
const HEAD_LABEL_WIDTH = 26
const HEAD_LABEL_WIDTH_VERBOSE = 60

interface AttentionPanelProps {
  readonly edges: readonly AttentionEdge[]
  readonly visibleContext: readonly ContextToken[]
  readonly kvCacheLength: number
  readonly layout: DiagramLayout
  readonly activeStage: 'qkv' | 'attention' | null
  /** Prefill runs every position in one pass; decode runs only the newest one. */
  readonly parallel: boolean
}

/** The strongest keys per head, used for the fan lines so the drawing stays readable. */
function strongestEdgesPerHead(edges: readonly AttentionEdge[]): AttentionEdge[] {
  return ATTENTION_HEADS.flatMap((head) =>
    edges
      .filter((edge) => edge.head === head.index)
      .sort((left, right) => right.weight - left.weight)
      .slice(0, LINES_PER_HEAD),
  )
}

/**
 * GPT-2 multi-head attention: Q/K/V projections, a head × key heatmap for the heads
 * there is room to draw, fan lines from the loudest keys back to their tokens, and the
 * KV cache underneath. Each heatmap row is one head's softmax, so cell opacity is its
 * weight relative to that head's own peak.
 */
export function AttentionPanel({
  edges,
  visibleContext,
  kvCacheLength,
  layout,
  activeStage,
  parallel,
}: AttentionPanelProps) {
  const headCount = ATTENTION_HEADS.length
  const headLabelWidth = layout.verbose ? HEAD_LABEL_WIDTH_VERBOSE : HEAD_LABEL_WIDTH
  const gridX = layout.attention.x + headLabelWidth
  const gridWidth = layout.attention.width - headLabelWidth - 8
  const gridTop = layout.railY - (HEAD_ROW_HEIGHT * headCount) / 2
  const gridBottom = gridTop + HEAD_ROW_HEIGHT * headCount
  const cellWidth = visibleContext.length > 0 ? gridWidth / visibleContext.length : gridWidth
  const attentionActive = activeStage === 'attention'
  const qkvActive = activeStage === 'qkv'
  // Fan lines belong to the attention block; outside it they fade to nothing so they
  // never read as a permanent arrow lingering over the mlp/logits stages.
  const fanActive = activeStage !== null
  const queryToken = visibleContext[visibleContext.length - 1]
  const qkvBox = layout.qkv

  const weightByKey = new Map(edges.map((edge) => [`${edge.head}:${edge.keyIndex}`, edge.weight]))
  const peakByHead = ATTENTION_HEADS.map((head) =>
    Math.max(1e-6, ...edges.filter((edge) => edge.head === head.index).map((edge) => edge.weight)),
  )
  // How hard the current query reads each cached position: the total attention it
  // receives across heads. Drives the kv row so the cache visibly feeds attention
  // instead of sitting there as a static strip of filled cells.
  const readByKey = new Map<number, number>()
  for (const edge of edges) {
    readByKey.set(edge.keyIndex, (readByKey.get(edge.keyIndex) ?? 0) + edge.weight)
  }
  const readPeak = Math.max(1e-6, ...visibleContext.map((token) => readByKey.get(token.index) ?? 0))

  return (
    <g>
      {qkvBox && queryToken && (
        <g style={{ opacity: qkvActive ? 1 : 0.65 }}>
          <text
            x={centerX(qkvBox)}
            y={layout.panelTop - 12}
            textAnchor="middle"
            fontSize={layout.labelSize}
            className={cn('font-mono', qkvActive ? 'fill-fg' : 'fill-muted')}
          >
            qkv
          </text>
          {QKV_LABELS.map((label, projection) => {
            const stackWidth = 22
            const stackX = qkvBox.x + 8 + projection * (stackWidth + 8)
            const stackTop = layout.railY - (QKV_CELLS * 14) / 2
            return (
              <g key={label}>
                {Array.from({ length: QKV_CELLS }, (_, cell) => (
                  <rect
                    key={cell}
                    x={stackX}
                    y={stackTop + cell * 14}
                    width={stackWidth}
                    height={12}
                    rx={2}
                    className={HEAD_FILLS[projection]}
                    style={{
                      opacity: 0.25 + hashUnitInterval(`${label}:${queryToken.text}:${cell}`) * 0.7,
                      animation: qkvActive
                        ? `ls-pulse 1.1s ease-in-out ${cell * 60}ms infinite`
                        : undefined,
                    }}
                  />
                ))}
                <text
                  x={stackX + stackWidth / 2}
                  y={stackTop + QKV_CELLS * 14 + 12}
                  textAnchor="middle"
                  fontSize={layout.labelSize}
                  className="fill-muted font-mono"
                >
                  {label}
                </text>
              </g>
            )
          })}
        </g>
      )}

      {strongestEdgesPerHead(edges).map((edge) => {
        const slot = visibleContext.findIndex((token) => token.index === edge.keyIndex)
        if (slot < 0) {
          return null
        }
        return (
          <line
            key={`${edge.head}:${edge.keyIndex}`}
            x1={rightX(layout.embed)}
            y1={contextRowY(slot, visibleContext.length, layout)}
            x2={gridX}
            y2={gridTop + edge.head * HEAD_ROW_HEIGHT + HEAD_ROW_HEIGHT / 2}
            className={HEAD_STROKES[edge.head]}
            strokeWidth={0.6 + edge.weight * 2}
            strokeLinecap="round"
            style={{
              opacity: fanActive ? 0.18 + edge.weight * 0.8 : 0,
              transition: 'opacity 220ms linear',
              strokeDasharray: attentionActive ? '4 6' : undefined,
              animation: attentionActive ? 'ls-flow 0.7s linear infinite' : undefined,
            }}
          />
        )
      })}

      <text
        x={centerX(layout.attention)}
        y={layout.panelTop - 12}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className={cn('font-mono', attentionActive ? 'fill-fg' : 'fill-muted')}
      >
        {layout.verbose
          ? `mha · ${TARGET_MODEL.queryHeadCount} heads`
          : 'attention'}
      </text>

      {ATTENTION_HEADS.map((head) => {
        const rowY = gridTop + head.index * HEAD_ROW_HEIGHT
        return (
          <g key={head.index}>
            <text
              x={gridX - 6}
              y={rowY + HEAD_ROW_HEIGHT / 2 + 3}
              textAnchor="end"
              fontSize={layout.labelSize - 2}
              className="fill-muted font-mono"
            >
              {layout.verbose ? head.label : `h${head.index}`}
            </text>
            {visibleContext.map((token, slot) => {
              const weight = weightByKey.get(`${head.index}:${token.index}`) ?? 0
              return (
                <rect
                  key={token.index}
                  x={gridX + slot * cellWidth}
                  y={rowY + 2}
                  width={Math.max(2, cellWidth - 2)}
                  height={HEAD_ROW_HEIGHT - 4}
                  rx={2}
                  className={HEAD_FILLS[head.index]}
                  style={{
                    opacity: 0.08 + (weight / peakByHead[head.index]) * 0.85,
                    transition: 'opacity 140ms linear',
                  }}
                />
              )
            })}
          </g>
        )
      })}

      {visibleContext.map((token, slot) => {
        const cached = token.index < kvCacheLength
        // The newest cached position is the one this step just wrote (prefill writes
        // them all at once instead).
        const justWritten = cached && !parallel && token.index === kvCacheLength - 1
        const readShare = (readByKey.get(token.index) ?? 0) / readPeak
        const cellX = gridX + slot * cellWidth
        const cellWidthDrawn = Math.max(2, cellWidth - 2)
        return (
          <g key={token.index}>
            <rect
              x={cellX}
              y={gridBottom + 8}
              width={cellWidthDrawn}
              height={10}
              rx={2}
              className={cached ? 'fill-brand-500' : 'fill-border'}
              style={{
                // During attention the cache lights up by how much the query reads each
                // position; otherwise it rests at a calm filled/empty level.
                opacity: attentionActive && cached ? 0.3 + readShare * 0.7 : cached ? 0.42 : 0.18,
                transition: 'opacity 160ms linear',
                animation:
                  parallel && cached ? `ls-pulse 1s ease-in-out ${slot * 40}ms infinite` : undefined,
              }}
            />
            {justWritten && (
              <rect
                x={cellX - 1}
                y={gridBottom + 7}
                width={cellWidthDrawn + 2}
                height={12}
                rx={3}
                className="fill-none stroke-brand-300"
                strokeWidth={1.2}
                style={{ animation: qkvActive ? 'ls-pulse 0.9s ease-in-out infinite' : undefined }}
              />
            )}
          </g>
        )
      })}
      <text
        x={gridX - 6}
        y={gridBottom + 17}
        textAnchor="end"
        fontSize={layout.labelSize - 2}
        className="fill-muted font-mono"
      >
        kv
      </text>

      {layout.verbose && kvCacheLength > visibleContext.length && (
        <text
          x={centerX(layout.attention)}
          y={gridBottom + 40}
          textAnchor="middle"
          fontSize={layout.labelSize - 1}
          className="fill-muted font-mono"
        >
          {kvCacheLength} cached · {visibleContext.length} newest shown
        </text>
      )}
    </g>
  )
}

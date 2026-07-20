import { cn } from '../../../lib/cn'
import { TARGET_MODEL } from '../architecture'
import { hashUnitInterval } from '../sampling'
import type { ContextToken } from '../types'
import { centerX, contextRowY, rightX, tokenLabel, type DiagramLayout } from './layout'

const EMBEDDING_CELLS = 6
const CELL_TONES: readonly string[] = ['fill-brand-400', 'fill-activation-400', 'fill-attention-400']

function embeddingTone(token: ContextToken, cell: number): string {
  return CELL_TONES[Math.floor(hashUnitInterval(`tone:${token.text}:${cell}`) * CELL_TONES.length)]
}

function embeddingAmplitude(token: ContextToken, cell: number): number {
  return 0.22 + hashUnitInterval(`amp:${token.text}:${cell}`) * 0.72
}

interface ContextLaneProps {
  readonly visibleContext: readonly ContextToken[]
  readonly queryIndex: number
  readonly layout: DiagramLayout
  readonly active: boolean
  /** Prefill embeds every prompt position at once; decode embeds only the newest. */
  readonly parallel: boolean
}

/**
 * The left half of the diagram: the running context, newest at the bottom, and the
 * embedding vector each token turns into. Prompt and generated tokens are coloured
 * differently so the context visibly filling with the model's own output — the
 * autoregressive loop — is legible at a glance.
 */
export function ContextLane({
  visibleContext,
  queryIndex,
  layout,
  active,
  parallel,
}: ContextLaneProps) {
  const cellWidth = (layout.embed.width - 8) / EMBEDDING_CELLS
  const contextRight = rightX(layout.context)

  return (
    <g>
      <text
        x={centerX(layout.context)}
        y={layout.panelTop - 12}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className="fill-muted font-mono"
      >
        context
      </text>
      <text
        x={centerX(layout.embed)}
        y={layout.panelTop - 12}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className={cn('font-mono', active ? 'fill-fg' : 'fill-muted')}
      >
        {layout.verbose ? `embed · ${TARGET_MODEL.hiddenSize}` : 'embed'}
      </text>

      {visibleContext.map((token, slot) => {
        const y = contextRowY(slot, visibleContext.length, layout)
        // Prefill computes every prompt position in one pass, so they all light up.
        const isQuery = parallel || token.index === queryIndex
        const isGenerated = token.origin === 'generated'
        return (
          <g key={token.index} style={{ animation: 'ls-token-in 240ms var(--ease-out-expo)' }}>
            <text
              x={contextRight - 14}
              y={y + 4}
              textAnchor="end"
              fontSize={layout.tokenSize}
              className={cn(
                'font-mono',
                isGenerated ? 'fill-brand-700 dark:fill-brand-300' : 'fill-muted',
              )}
            >
              {tokenLabel(token.text, layout.maxTokenChars)}
            </text>
            <circle
              cx={contextRight - 5}
              cy={y}
              r={isQuery ? 4 : 2.5}
              className={isQuery ? 'fill-brand-500' : 'fill-border'}
            />
            <line
              x1={contextRight}
              y1={y}
              x2={layout.embed.x}
              y2={y}
              className={isQuery ? 'stroke-brand-400' : 'stroke-border'}
              strokeWidth={1}
            />
            {Array.from({ length: EMBEDDING_CELLS }, (_, cell) => (
              <rect
                key={cell}
                x={layout.embed.x + 4 + cell * cellWidth}
                y={y - 5}
                width={Math.max(2, cellWidth - 2)}
                height={10}
                rx={2}
                className={embeddingTone(token, cell)}
                style={{ opacity: embeddingAmplitude(token, cell) * (active ? 1 : 0.55) }}
              />
            ))}
          </g>
        )
      })}
    </g>
  )
}

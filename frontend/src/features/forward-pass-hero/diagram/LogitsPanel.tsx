import type { CSSProperties } from 'react'

import { cn } from '../../../lib/cn'
import { TARGET_MODEL } from '../architecture'
import { TOP_K } from '../frames'
import type { LogitCandidate, Token } from '../types'
import { centerX, tokenLabel, type DiagramLayout } from './layout'

const MAX_ROW_HEIGHT = 32
const UNEMBED_CELLS = 9
/** Tuned against the decode cadence: longer and the trail stacks into a blur. */
const TRAIL_DURATION_MS = 200
/** Sideways scatter so consecutive tokens do not fall down the same line. */
const TRAIL_SPREAD = 18

interface LogitsPanelProps {
  readonly candidates: readonly LogitCandidate[]
  readonly emittedTokens: readonly Token[]
  readonly layout: DiagramLayout
  readonly logitsActive: boolean
  readonly sampleActive: boolean
}

/**
 * The output end: unembedding, the softmax over the top-k candidates, and the token
 * that wins. The winning row is the argmax, and the sampled token literally falls out
 * of it toward the detokenized text below, which is the whole point of the diagram —
 * the prose on the page is what came out of this bar.
 */
export function LogitsPanel({
  candidates,
  emittedTokens,
  layout,
  logitsActive,
  sampleActive,
}: LogitsPanelProps) {
  const rows = candidates.slice(0, layout.candidateCount)
  const rowHeight = Math.min(MAX_ROW_HEIGHT, (layout.panelHeight - 60) / layout.candidateCount)
  const rowsTop = layout.railY - (rowHeight * layout.candidateCount) / 2
  const trackX = layout.logits.x + 8
  const trackWidth = layout.logits.width - 16
  // Tokens start their fall below the candidate list so they never sit over a bar.
  const emitStartY = rowsTop + rowHeight * layout.candidateCount + 16
  const emitDistance = layout.laneY - emitStartY
  const unembedBox = layout.unembed

  return (
    <g>
      {unembedBox && (
        <g style={{ opacity: logitsActive ? 1 : 0.55 }}>
          {Array.from({ length: UNEMBED_CELLS }, (_, cell) => (
            <rect
              key={cell}
              x={unembedBox.x}
              y={layout.railY - (UNEMBED_CELLS * 12) / 2 + cell * 12}
              width={unembedBox.width}
              height={10}
              rx={2}
              className="fill-brand-400"
              style={{
                opacity: 0.3 + (cell % 3) * 0.22,
                animation: logitsActive
                  ? `ls-pulse 1.2s ease-in-out ${cell * 50}ms infinite`
                  : undefined,
              }}
            />
          ))}
          <text
            x={centerX(unembedBox)}
            y={layout.railY + (UNEMBED_CELLS * 12) / 2 + 18}
            textAnchor="middle"
            fontSize={layout.labelSize - 1}
            className="fill-muted font-mono"
          >
            unembed
          </text>
        </g>
      )}

      <text
        x={centerX(layout.logits)}
        y={layout.panelTop - 12}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className={cn('font-mono', logitsActive ? 'fill-fg' : 'fill-muted')}
      >
        {layout.verbose
          ? `softmax · top-${TOP_K} of ${TARGET_MODEL.vocabularySize.toLocaleString('en-US')}`
          : 'softmax'}
      </text>

      {rows.map((candidate, row) => {
        const y = rowsTop + row * rowHeight
        const barHeight = rowHeight - 6
        return (
          <g key={candidate.text}>
            <rect
              x={trackX}
              y={y}
              width={trackWidth}
              height={barHeight}
              rx={4}
              className="fill-border"
              style={{ opacity: 0.45 }}
            />
            <rect
              x={trackX}
              y={y}
              width={trackWidth}
              height={barHeight}
              rx={4}
              className={candidate.selected ? 'fill-brand-500' : 'fill-activation-400'}
              style={{
                opacity: candidate.selected ? 0.92 : 0.45,
                transform: `scaleX(${Math.max(0.02, candidate.probability)})`,
                transformOrigin: `${trackX}px 0px`,
                transition: 'transform 120ms linear, opacity 120ms linear',
              }}
            />
            <text
              x={trackX + 8}
              y={y + barHeight / 2 + 4}
              fontSize={layout.labelSize}
              className={cn('font-mono', candidate.selected ? 'fill-fg' : 'fill-muted')}
            >
              {tokenLabel(candidate.text, layout.maxCandidateChars)}
            </text>
            <text
              x={trackX + trackWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize={layout.labelSize}
              className={cn('font-mono', candidate.selected ? 'fill-fg' : 'fill-muted')}
            >
              {(candidate.probability * 100).toFixed(0)}%
            </text>
          </g>
        )
      })}

      {rows.length > 0 && (
        <>
          <rect
            x={trackX - 3}
            y={rowsTop - 3}
            width={trackWidth + 6}
            height={rowHeight}
            rx={6}
            className="fill-none stroke-brand-500"
            strokeWidth={1.5}
            style={{ opacity: 0.9 }}
          />
          <text
            x={trackX - 6}
            y={rowsTop + rowHeight / 2 + 4}
            textAnchor="end"
            fontSize={layout.labelSize - 1}
            className="fill-brand-700 font-mono dark:fill-brand-300"
          >
            argmax
          </text>
          <line
            x1={centerX(layout.logits)}
            y1={rowsTop + rowHeight}
            x2={centerX(layout.logits)}
            y2={layout.laneY}
            className="stroke-brand-400"
            strokeWidth={1.5}
            strokeDasharray="3 5"
            style={{
              opacity: sampleActive ? 1 : 0.5,
              animation: 'ls-flow 0.7s linear infinite',
            }}
          />
        </>
      )}

      {emittedTokens.slice(-layout.trailLength).map((token) => (
        <text
          key={token.index}
          x={centerX(layout.logits) + ((token.index % 3) - 1) * TRAIL_SPREAD}
          y={emitStartY}
          textAnchor="middle"
          fontSize={layout.tokenSize}
          className="fill-brand-700 font-mono dark:fill-brand-200"
          style={
            {
              '--ls-emit-distance': `${emitDistance}px`,
              animation: `ls-emit ${TRAIL_DURATION_MS}ms linear forwards`,
            } as CSSProperties
          }
        >
          {tokenLabel(token.text, layout.maxTokenChars)}
        </text>
      ))}
    </g>
  )
}

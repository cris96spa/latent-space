import { cn } from '../../../lib/cn'
import { TARGET_MODEL } from '../architecture'
import { MLP_UNIT_COUNT } from '../frames'
import { centerX, type DiagramLayout } from './layout'

const PROJECTION_CELLS = MLP_UNIT_COUNT / 4

interface MlpPanelProps {
  readonly activations: readonly number[]
  readonly layout: DiagramLayout
  readonly active: boolean
}

/**
 * The position-wise MLP: project up 4×, apply the non-linearity, project back down.
 * The hidden column's cell heights are the frame's activations, so this is the one
 * panel whose shape changes with every generated token.
 */
export function MlpPanel({ activations, layout, active }: MlpPanelProps) {
  const stackWidth = (layout.mlp.width - 24) / 3
  const hiddenHeight = Math.min(layout.panelHeight - 40, MLP_UNIT_COUNT * 13)
  const hiddenTop = layout.railY - hiddenHeight / 2
  const cellHeight = hiddenHeight / MLP_UNIT_COUNT
  const projectionHeight = cellHeight * PROJECTION_CELLS * 1.6
  const projectionTop = layout.railY - projectionHeight / 2
  const projectionCellHeight = projectionHeight / PROJECTION_CELLS

  return (
    <g>
      <text
        x={centerX(layout.mlp)}
        y={layout.panelTop - 12}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className={cn('font-mono', active ? 'fill-fg' : 'fill-muted')}
      >
        {layout.verbose
          ? `mlp · gelu · ${TARGET_MODEL.hiddenSize} → ${TARGET_MODEL.feedForwardSize}`
          : 'mlp'}
      </text>

      {[0, 2].map((column) => (
        <g key={column}>
          {Array.from({ length: PROJECTION_CELLS }, (_, cell) => (
            <rect
              key={cell}
              x={layout.mlp.x + 8 + column * (stackWidth + 4)}
              y={projectionTop + cell * projectionCellHeight}
              width={stackWidth}
              height={Math.max(3, projectionCellHeight - 3)}
              rx={2}
              className="fill-brand-400"
              style={{ opacity: active ? 0.85 : 0.4 }}
            />
          ))}
        </g>
      ))}

      {activations.map((activation, unit) => (
        <rect
          key={unit}
          x={layout.mlp.x + 8 + stackWidth + 4}
          y={hiddenTop + unit * cellHeight}
          width={stackWidth}
          height={Math.max(2, cellHeight - 2)}
          rx={2}
          className="fill-activation-400"
          style={{
            opacity: 0.18 + activation * 0.8,
            transition: 'opacity 120ms linear',
            animation: active ? `ls-pulse 1s ease-in-out ${unit * 40}ms infinite` : undefined,
          }}
        />
      ))}
    </g>
  )
}

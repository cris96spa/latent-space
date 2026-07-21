import { SWEEP_STROKES } from './palette'
import {
  asymptoticLoss,
  initialLoss,
  MODEL_PARAMETERS,
  RUNS_PER_FAMILY,
  sampleAblationSweep,
  TRAINED_TOKENS,
  VOCABULARY_SIZE,
  WARMUP_TOKENS,
} from './scalingLaw'

const SAMPLE_COUNT = 170
const SWEEP = sampleAblationSweep(SAMPLE_COUNT)
const ASYMPTOTE = asymptoticLoss(MODEL_PARAMETERS)
const LOSS_AXIS_TOP = initialLoss(VOCABULARY_SIZE) + 0.2
const LOSS_AXIS_BOTTOM = ASYMPTOTE - 0.5

interface PlotBox {
  readonly width: number
  readonly height: number
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
  readonly fontSize: number
  readonly annotated: boolean
}

const WIDE_PLOT: PlotBox = {
  width: 900,
  height: 330,
  left: 38,
  right: 888,
  top: 18,
  bottom: 296,
  fontSize: 11,
  annotated: true,
}

const NARROW_PLOT: PlotBox = {
  width: 400,
  height: 250,
  left: 30,
  right: 394,
  top: 14,
  bottom: 220,
  fontSize: 11,
  annotated: false,
}

const TOKEN_TICKS: readonly { readonly tokens: number; readonly label: string }[] = [
  { tokens: 1e7, label: '10M' },
  { tokens: 1e8, label: '100M' },
  { tokens: 1e9, label: '1B' },
  { tokens: 1e10, label: '10B' },
]
const LOSS_TICKS: readonly number[] = [2, 4, 6, 8, 10]

/** Tokens are plotted on a log axis; seven orders of magnitude do not fit otherwise. */
function xForTokens(tokens: number, plot: PlotBox): number {
  const ratio =
    (Math.log10(tokens) - Math.log10(WARMUP_TOKENS)) /
    (Math.log10(TRAINED_TOKENS) - Math.log10(WARMUP_TOKENS))
  return plot.left + ratio * (plot.right - plot.left)
}

function yForLoss(loss: number, plot: PlotBox): number {
  const ratio = (loss - LOSS_AXIS_BOTTOM) / (LOSS_AXIS_TOP - LOSS_AXIS_BOTTOM)
  return plot.bottom - ratio * (plot.bottom - plot.top)
}

function pathFor(samples: readonly { tokens: number; loss: number }[], plot: PlotBox): string {
  return samples
    .map(
      (sample, index) =>
        `${index === 0 ? 'M' : 'L'} ${xForTokens(sample.tokens, plot).toFixed(2)} ${yForLoss(sample.loss, plot).toFixed(2)}`,
    )
    .join(' ')
}

const WIDE_PATHS = SWEEP.map((run) => pathFor(run.samples, WIDE_PLOT))
const NARROW_PATHS = SWEEP.map((run) => pathFor(run.samples, NARROW_PLOT))

/**
 * The ablation sweep: one line per run, one hue per hyperparameter, all of them
 * bending toward the same floor because no amount of tuning buys you past the entropy
 * of the data. Curves come from the Chinchilla fit with a per-run data penalty, so the
 * fan is a prediction rather than a drawing. Decorative - the legend and the copy
 * beside it carry the same information as text.
 */
export function LossCurve({ compact }: { compact: boolean }) {
  const plot = compact ? NARROW_PLOT : WIDE_PLOT
  const paths = compact ? NARROW_PATHS : WIDE_PATHS
  const asymptoteY = yForLoss(ASYMPTOTE, plot)
  const worstRun = SWEEP[RUNS_PER_FAMILY - 1]
  const worstTailY = yForLoss(worstRun.samples[worstRun.samples.length - 1].loss, plot)

  return (
    <svg
      viewBox={`0 0 ${plot.width} ${plot.height}`}
      className="h-auto w-full"
      role="presentation"
      aria-hidden="true"
    >
      {LOSS_TICKS.map((loss) => (
        <g key={loss}>
          <line
            x1={plot.left}
            y1={yForLoss(loss, plot)}
            x2={plot.right}
            y2={yForLoss(loss, plot)}
            className="stroke-border"
            strokeWidth={0.5}
          />
          <text
            x={plot.left - 6}
            y={yForLoss(loss, plot) + 3}
            textAnchor="end"
            fontSize={plot.fontSize}
            className="fill-muted font-mono"
          >
            {loss}
          </text>
        </g>
      ))}

      {TOKEN_TICKS.map((tick) => (
        <text
          key={tick.label}
          x={xForTokens(tick.tokens, plot)}
          y={plot.bottom + plot.fontSize + 8}
          textAnchor="middle"
          fontSize={plot.fontSize}
          className="fill-muted font-mono"
        >
          {tick.label}
        </text>
      ))}

      <line
        x1={plot.left}
        y1={asymptoteY}
        x2={plot.right}
        y2={asymptoteY}
        className="stroke-fg"
        strokeWidth={1}
        strokeDasharray="4 4"
        style={{ opacity: 0.45 }}
      />
      <text
        x={plot.left + 4}
        y={asymptoteY + plot.fontSize + 4}
        fontSize={plot.fontSize}
        className="fill-muted font-mono"
      >
        irreducible ≈ {ASYMPTOTE.toFixed(2)}
      </text>

      {SWEEP.map((run, index) => (
        <path
          key={`${run.familyId}:${run.runIndex}`}
          d={paths[index]}
          className={`fill-none ${SWEEP_STROKES[run.familyIndex]}`}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            opacity: 0.55 + (run.runIndex / (RUNS_PER_FAMILY - 1)) * 0.4,
            strokeDasharray: 1,
            animation: `ls-draw 2.2s var(--ease-out-expo) ${index * 45}ms forwards`,
          }}
        />
      ))}

      {plot.annotated && (
        <g className="fill-muted">
          <text
            x={plot.right - 12}
            y={worstTailY - 34}
            textAnchor="end"
            fontSize={plot.fontSize}
            className="fill-muted font-mono"
          >
            one more sweep and I promise I will ship
          </text>
          <path
            d={`M ${plot.right - 60} ${worstTailY - 28} L ${plot.right - 26} ${worstTailY - 6}`}
            className="stroke-muted fill-none"
            strokeWidth={1}
            markerEnd="url(#ls-sweep-arrow)"
          />
        </g>
      )}

      <defs>
        <marker id="ls-sweep-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-muted" />
        </marker>
      </defs>
    </svg>
  )
}

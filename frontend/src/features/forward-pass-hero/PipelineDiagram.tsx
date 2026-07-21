import { TARGET_MODEL } from './architecture'
import { AttentionPanel } from './diagram/AttentionPanel'
import { ContextLane } from './diagram/ContextLane'
import { LogitsPanel } from './diagram/LogitsPanel'
import { MlpPanel } from './diagram/MlpPanel'
import {
  centerX,
  panelBottom,
  rightX,
  visibleContextTokens,
  type DiagramLayout,
} from './diagram/layout'
import type { ForwardPassFrame } from './types'

function ResidualJoin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={8} className="fill-surface stroke-border" strokeWidth={1} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} className="fill-muted font-mono">
        +
      </text>
    </g>
  )
}

function NormMarker({ x, y, height }: { x: number; y: number; height: number }) {
  return (
    <g>
      <rect
        x={x}
        y={y - height / 2}
        width={8}
        height={height}
        rx={3}
        className="fill-brand-300/50 stroke-border"
        strokeWidth={1}
      />
      <text
        x={x + 4}
        y={y + height / 2 + 12}
        textAnchor="middle"
        fontSize={9}
        className="fill-muted font-mono"
      >
        ln
      </text>
    </g>
  )
}

/**
 * Decorative (aria-hidden) SVG of one pass through the target model: context and
 * embeddings on the left, a GPT-2 transformer block in the middle (LayerNorm,
 * multi-head attention, residual add, LayerNorm, GELU MLP, residual add), softmax on
 * the right, and a lane along the bottom carrying the sampled token both down into the
 * visible text and back into the context that conditions the next step. Everything it
 * draws comes from the current `frame`; the accessible bio lives outside this component.
 */
export function PipelineDiagram({
  frame,
  layout,
}: {
  frame: ForwardPassFrame
  layout: DiagramLayout
}) {
  const visibleContext = visibleContextTokens(frame.context, layout)
  const blockStart = (layout.attentionNormX ?? (layout.qkv ?? layout.attention).x) - 12
  const blockEnd = layout.mlpAddX + 14
  const blockTop = layout.panelTop - 26
  const blockHeight = panelBottom(layout) + 4 - blockTop
  const laneEndX = centerX(layout.context)
  const laneStartX = centerX(layout.logits)
  const railStart = rightX(layout.embed)
  const railEnd = (layout.unembed ?? layout.logits).x
  const normHeight = Math.min(120, layout.panelHeight * 0.5)

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="h-auto w-full"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <marker id="ls-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-brand-500" />
        </marker>
      </defs>

      <line
        x1={railStart}
        y1={layout.railY}
        x2={railEnd}
        y2={layout.railY}
        className="stroke-border"
        strokeWidth={1}
      />

      <rect
        x={blockStart}
        y={blockTop}
        width={blockEnd - blockStart}
        height={blockHeight}
        rx={12}
        className="fill-none stroke-border"
        strokeWidth={1}
        strokeDasharray="2 6"
      />
      <text
        x={(blockStart + blockEnd) / 2}
        y={blockTop - 10}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className="fill-muted font-mono"
      >
        {layout.verbose
          ? `${TARGET_MODEL.label} · transformer block × ${TARGET_MODEL.blockCount} · residual stream`
          : `block × ${TARGET_MODEL.blockCount}`}
      </text>

      {layout.attentionNormX !== null && (
        <NormMarker x={layout.attentionNormX} y={layout.railY} height={normHeight} />
      )}
      {layout.mlpNormX !== null && (
        <NormMarker x={layout.mlpNormX} y={layout.railY} height={normHeight} />
      )}
      <ResidualJoin x={layout.attentionAddX} y={layout.railY} />
      <ResidualJoin x={layout.mlpAddX} y={layout.railY} />

      <ContextLane
        visibleContext={visibleContext}
        queryIndex={frame.queryIndex}
        layout={layout}
        active={frame.activeStage === 'embed'}
        parallel={frame.phase === 'prefill'}
      />
      <AttentionPanel
        edges={frame.attention}
        visibleContext={visibleContext}
        kvCacheLength={frame.kvCacheLength}
        layout={layout}
        activeStage={
          frame.activeStage === 'qkv' || frame.activeStage === 'attention'
            ? frame.activeStage
            : null
        }
        parallel={frame.phase === 'prefill'}
      />
      <MlpPanel
        activations={frame.activations}
        layout={layout}
        active={frame.activeStage === 'mlp'}
      />
      <LogitsPanel
        candidates={frame.logits}
        emittedTokens={frame.emittedTokens}
        layout={layout}
        logitsActive={frame.activeStage === 'logits'}
        sampleActive={frame.activeStage === 'sample'}
      />

      <path
        d={`M ${laneStartX} ${layout.laneY} H ${laneEndX + 24} Q ${laneEndX} ${layout.laneY} ${laneEndX} ${layout.laneY - 24} V ${panelBottom(layout) + 12}`}
        className="fill-none stroke-brand-400"
        strokeWidth={1.5}
        strokeDasharray="4 6"
        markerEnd="url(#ls-arrow)"
        style={{
          opacity: frame.emittedTokens.length > 0 ? 0.95 : 0.3,
          animation: 'ls-flow 0.9s linear infinite',
        }}
      />
      <text
        x={(laneStartX + laneEndX) / 2}
        y={layout.laneY - 10}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className="fill-muted font-mono"
      >
        {layout.verbose
          ? 'autoregressive · the sampled token becomes the next input'
          : 'autoregressive'}
      </text>

      <line
        x1={laneStartX}
        y1={layout.laneY}
        x2={laneStartX}
        y2={layout.height - 26}
        className="stroke-brand-500"
        strokeWidth={1.5}
        markerEnd="url(#ls-arrow)"
        style={{ opacity: frame.emittedTokens.length > 0 ? 1 : 0.3 }}
      />
      <text
        x={laneStartX}
        y={layout.height - 8}
        textAnchor="middle"
        fontSize={layout.labelSize}
        className="fill-brand-700 font-mono dark:fill-brand-300"
      >
        detokenize
      </text>
    </svg>
  )
}

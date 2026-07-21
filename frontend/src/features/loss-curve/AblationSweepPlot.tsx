import { useEffect, useRef } from 'react'

import Plotly from 'plotly.js-dist-min'
import type { Config, Data, Layout, PlotData } from 'plotly.js'

import { usePrefersCompactDiagram } from '../../hooks/useMediaQuery'
import { useTheme } from '../../hooks/useTheme'
import { SWEEP_COLORS } from './palette'
import {
  asymptoticLoss,
  initialLoss,
  MODEL_PARAMETERS,
  RUNS_PER_FAMILY,
  sampleAblationSweep,
  SWEEP_FAMILIES,
  TRAINED_TOKENS,
  VOCABULARY_SIZE,
  WARMUP_TOKENS,
} from './scalingLaw'

/** Enough points for smooth curves without shipping a huge trace payload. */
const SAMPLE_COUNT = 120

/** Reads a CSS custom property off `<html>`, so the plot matches the live theme tokens. */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * The ablation sweep as an interactive Plotly figure: one line per run, one hue per
 * hyperparameter, all bending toward the same finite-model floor. Curves come from the
 * Chinchilla fit with a per-run data penalty (see `scalingLaw.ts`), so the fan is a
 * prediction, not a drawing. Default-exported and imported lazily so Plotly stays in its
 * own chunk, off the main bundle. Colours are read from CSS variables and the effect
 * re-runs on theme change, since a canvas cannot follow CSS reactively.
 */
export default function AblationSweepPlot() {
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const compact = usePrefersCompactDiagram()

  useEffect(() => {
    const element = containerRef.current
    if (element === null) {
      return
    }

    const fg = cssVar('--color-fg')
    const muted = cssVar('--color-muted')
    const border = cssVar('--color-border')

    const runs = sampleAblationSweep(SAMPLE_COUNT)
    const familyLegendShown = new Set<number>()
    const traces: Partial<PlotData>[] = runs.map((run) => {
      const showlegend = !familyLegendShown.has(run.familyIndex)
      familyLegendShown.add(run.familyIndex)
      const family = SWEEP_FAMILIES[run.familyIndex]
      return {
        x: run.samples.map((sample) => sample.tokens),
        y: run.samples.map((sample) => sample.loss),
        type: 'scatter',
        mode: 'lines',
        name: family.label,
        legendgroup: run.familyId,
        showlegend,
        line: { color: SWEEP_COLORS[run.familyIndex], width: 1.6, shape: 'spline' },
        // Well-tuned runs sit brightest; detuned siblings fade back a step each.
        opacity: 0.5 + (run.runIndex / (RUNS_PER_FAMILY - 1)) * 0.4,
        hovertemplate: `${family.label}<br>%{x:.2s} tokens · %{y:.2f} nats<extra></extra>`,
      }
    })

    const floor = asymptoticLoss(MODEL_PARAMETERS)
    const ceiling = initialLoss(VOCABULARY_SIZE)

    const layout: Partial<Layout> = {
      font: { family: 'JetBrains Mono, monospace', size: 11, color: muted },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      // Narrow screens wrap the horizontal legend onto several rows, so they get a taller
      // bottom margin to hold it clear of the axis.
      margin: { l: 52, r: 16, t: 8, b: compact ? 128 : 60 },
      hovermode: 'closest',
      hoverlabel: { font: { family: 'JetBrains Mono, monospace', size: 11 } },
      legend: {
        orientation: 'h',
        x: 0,
        y: compact ? -0.28 : -0.2,
        font: { color: muted, size: compact ? 10 : 11 },
      },
      xaxis: {
        type: 'log',
        range: [Math.log10(WARMUP_TOKENS), Math.log10(TRAINED_TOKENS)],
        tickvals: [1e7, 1e8, 1e9, 1e10],
        ticktext: ['10M', '100M', '1B', '10B'],
        gridcolor: border,
        linecolor: border,
        zeroline: false,
        tickfont: { color: muted },
      },
      yaxis: {
        title: { text: 'loss (nats)', font: { color: muted } },
        range: [floor - 0.4, ceiling + 0.2],
        gridcolor: border,
        linecolor: border,
        zeroline: false,
        tickfont: { color: muted },
      },
      shapes: [
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: floor,
          y1: floor,
          line: { color: fg, width: 1, dash: 'dash' },
          opacity: 0.4,
        },
      ],
      annotations: [
        {
          xref: 'paper',
          x: 0.01,
          xanchor: 'left',
          y: floor,
          yanchor: 'bottom',
          text: `irreducible ≈ ${floor.toFixed(2)}`,
          showarrow: false,
          font: { color: muted, size: 10 },
        },
      ],
    }

    const config: Partial<Config> = {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d', 'toggleSpikelines'],
    }

    void Plotly.react(element, traces as Data[], layout, config)
    return () => {
      Plotly.purge(element)
    }
  }, [theme, compact])

  return (
    <div
      ref={containerRef}
      className={compact ? 'mt-3 h-[28rem] w-full' : 'mt-3 h-96 w-full'}
      role="img"
      aria-label="Interactive plot: 18 simulated training-loss runs at GPT-2's 124M-parameter budget, one hue per hyperparameter, each fanning up from a well-tuned baseline toward the same finite-model loss floor."
    />
  )
}

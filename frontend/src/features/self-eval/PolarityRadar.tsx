import { useEffect, useRef } from 'react'

import Plotly from 'plotly.js-dist-min'
import type { Config, Data, Layout, PlotData } from 'plotly.js'

import { usePrefersCompactDiagram } from '../../hooks/useMediaQuery'
import { useTheme } from '../../hooks/useTheme'
import { splitRadarAxes } from './split'
import { ENGINEERING_VIRTUES, VIRTUE_SCALE_MAX, type VirtuePolarity } from './virtues'

/** Reads a CSS custom property off `<html>`, so the plot matches the live theme tokens. */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// One hue per polarity, picked per theme: strengths wear the brand blue, quirks wear amber. A
// low-alpha wash tuned for a light panel disappears over a dark one, so each theme gets its own
// line and fill. Plotly draws to its own canvas and cannot read the tree-shaken Tailwind
// `brand-*`/`attention-*` tokens.
const RADAR_COLORS = {
  light: {
    positive: { line: '#0284c7', fill: 'rgba(2, 132, 199, 0.16)' },
    negative: { line: '#d97706', fill: 'rgba(217, 119, 6, 0.16)' },
  },
  dark: {
    positive: { line: '#38bdf8', fill: 'rgba(56, 189, 248, 0.22)' },
    negative: { line: '#fbbf24', fill: 'rgba(251, 191, 36, 0.20)' },
  },
} as const

/**
 * One side of the self-eval as a radar: the strengths (positive) or the quirks (negative) as a
 * single `scatterpolar` polygon over their own spokes. Quirk spokes plot distance from a perfect
 * ten, so a proud 1/10 reaches the rim. Default-exported and lazy so Plotly stays off the main
 * bundle; colours and axes are read from CSS variables and the effect re-runs on theme or
 * polarity change. The figure is `aria-hidden`; `SelfEvalSection`'s list carries the numbers for
 * assistive tech.
 */
export default function PolarityRadar({ polarity }: { polarity: VirtuePolarity }) {
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
    const surface = cssVar('--color-surface')
    const colors = RADAR_COLORS[theme][polarity]

    const { positives, negatives } = splitRadarAxes(ENGINEERING_VIRTUES)
    const axes = polarity === 'positive' ? positives : negatives
    // Repeat the first spoke so the outline closes cleanly from the last point back to it.
    const closed = [...axes, axes[0]]

    const trace: Partial<PlotData> = {
      type: 'scatterpolar',
      mode: 'lines+markers',
      r: closed.map((axis) => axis.magnitude),
      theta: closed.map((axis) => axis.axisLabel),
      customdata: closed.map((axis) => [axis.label, axis.rating, axis.caption]),
      fill: 'toself',
      fillcolor: colors.fill,
      line: { color: colors.line, width: 2.5, shape: 'linear' },
      marker: { color: colors.line, size: 8, line: { color: surface, width: 2 } },
      hovertemplate: `%{customdata[0]}<br>%{customdata[1]}/${VIRTUE_SCALE_MAX} · %{customdata[2]}<extra></extra>`,
    }

    // Long axis labels sit in the plot's margins; a narrow viewport needs wider horizontal
    // margins and a smaller tick font so they fit rather than clip at the container edge.
    const labelSize = compact ? 10 : 12
    const sideMargin = compact ? 82 : 96
    const layout: Partial<Layout> = {
      font: { family: 'JetBrains Mono, monospace', size: 11, color: muted },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: sideMargin, r: sideMargin, t: 56, b: 56 },
      showlegend: false,
      hoverlabel: { font: { family: 'JetBrains Mono, monospace', size: 11 } },
      polar: {
        bgcolor: 'rgba(0,0,0,0)',
        radialaxis: {
          range: [0, VIRTUE_SCALE_MAX],
          tickvals: [2, 4, 6, 8, 10],
          showticklabels: false,
          gridcolor: border,
          linecolor: border,
        },
        angularaxis: {
          gridcolor: border,
          linecolor: border,
          tickfont: { color: fg, size: labelSize },
        },
      },
    }

    const config: Partial<Config> = {
      displaylogo: false,
      responsive: true,
      displayModeBar: false,
    }

    void Plotly.react(element, [trace] as Data[], layout, config)
    return () => {
      Plotly.purge(element)
    }
  }, [theme, compact, polarity])

  return (
    <div
      ref={containerRef}
      className={compact ? 'mt-2 h-[28rem] w-full' : 'mt-2 h-[30rem] w-full'}
      aria-hidden="true"
    />
  )
}

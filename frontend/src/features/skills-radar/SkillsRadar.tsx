import { useEffect, useRef } from 'react'

import Plotly from 'plotly.js-dist-min'
import type { Config, Data, Layout, PlotData } from 'plotly.js'

import { usePrefersCompactDiagram } from '../../hooks/useMediaQuery'
import { useTheme } from '../../hooks/useTheme'
import { ENGINEERING_VIRTUES, VIRTUE_SCALE_MAX } from './virtues'

/** Reads a CSS custom property off `<html>`, so the plot matches the live theme tokens. */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Brand sky, theme-independent like the sweep's line colours: Plotly draws to its own
// canvas and cannot consume the Tailwind `brand-*` tokens (which tree-shake away once no
// utility references them). One trace only, so no distinction is ever hue-coded.
const RADAR_LINE = '#0ea5e9'
const RADAR_FILL = 'rgba(14, 165, 233, 0.18)'

/**
 * The engineering-virtues radar: one `scatterpolar` polygon over self-assessed stances,
 * scored 0-`VIRTUE_SCALE_MAX`. Default-exported and imported lazily so Plotly stays in its
 * own chunk, off the main bundle. Axis and text colours are read from CSS variables and the
 * effect re-runs on theme change, since a canvas cannot follow CSS reactively. The figure
 * is `aria-hidden`; `SkillsRadarSection`'s list carries the same numbers for assistive tech.
 */
export default function SkillsRadar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const compact = usePrefersCompactDiagram()

  useEffect(() => {
    const element = containerRef.current
    if (element === null) {
      return
    }

    const muted = cssVar('--color-muted')
    const border = cssVar('--color-border')

    // Repeat the first vertex so the outline closes cleanly from the last point back to it.
    const closed = [...ENGINEERING_VIRTUES, ENGINEERING_VIRTUES[0]]
    const trace: Partial<PlotData> = {
      type: 'scatterpolar',
      mode: 'lines+markers',
      r: closed.map((virtue) => virtue.rating),
      theta: closed.map((virtue) => virtue.axisLabel),
      customdata: closed.map((virtue) => [virtue.label, virtue.caption]),
      fill: 'toself',
      fillcolor: RADAR_FILL,
      line: { color: RADAR_LINE, width: 2, shape: 'linear' },
      marker: { color: RADAR_LINE, size: 5 },
      hovertemplate: `%{customdata[0]}<br>%{r}/${VIRTUE_SCALE_MAX} · %{customdata[1]}<extra></extra>`,
    }

    // Long axis labels sit in the plot's margins; a narrow viewport needs wider horizontal
    // margins and a smaller tick font so they fit rather than clip at the container edge.
    const labelSize = compact ? 9 : 10
    const sideMargin = compact ? 74 : 84
    const layout: Partial<Layout> = {
      font: { family: 'JetBrains Mono, monospace', size: 11, color: muted },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: sideMargin, r: sideMargin, t: 48, b: 48 },
      showlegend: false,
      hoverlabel: { font: { family: 'JetBrains Mono, monospace', size: 11 } },
      polar: {
        bgcolor: 'rgba(0,0,0,0)',
        radialaxis: {
          range: [0, VIRTUE_SCALE_MAX],
          tickvals: [2, 4, 6, 8, 10],
          // The grid rings stay; the numbers overlap the east label and the exact values
          // already live in the hover and the section's screen-reader list.
          showticklabels: false,
          gridcolor: border,
          linecolor: border,
        },
        angularaxis: {
          gridcolor: border,
          linecolor: border,
          tickfont: { color: muted, size: labelSize },
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
  }, [theme, compact])

  return (
    <div
      ref={containerRef}
      className={compact ? 'mt-2 h-[28rem] w-full' : 'mt-2 h-[26rem] w-full'}
      aria-hidden="true"
    />
  )
}

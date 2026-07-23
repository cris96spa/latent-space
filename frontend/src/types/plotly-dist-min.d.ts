// `plotly.js-dist-min` ships the minified bundle without types. `@types/plotly.js`
// covers the API surface under the `plotly.js` module name, so this shim re-declares the
// handful of calls we make against the dist build using those published types.
declare module 'plotly.js-dist-min' {
  import type { Config, Data, Layout, PlotlyHTMLElement } from 'plotly.js'

  const Plotly: {
    react(
      root: HTMLElement,
      data: Data[],
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<PlotlyHTMLElement>
    purge(root: HTMLElement): void
  }
  export default Plotly
}

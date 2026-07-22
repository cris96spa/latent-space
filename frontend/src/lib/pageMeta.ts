/** Per-route document titles and descriptions. Authored copy, kept out of components. */
export const PAGE_META = {
  home: {
    title: 'latent-space — Cristian C. Spagnuolo',
    description:
      'Cristian C. Spagnuolo, NLP engineer: I make language models run faster, fit in less GPU memory, and stop confidently inventing things. Part portfolio, part lab notebook.',
  },
  projects: {
    title: 'Projects — latent-space',
    description:
      'Things I build to actually understand them — usually by rebuilding them from scratch. Weights not included; the code is.',
  },
  writing: {
    title: 'Writing — latent-space',
    description:
      'Notes from the lab notebook: training runs, papers I could not stop thinking about, and the occasional LLM tangent. Published on Substack.',
  },
  resume: {
    title: 'Resume — Cristian C. Spagnuolo',
    description:
      'The formal version: roles, dates, and grades for Cristian C. Spagnuolo, NLP engineer in Lugano. Downloadable PDF and direct contact links.',
  },
  notFound: {
    title: '404 — latent-space',
    description: 'This route is not in the vocabulary. Everything real is one hop back.',
  },
} as const

export const EXTERNAL_LINKS = {
  github: 'https://github.com/cris96spa',
  linkedin: 'https://www.linkedin.com/in/cristian-c-spagnuolo/',
  email: 'mailto:cristian.c.spagnuolo@gmail.com',
  /** The public model whose config the hero's diagram labels are taken from. */
  gpt2Model: 'https://huggingface.co/openai-community/gpt2',
  /** The Smol Training Playbook, whose hero banner the chat's opener replots (CC-BY 4.0). */
  smolPlaybook: 'https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook',
  // TODO(content): Cristian's Substack publication does not exist yet. This points at
  // Substack's home so the "Follow" affordance is never dead; replace with the real
  // publication URL (e.g. https://<name>.substack.com) when it exists.
  substack: 'https://substack.com/',
} as const

/**
 * Same-origin path to the résumé PDF. Served as a frontend static asset (from
 * `frontend/public/`), so it downloads and previews even when the API is down - the
 * résumé is core content and must not depend on backend readiness.
 */
export const RESUME_PDF = {
  path: '/Cristian_C_Spagnuolo_CV.pdf',
  downloadName: 'Cristian_C_Spagnuolo_CV.pdf',
} as const

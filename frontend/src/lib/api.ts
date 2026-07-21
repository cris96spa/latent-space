const API_BASE_URL = '/api'

export interface HealthStatus {
  status: string
}

/** A scripted-chat question and its authored answer, ready to render. */
export interface ChatEntry {
  readonly slug: string
  readonly question: string
  readonly category: string
  /** Server-sanitized HTML; the frontend renders it as-is and never sanitizes. */
  readonly answerHtml: string
}

/** Wire shape of a chat entry: the backend serializes `answer_html` in snake_case. */
interface ChatEntryWire {
  readonly slug: string
  readonly question: string
  readonly category: string
  readonly answer_html: string
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export function getHealth(): Promise<HealthStatus> {
  return fetchJson<HealthStatus>('/health')
}

/** Fetches the published scripted-chat entries in display order. */
export async function getChatEntries(): Promise<ChatEntry[]> {
  const entries = await fetchJson<ChatEntryWire[]>('/chat/entries')
  return entries.map((entry) => ({
    slug: entry.slug,
    question: entry.question,
    category: entry.category,
    answerHtml: entry.answer_html,
  }))
}

/** A portfolio project as listed on the index: metadata without the body. */
export interface Project {
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly stack: readonly string[]
  readonly tags: readonly string[]
  readonly repositoryUrl: string | null
  readonly demoUrl: string | null
  readonly coverImage: string | null
  /** ISO `YYYY-MM-DD`; the backend returns projects newest-first. */
  readonly publishedAt: string
  readonly updatedAt: string | null
}

/** A single project including its server-sanitized HTML body. */
export interface ProjectDetail extends Project {
  /** Server-sanitized HTML; the frontend renders it as-is and never sanitizes. */
  readonly bodyHtml: string
}

/** Wire shape of a project: the backend serializes metadata in snake_case. */
interface ProjectWire {
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly stack: readonly string[]
  readonly tags: readonly string[]
  readonly repository_url: string | null
  readonly demo_url: string | null
  readonly cover_image: string | null
  readonly published_at: string
  readonly updated_at: string | null
}

interface ProjectDetailWire extends ProjectWire {
  readonly body_html: string
}

function toProject(wire: ProjectWire): Project {
  return {
    slug: wire.slug,
    title: wire.title,
    summary: wire.summary,
    stack: wire.stack,
    tags: wire.tags,
    repositoryUrl: wire.repository_url,
    demoUrl: wire.demo_url,
    coverImage: wire.cover_image,
    publishedAt: wire.published_at,
    updatedAt: wire.updated_at,
  }
}

/** Fetches the published projects, most recently published first. */
export async function getProjects(): Promise<Project[]> {
  const projects = await fetchJson<ProjectWire[]>('/projects')
  return projects.map(toProject)
}

/** Fetches one published project by slug, including its rendered body. Rejects on 404. */
export async function getProject(slug: string): Promise<ProjectDetail> {
  const wire = await fetchJson<ProjectDetailWire>(`/projects/${encodeURIComponent(slug)}`)
  return { ...toProject(wire), bodyHtml: wire.body_html }
}

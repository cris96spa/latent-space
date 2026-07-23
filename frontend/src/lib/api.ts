const API_BASE_URL = '/api'

export interface HealthStatus {
  status: string
}

/** A rich, non-text widget an answer carries, declared in its frontmatter. */
export type AnswerAttachment = 'resume' | 'playbook-banner'

/** A scripted-chat question and its authored answer, ready to render. */
export interface ChatEntry {
  readonly publicIdentifier: string
  readonly question: string
  readonly category: string
  /** Rich widget rendered beneath the answer, or `null` for a plain answer. */
  readonly attachment: AnswerAttachment | null
  /** Server-sanitized HTML; the frontend renders it as-is and never sanitizes. */
  readonly answerHtml: string
}

/** Wire shape of a chat entry: the backend serializes `answer_html` in snake_case. */
interface ChatEntryWire {
  readonly public_identifier: string
  readonly question: string
  readonly category: string
  readonly attachment: AnswerAttachment | null
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
    publicIdentifier: entry.public_identifier,
    question: entry.question,
    category: entry.category,
    attachment: entry.attachment,
    answerHtml: entry.answer_html,
  }))
}

/** One GPT-2 token: its id and the characters attributed to it ('' for a continuation). */
export interface TokenSpan {
  readonly id: number
  readonly text: string
}

/** Real GPT-2 tokenization of a piece of text, with counts. */
export interface Tokenization {
  readonly tokens: readonly TokenSpan[]
  readonly tokenCount: number
  readonly wordCount: number
  readonly charCount: number
}

/** Wire shape of a tokenization: the backend serializes counts in snake_case. */
interface TokenizationWire {
  readonly tokens: readonly { id: number; text: string }[]
  readonly token_count: number
  readonly word_count: number
  readonly char_count: number
}

/** Tokenizes `text` with the backend GPT-2 tokenizer. */
export async function tokenize(text: string): Promise<Tokenization> {
  const response = await fetch(`${API_BASE_URL}/tokenize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) {
    throw new Error(`POST /tokenize failed with status ${response.status}`)
  }
  const wire = (await response.json()) as TokenizationWire
  return {
    tokens: wire.tokens.map((token) => ({ id: token.id, text: token.text })),
    tokenCount: wire.token_count,
    wordCount: wire.word_count,
    charCount: wire.char_count,
  }
}

/** A portfolio project as listed on the index: metadata without the body. */
export interface Project {
  readonly publicIdentifier: string
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
  readonly public_identifier: string
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
    publicIdentifier: wire.public_identifier,
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

/** Fetches one published project by public identifier, including its body. Rejects on 404. */
export async function getProject(publicIdentifier: string): Promise<ProjectDetail> {
  const wire = await fetchJson<ProjectDetailWire>(
    `/projects/${encodeURIComponent(publicIdentifier)}`,
  )
  return { ...toProject(wire), bodyHtml: wire.body_html }
}

/** A published post: an outbound link to writing hosted elsewhere (Substack). */
export interface Post {
  readonly publicIdentifier: string
  readonly title: string
  readonly summary: string
  /** Absolute URL of the post on its host (Substack). */
  readonly externalUrl: string
  readonly tags: readonly string[]
  readonly coverImage: string | null
  /** ISO `YYYY-MM-DD`; the backend returns posts newest-first. */
  readonly publishedAt: string
  readonly updatedAt: string | null
}

/** Wire shape of a post: the backend serializes metadata in snake_case. */
interface PostWire {
  readonly public_identifier: string
  readonly title: string
  readonly summary: string
  readonly external_url: string
  readonly tags: readonly string[]
  readonly cover_image: string | null
  readonly published_at: string
  readonly updated_at: string | null
}

function toPost(wire: PostWire): Post {
  return {
    publicIdentifier: wire.public_identifier,
    title: wire.title,
    summary: wire.summary,
    externalUrl: wire.external_url,
    tags: wire.tags,
    coverImage: wire.cover_image,
    publishedAt: wire.published_at,
    updatedAt: wire.updated_at,
  }
}

/** Fetches the published posts, most recently published first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await fetchJson<PostWire[]>('/posts')
  return posts.map(toPost)
}

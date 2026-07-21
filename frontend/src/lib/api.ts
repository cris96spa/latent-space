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

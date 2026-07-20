const API_BASE_URL = '/api'

export interface HealthStatus {
  status: string
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

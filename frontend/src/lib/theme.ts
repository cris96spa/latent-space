export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ls-theme'

export function resolveInitialTheme(): Theme {
  const stored = readStoredTheme()
  if (stored) {
    return stored
  }
  return prefersDark() ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Persisting the preference is best-effort; the class is still applied.
  }
}

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function prefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

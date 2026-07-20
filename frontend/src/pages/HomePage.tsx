import { useEffect, useState } from 'react'

import { getHealth } from '../lib/api'

type HealthProbe =
  | { state: 'checking' }
  | { state: 'ok'; status: string }
  | { state: 'unreachable'; detail: string }

export function HomePage() {
  const [probe, setProbe] = useState<HealthProbe>({ state: 'checking' })

  useEffect(() => {
    let subscribed = true
    getHealth()
      .then((health) => {
        if (subscribed) {
          setProbe({ state: 'ok', status: health.status })
        }
      })
      .catch((error: unknown) => {
        if (subscribed) {
          const detail = error instanceof Error ? error.message : 'unknown error'
          setProbe({ state: 'unreachable', detail })
        }
      })
    return () => {
      subscribed = false
    }
  }, [])

  return (
    <section>
      <h1>latent-space</h1>
      <p>
        Nothing is trained yet. This is the skeleton: a single forward pass from
        React to FastAPI and back, wired up just far enough to prove the pipeline
        has a pulse.
      </p>
      <p>
        <code>/health</code>{' '}
        {probe.state === 'checking' && <span>taking the backend&rsquo;s pulse&hellip;</span>}
        {probe.state === 'ok' && <span>reports: {probe.status}</span>}
        {probe.state === 'unreachable' && (
          <span>is unreachable ({probe.detail}) &mdash; is the backend running?</span>
        )}
      </p>
    </section>
  )
}

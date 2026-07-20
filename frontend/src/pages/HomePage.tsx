import { useEffect, useState } from 'react'

import { ButtonLink } from '../components/ButtonLink'
import { Card } from '../components/Card'
import { TokenChip, type TokenTone } from '../components/TokenChip'
import { getHealth } from '../lib/api'
import { EXTERNAL_LINKS } from '../lib/links'

type HealthProbe =
  | { state: 'checking' }
  | { state: 'ok'; status: string }
  | { state: 'unreachable'; detail: string }

const PROMPT_TOKENS = ['who', 'is', 'Cristian', '?']

const STACK_TOKENS = ['PyTorch', 'vLLM', 'FastAPI', 'Docker', 'MLflow', 'uv']

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
    <div className="space-y-12">
      <section className="space-y-6">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          checkpoint 00 · skeleton
        </p>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          who is <span className="text-brand-600 dark:text-brand-400">Cristian</span>?
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {PROMPT_TOKENS.map((token, index) => (
            <TokenChip key={index} tone="brand">
              {token}
            </TokenChip>
          ))}
          <span className="font-mono text-sm text-muted" aria-hidden="true">
            → embed → attention → mlp → logits
          </span>
        </div>

        <p className="max-w-2xl text-lg text-muted">
          Nothing is trained yet. This is the skeleton: a single forward pass from React to
          FastAPI and back, wired up just far enough to prove the pipeline has a pulse. The
          animated hero that streams this bio token by token comes next.
        </p>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href={EXTERNAL_LINKS.github} target="_blank" rel="noreferrer noopener">
            Read the source
          </ButtonLink>
          <ButtonLink
            variant="ghost"
            href={EXTERNAL_LINKS.linkedin}
            target="_blank"
            rel="noreferrer noopener"
          >
            The formal narrative
          </ButtonLink>
        </div>
      </section>

      <Card className="space-y-3">
        <p className="font-mono text-xs text-muted">GET /api/health</p>
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-muted" aria-hidden="true">
            →
          </span>
          <HealthChip probe={probe} />
        </div>
        <p className="text-sm text-muted">
          The frontend just asked the backend if it was awake. That request is the whole
          product right now, and it is the seam everything else gets built onto.
        </p>
      </Card>

      <section className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          tokens in the vocabulary
        </p>
        <div className="flex flex-wrap gap-2">
          {STACK_TOKENS.map((token) => (
            <TokenChip key={token} tone="neutral">
              {token}
            </TokenChip>
          ))}
        </div>
      </section>
    </div>
  )
}

function HealthChip({ probe }: { probe: HealthProbe }) {
  const presentation: Record<HealthProbe['state'], { tone: TokenTone; label: string }> = {
    checking: { tone: 'neutral', label: 'taking the pulse…' },
    ok: { tone: 'brand', label: probe.state === 'ok' ? probe.status : 'ok' },
    unreachable: { tone: 'attention', label: 'unreachable' },
  }
  const { tone, label } = presentation[probe.state]

  return (
    <>
      <TokenChip tone={tone}>{label}</TokenChip>
      {probe.state === 'unreachable' && (
        <span className="text-muted">({probe.detail}) — is the backend running?</span>
      )}
    </>
  )
}

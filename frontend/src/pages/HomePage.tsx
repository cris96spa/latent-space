import { ForwardPassHero } from '../features/forward-pass-hero'
import { TrainingRunStrip } from '../features/loss-curve'
import { TokenChip } from '../components/TokenChip'

const STACK_TOKENS = ['PyTorch', 'vLLM', 'TensorRT', 'FastAPI', 'Docker', 'MLflow', 'uv']

export function HomePage() {
  return (
    <div className="space-y-16">
      <ForwardPassHero />

      <TrainingRunStrip />

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

import { TextLink } from '../../components/TextLink'
import { usePrefersCompactDiagram } from '../../hooks/useMediaQuery'
import { EXTERNAL_LINKS } from '../../lib/links'
import { LossCurve } from './LossCurve'
import { SWEEP_SWATCHES } from './palette'
import {
  asymptoticLoss,
  MODEL_PARAMETERS,
  RUNS_PER_FAMILY,
  SWEEP_FAMILIES,
  TRAINED_TOKENS,
  chinchillaLoss,
} from './scalingLaw'

/**
 * A hyperparameter sweep rendered from the scaling law: one band per knob, one line
 * per run. The legend is real markup rather than SVG text so the colour mapping keeps
 * its contrast and wraps on small screens.
 */
export function TrainingRunStrip() {
  const compact = usePrefersCompactDiagram()
  const baselineLoss = chinchillaLoss(MODEL_PARAMETERS, TRAINED_TOKENS)
  const floor = asymptoticLoss(MODEL_PARAMETERS)

  return (
    <section
      aria-labelledby="training-run-heading"
      className="space-y-5 rounded-xl border border-border bg-surface/50 p-4 sm:p-6"
    >
      <div className="max-w-2xl space-y-2">
        <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
          ablation sweep ·{' '}
          <TextLink
            href={EXTERNAL_LINKS.chinchillaPaper}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono tracking-widest"
          >
            chinchilla fit
          </TextLink>
        </p>
        <h2 id="training-run-heading" className="text-xl font-semibold tracking-tight">
          I want to look at training losses for the rest of my life
        </h2>
        <p className="text-sm text-muted">
          {SWEEP_FAMILIES.length * RUNS_PER_FAMILY} runs of an 8B model, one hue per knob, each
          swept from well-tuned to visibly regretted. Detuning does not change where a run ends
          up — {floor.toFixed(2)} nats, the entropy of the data, is not negotiable — it changes
          how many tokens you burn getting there. Tune the learning rate first; the top band is
          not an accident.
        </p>
      </div>

      <LossCurve compact={compact} />

      <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Swept hyperparameters">
        {SWEEP_FAMILIES.map((family, index) => (
          <li key={family.id} className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className={`inline-block size-2.5 rounded-[2px] ${SWEEP_SWATCHES[index]}`} />
            {family.label}
          </li>
        ))}
      </ul>

      <p className="font-mono text-xs text-muted">
        baseline · {baselineLoss.toFixed(2)} nats after 15T tokens
      </p>
    </section>
  )
}

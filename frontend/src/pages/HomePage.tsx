import { Link } from 'react-router-dom'

import { ButtonLink } from '../components/ButtonLink'
import { SectionHeading } from '../components/SectionHeading'
import { TokenChip } from '../components/TokenChip'
import { buttonClassName } from '../components/button-variants'
import { ChatSection } from '../features/chat'
import { ForwardPassHero } from '../features/forward-pass-hero'
import { EXTERNAL_LINKS } from '../lib/links'

const STACK_TOKENS = ['PyTorch', 'vLLM', 'TensorRT', 'FastAPI', 'Docker', 'MLflow', 'uv']

export function HomePage() {
  return (
    <div className="space-y-16">
      <ForwardPassHero />

      <ChatSection />

      <section className="space-y-6">
        <SectionHeading eyebrow="next tokens" title="Keep decoding">
          The hero streamed the short version, and the box above answers the follow-ups. The
          rest is one click away.
        </SectionHeading>

        <div className="flex flex-wrap gap-3">
          <Link to="/resume" className={buttonClassName('primary')}>
            The résumé →
          </Link>
          <Link to="/projects" className={buttonClassName('ghost')}>
            The projects →
          </Link>
          <ButtonLink variant="ghost" href={EXTERNAL_LINKS.email}>
            Say hello →
          </ButtonLink>
        </div>

        <p className="text-sm text-muted">
          Fair warning: the résumé is far less fun than this page.
        </p>

        <div className="space-y-3 pt-2">
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
        </div>
      </section>
    </div>
  )
}

import { PageMeta } from '../components/PageMeta'
import { TokenChip } from '../components/TokenChip'
import { ChatSection } from '../features/chat'
import { ForwardPassHero } from '../features/forward-pass-hero'
import { SkillsRadarSection } from '../features/skills-radar'
import { PAGE_META } from '../lib/pageMeta'

// The active vocabulary: the languages, frameworks, and infrastructure Cristian reaches for
// most, grounded in the CV skills section. Edit here when the CV's skills change.
const VOCABULARY_TOKENS = [
  'Python',
  'Java',
  'C++',
  'C',
  'Assembly',
  'SQL',
  'PyTorch',
  'TensorFlow',
  'scikit-learn',
  'NumPy',
  'Pandas',
  'Polars',
  'Matplotlib',
  'Plotly',
  'Gymnasium',
  'Hugging Face',
  'LangChain',
  'LangGraph',
  'vLLM',
  'TensorRT',
  'MLflow',
  'Ollama',
  'OpenAI',
  'Gemini',
  'Vertex AI',
  'Mistral',
  'Qwen',
  'DeepSeek',
  'FastAPI',
  'Django',
  'Docker',
  'Docker Compose',
  'Traefik',
  'uv',
  'Make',
  'Git',
  'GitHub',
  'GCP',
  'AWS',
  'Azure',
  'Firebase',
  'MongoDB',
  'Neo4j',
  'Node-RED',
]

export function HomePage() {
  return (
    <div className="space-y-16">
      <PageMeta {...PAGE_META.home} />
      <ForwardPassHero />

      <ChatSection />

      <section aria-labelledby="vocabulary-heading" className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">vocabulary</p>
          <h2
            id="vocabulary-heading"
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Tokens in the vocabulary
          </h2>
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Skills and tooling">
          {VOCABULARY_TOKENS.map((token) => (
            <li key={token}>
              <TokenChip tone="neutral">{token}</TokenChip>
            </li>
          ))}
        </ul>

        <SkillsRadarSection />
      </section>
    </div>
  )
}

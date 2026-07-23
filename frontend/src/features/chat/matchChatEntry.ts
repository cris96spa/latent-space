import type { ChatEntry } from '../../lib/api'

/** Minimum keyword overlap for typed input to count as a match rather than a miss. */
const MIN_MATCH_SCORE = 1

// Function words carry no intent, so they are dropped before scoring; otherwise
// "what is your ..." would match every entry on "your". Words that also act as
// signal here (about, show, look, first, start) are deliberately left out.
const STOP_WORDS: ReadonlySet<string> = new Set([
  'what', 'whats', 'is', 'are', 'was', 'were', 'you', 'your', 'yours', 'the', 'a', 'an',
  'do', 'does', 'did', 'how', 'can', 'could', 'would', 'i', 'me', 'my', 'of', 'to', 'and',
  'on', 'in', 'for', 'with', 'tell', 'give', 'please', 'hey', 'hi', 'hello', 'so', 'that',
])

// Extra vocabulary per category, so typed synonyms reach the right entry even when they
// do not appear in the authored question. Most signal still comes from the question text.
const CATEGORY_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  meta: ['why', 'portfolio', 'site', 'forward', 'pass', 'animate', 'different', 'normal'],
  build: [
    'gpt', 'gpt2', 'scratch', 'rebuild', 'rebuilt', 'build', 'built', 'implement',
    'implemented', 'pytorch', 'karpathy',
  ],
  concepts: [
    'attention', 'softmax', 'qkv', 'query', 'key', 'value', 'heads', 'transformer', 'explain',
  ],
  inference: [
    'cheaper', 'cheap', 'cost', 'costs', 'faster', 'fast', 'speed', 'optimize', 'optimization',
    'inference', 'quantization', 'quantize', 'quantized', 'distillation', 'distill', 'fp8',
    'int8', 'bf16', 'gpu', 'memory', 'efficient', 'latency', 'throughput', 'serving',
  ],
  evals: [
    'eval', 'evals', 'evaluation', 'evaluate', 'good', 'benchmark', 'benchmarks', 'metric',
    'metrics', 'test', 'tests', 'regression', 'quality', 'perplexity', 'measure',
  ],
  reading: [
    'read', 'reading', 'book', 'books', 'playbook', 'smol', 'smollm', 'huggingface', 'blog',
    'recommend', 'recommendation', 'article', 'paper', 'papers', 'training', 'loss', 'curves',
    'ablation', 'ablations', 'year',
  ],
  research: [
    'thesis', 'teleport', 'teleportation', 'mdp', 'curriculum', 'rl', 'reinforcement',
    'research', 'master', 'masters', 'horizon',
  ],
  opinion: [
    'overrated', 'overhyped', 'hype', 'hyped', 'hot', 'take', 'opinion', 'unpopular',
    'conscious', 'agi', 'bubble',
  ],
  human: [
    'hobby', 'hobbies', 'life', 'fun', 'free', 'weekend', 'motorcycle', 'ride', 'riding',
    'travel', 'game', 'games', 'videogame', 'videogames', 'anime', 'manga', 'food', 'gym',
    'outside',
  ],
  resume: [
    'resume', 'cv', 'hire', 'hireable', 'hiring', 'contact', 'email', 'download', 'pdf',
    'career', 'experience',
  ],
}

// Combining diacritical marks occupy U+0300–U+036F. NFD splits an accented letter into
// its base plus one of these marks; dropping the marks turns "résumé" into "resume".
const COMBINING_MARK_START = 0x0300
const COMBINING_MARK_END = 0x036f

/** Lowercases, strips diacritics ("résumé" → "resume"), and drops non-word characters. */
function normalize(text: string): string {
  let stripped = ''
  for (const character of text.toLowerCase().normalize('NFD')) {
    const code = character.codePointAt(0) ?? 0
    if (code < COMBINING_MARK_START || code > COMBINING_MARK_END) {
      stripped += character
    }
  }
  return stripped
}

/** The meaningful, non-stopword tokens of a phrase. */
function contentTokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
}

/** The full keyword set an entry matches against: its question words plus synonyms. */
function keywordsFor(entry: ChatEntry): Set<string> {
  const keywords = new Set(contentTokens(entry.question))
  keywords.add(normalize(entry.category))
  for (const synonym of CATEGORY_SYNONYMS[entry.category] ?? []) {
    keywords.add(synonym)
  }
  return keywords
}

/**
 * Maps free-text input to the closest chat entry by keyword overlap, or `null` when
 * nothing clears `MIN_MATCH_SCORE` (the caller then shows the in-voice fallback).
 *
 * Deliberately simple - good suggested prompts carry the primary path, and a real
 * retrieval/LLM responder (task 15) is the answer to genuinely free-form questions.
 * Ties break toward the earlier entry, which the API already sorts by display order.
 */
export function matchChatEntry(input: string, entries: readonly ChatEntry[]): ChatEntry | null {
  const inputTokens = contentTokens(input)
  if (inputTokens.length === 0) {
    return null
  }

  let best: ChatEntry | null = null
  let bestScore = 0
  for (const entry of entries) {
    const keywords = keywordsFor(entry)
    const score = inputTokens.reduce((total, token) => total + (keywords.has(token) ? 1 : 0), 0)
    if (score > bestScore) {
      best = entry
      bestScore = score
    }
  }

  return bestScore >= MIN_MATCH_SCORE ? best : null
}

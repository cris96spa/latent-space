import { hashUnitInterval, softmax } from './sampling'
import type {
  AttentionEdge,
  ContextToken,
  ForwardPassFrame,
  ForwardPassPhase,
  LogitCandidate,
  StageId,
  Token,
} from './types'

/** The stages of one pass, in execution order; also the prefill storyboard. */
export const FORWARD_PASS_STAGES: readonly StageId[] = [
  'embed',
  'qkv',
  'attention',
  'mlp',
  'logits',
  'sample',
]

export const MLP_UNIT_COUNT = 12
export const TOP_K = 5

/** How many earlier positions a head is drawn attending over. */
const ATTENTION_WINDOW = 8

const PROPER_NOUN_SALIENCE = 3.4
const DELIMITER_SALIENCE = 2.9
const BACKGROUND_SALIENCE = 0.2
const RECENCY_PEAK = 3.0
const RECENCY_DECAY = 0.62
const CONTENT_LENGTH_WEIGHT = 0.34
const CONTENT_JITTER = 1.1
const MAX_CONTENT_LENGTH = 8

const MIN_LOGIT_MARGIN = 0.08
const LOGIT_MARGIN_STEP = 0.6
const LOGIT_MARGIN_SPREAD = 2.2

const PREFILL_STAGE_DELAY_MS: Record<StageId, number> = {
  embed: 380,
  qkv: 480,
  attention: 700,
  mlp: 480,
  logits: 560,
  sample: 420,
}

const PHASE_DELAY_MS: Record<ForwardPassPhase, number> = {
  tokenize: 170,
  prefill: 460,
  decode: 38,
  complete: 0,
}

const DISTRACTOR_VOCABULARY: readonly string[] = [
  ' the',
  ' a',
  ' and',
  ' models',
  ' inference',
  ' PyTorch',
  ' GPU',
  ' loss',
  ' attention',
  ' gradients',
  ' tokens',
  ' latency',
]

function isProperNoun(token: ContextToken): boolean {
  return /^[A-Z]/.test(token.text.trim())
}

function isDelimiter(token: ContextToken): boolean {
  return /^[^\sA-Za-z0-9]+$/.test(token.text.trim())
}

export interface AttentionHeadSpec {
  readonly index: number
  readonly label: string
  /** Pre-softmax score for one key, given its distance back from the query. */
  readonly salience: (token: ContextToken, distance: number, seed: string) => number
}

/**
 * Four hand-authored heads with legible specialisations, in the spirit of the
 * positional and induction heads people actually find when they go looking inside a
 * small transformer. Nothing here is learned; the scores exist so the heatmap
 * disagrees with itself the way a real attention pattern does.
 */
export const ATTENTION_HEADS: readonly AttentionHeadSpec[] = [
  {
    index: 0,
    label: 'recency',
    salience: (_token, distance) => RECENCY_PEAK - distance * RECENCY_DECAY,
  },
  {
    index: 1,
    label: 'proper-noun',
    salience: (token) => (isProperNoun(token) ? PROPER_NOUN_SALIENCE : BACKGROUND_SALIENCE),
  },
  {
    index: 2,
    label: 'delimiter',
    salience: (token) => (isDelimiter(token) ? DELIMITER_SALIENCE : BACKGROUND_SALIENCE),
  },
  {
    index: 3,
    label: 'content',
    salience: (token, _distance, seed) =>
      Math.min(token.text.trim().length, MAX_CONTENT_LENGTH) * CONTENT_LENGTH_WEIGHT +
      hashUnitInterval(`${seed}:${token.text}`) * CONTENT_JITTER,
  },
]

/**
 * Every drawn head's attention over the last `ATTENTION_WINDOW` positions for one
 * step. Each head's weights are an independent softmax, so they sum to 1 per head and
 * the heatmap can be read row by row without renormalising.
 */
export function attentionEdgesForStep(
  context: readonly ContextToken[],
  queryIndex: number,
  step: number,
): AttentionEdge[] {
  const windowStart = Math.max(0, queryIndex - ATTENTION_WINDOW + 1)
  const keys = context.slice(windowStart, queryIndex + 1)
  if (keys.length === 0) {
    return []
  }
  return ATTENTION_HEADS.flatMap((head) => {
    const seed = `head:${head.index}:${step}`
    const scores = keys.map((key) => head.salience(key, queryIndex - key.index, seed))
    return softmax(scores).map((weight, offset) => ({
      head: head.index,
      keyIndex: keys[offset].index,
      weight,
    }))
  })
}

/** Post-SwiGLU magnitudes for the drawn hidden units, in `[0, 1)` and stable per step. */
export function mlpActivationsForStep(step: number): number[] {
  return Array.from({ length: MLP_UNIT_COUNT }, (_, unit) =>
    hashUnitInterval(`mlp:${step}:${unit}`),
  )
}

/** The candidate pool: what the bio actually says, plus a little shop talk. */
export function buildDistractorVocabulary(outputTokens: readonly Token[]): string[] {
  return [...new Set([...outputTokens.map((token) => token.text), ...DISTRACTOR_VOCABULARY])]
}

function pickDistractors(
  step: number,
  selectedText: string,
  vocabulary: readonly string[],
  count: number,
): string[] {
  const start = Math.floor(hashUnitInterval(`vocab:${step}`) * vocabulary.length)
  const picked: string[] = []
  for (let offset = 0; offset < vocabulary.length && picked.length < count; offset++) {
    const candidate = vocabulary[(start + offset) % vocabulary.length]
    if (candidate !== selectedText && !picked.includes(candidate)) {
      picked.push(candidate)
    }
  }
  return picked
}

/**
 * The top-`TOP_K` next-token distribution for one generation step.
 *
 * Softmax only depends on logit *differences*, so the varying quantity is the margin
 * between the emitted token and each runner-up: margin `r` is
 * `MIN_LOGIT_MARGIN + r * LOGIT_MARGIN_STEP + LOGIT_MARGIN_SPREAD * u`, with `u` a
 * seeded hash in `[0, 1)`. Every margin is strictly positive, so the emitted token is
 * always the argmax (the panel can never disagree with the text streaming out), while
 * the winning probability still ranges from genuinely unsure to near-certain across
 * steps instead of pinning to one value. Candidates come back sorted by probability,
 * so the selected one is always first.
 */
export function candidatesForStep(
  step: number,
  selectedText: string,
  vocabulary: readonly string[],
): LogitCandidate[] {
  const distractors = pickDistractors(step, selectedText, vocabulary, TOP_K - 1)
  const margins = distractors.map(
    (_, rank) =>
      MIN_LOGIT_MARGIN +
      rank * LOGIT_MARGIN_STEP +
      LOGIT_MARGIN_SPREAD * hashUnitInterval(`logit:${step}:${rank}`),
  )
  const probabilities = softmax([0, ...margins.map((margin) => -margin)])
  return [
    { text: selectedText, probability: probabilities[0], selected: true },
    ...distractors.map((text, rank) => ({
      text,
      probability: probabilities[rank + 1],
      selected: false,
    })),
  ].sort((left, right) => right.probability - left.probability)
}

function toContext(promptTokens: readonly Token[], outputTokens: readonly Token[]): ContextToken[] {
  return [
    ...promptTokens.map((token) => ({
      index: token.index,
      text: token.text,
      origin: 'prompt' as const,
    })),
    ...outputTokens.map((token, offset) => ({
      index: promptTokens.length + offset,
      text: token.text,
      origin: 'generated' as const,
    })),
  ]
}

/**
 * Expand a tokenized prompt and answer into the deterministic frame sequence the hero
 * plays: reveal the prompt token by token, run one prefill pass that walks the six
 * stages and fills the KV cache for every prompt position at once (emitting the first
 * token), then one compressed decode pass per remaining token, then settle. Length is
 * exactly
 * `promptTokens.length + FORWARD_PASS_STAGES.length + max(0, outputTokens.length - 1) + 1`.
 */
export function buildForwardPassFrames(
  promptTokens: readonly Token[],
  outputTokens: readonly Token[],
): ForwardPassFrame[] {
  const fullContext = toContext(promptTokens, outputTokens)
  const vocabulary = buildDistractorVocabulary(outputTokens)
  const frames: ForwardPassFrame[] = []
  let index = 0

  for (let revealed = 1; revealed <= promptTokens.length; revealed++) {
    frames.push({
      index: index++,
      step: 0,
      phase: 'tokenize',
      activeStage: null,
      context: fullContext.slice(0, revealed),
      queryIndex: revealed - 1,
      attention: [],
      activations: [],
      kvCacheLength: 0,
      logits: [],
      sampledToken: null,
      emittedTokens: [],
      isComplete: false,
    })
  }

  const prefillContext = fullContext.slice(0, promptTokens.length)
  const prefillQueryIndex = prefillContext.length - 1
  const prefillAttention = attentionEdgesForStep(prefillContext, prefillQueryIndex, 0)
  const prefillActivations = mlpActivationsForStep(0)
  const prefillLogits =
    outputTokens.length > 0 ? candidatesForStep(0, outputTokens[0].text, vocabulary) : []

  FORWARD_PASS_STAGES.forEach((stage, stagePosition) => {
    const reached = (id: StageId): boolean => stagePosition >= FORWARD_PASS_STAGES.indexOf(id)
    const emitting = stage === 'sample' && outputTokens.length > 0
    frames.push({
      index: index++,
      step: 0,
      phase: 'prefill',
      activeStage: stage,
      context: prefillContext,
      queryIndex: prefillQueryIndex,
      attention: reached('attention') ? prefillAttention : [],
      activations: reached('mlp') ? prefillActivations : [],
      // Prefill runs every prompt position in one pass, so the cache fills all at once.
      kvCacheLength: reached('qkv') ? prefillContext.length : 0,
      logits: reached('logits') ? prefillLogits : [],
      sampledToken: emitting ? outputTokens[0] : null,
      emittedTokens: emitting ? outputTokens.slice(0, 1) : [],
      isComplete: false,
    })
  })

  for (let step = 1; step < outputTokens.length; step++) {
    const context = fullContext.slice(0, promptTokens.length + step)
    const queryIndex = context.length - 1
    frames.push({
      index: index++,
      step,
      phase: 'decode',
      activeStage: FORWARD_PASS_STAGES[step % FORWARD_PASS_STAGES.length],
      context,
      queryIndex,
      attention: attentionEdgesForStep(context, queryIndex, step),
      activations: mlpActivationsForStep(step),
      kvCacheLength: context.length,
      logits: candidatesForStep(step, outputTokens[step].text, vocabulary),
      sampledToken: outputTokens[step],
      emittedTokens: outputTokens.slice(0, step + 1),
      isComplete: false,
    })
  }

  const finalStep = Math.max(0, outputTokens.length - 1)
  frames.push({
    index: index++,
    step: finalStep,
    phase: 'complete',
    activeStage: null,
    context: fullContext,
    queryIndex: fullContext.length - 1,
    attention: attentionEdgesForStep(fullContext, fullContext.length - 1, finalStep),
    activations: mlpActivationsForStep(finalStep),
    kvCacheLength: fullContext.length,
    logits:
      outputTokens.length > 0
        ? candidatesForStep(finalStep, outputTokens[finalStep].text, vocabulary)
        : [],
    sampledToken: null,
    emittedTokens: outputTokens.slice(),
    isComplete: true,
  })

  return frames
}

/** How long a frame stays on screen. The prefill pass is paced stage by stage. */
export function frameDelayMs(frame: ForwardPassFrame): number {
  if (frame.phase === 'prefill' && frame.activeStage !== null) {
    return PREFILL_STAGE_DELAY_MS[frame.activeStage]
  }
  return PHASE_DELAY_MS[frame.phase]
}

/** The pre-run resting state: prompt not yet revealed, pipeline dark. */
export function idleFrame(): ForwardPassFrame {
  return {
    index: -1,
    step: 0,
    phase: 'tokenize',
    activeStage: null,
    context: [],
    queryIndex: -1,
    attention: [],
    activations: [],
    kvCacheLength: 0,
    logits: [],
    sampledToken: null,
    emittedTokens: [],
    isComplete: false,
  }
}

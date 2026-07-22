export type StageId = 'embed' | 'qkv' | 'attention' | 'mlp' | 'logits' | 'sample'

/**
 * The real phases of an inference request: split the prompt into tokens, run one
 * parallel pass over every prompt position to fill the KV cache (`prefill`), then
 * generate one token per pass reusing that cache (`decode`).
 */
export type ForwardPassPhase = 'tokenize' | 'prefill' | 'decode' | 'complete'

export type TokenOrigin = 'prompt' | 'generated'

export interface Token {
  readonly index: number
  readonly text: string
  /** The real GPT-2 token id, or `-1` for a client-pretokenizer fallback token. */
  readonly id: number
}

/** A token in the model's running context, tagged with how it got there. */
export interface ContextToken extends Token {
  readonly origin: TokenOrigin
}

/** One head's attention from the current query position to an earlier key position. */
export interface AttentionEdge {
  readonly head: number
  readonly keyIndex: number
  readonly weight: number
}

export interface LogitCandidate {
  readonly text: string
  readonly probability: number
  readonly selected: boolean
}

/**
 * One rendered instant of the forward pass.
 *
 * `context` is the input to the step being computed, so it does *not* yet contain
 * `sampledToken`: the token appears in `context` on the following frame, which is the
 * autoregressive loop the diagram draws.
 */
export interface ForwardPassFrame {
  readonly index: number
  readonly step: number
  readonly phase: ForwardPassPhase
  readonly activeStage: StageId | null
  readonly context: readonly ContextToken[]
  readonly queryIndex: number
  readonly attention: readonly AttentionEdge[]
  readonly activations: readonly number[]
  /** Positions whose keys and values are already cached; every one of them is a pass. */
  readonly kvCacheLength: number
  readonly logits: readonly LogitCandidate[]
  readonly sampledToken: Token | null
  readonly emittedTokens: readonly Token[]
  readonly isComplete: boolean
}

/**
 * The swap point between scripted and real forward passes.
 *
 * `frames` streams snapshots as they become available, so a later real-model or
 * streamed-LLM source (task 15) can implement the same contract without any change
 * to the rendering components, which only ever read a single `ForwardPassFrame`.
 * The prompt and its input tokens are known up front (the prompt is always known);
 * generated output arrives only through the frames.
 */
export interface ForwardPassSource {
  readonly prompt: string
  readonly inputTokens: readonly Token[]
  frames(signal?: AbortSignal): AsyncIterable<ForwardPassFrame>
}

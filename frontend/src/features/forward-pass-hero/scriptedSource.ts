import { buildForwardPassFrames } from './frames'
import { pretokenizeText } from './tokenize'
import type { ForwardPassSource, Token } from './types'

interface ScriptedForwardPassConfig {
  readonly prompt: string
  readonly output: string
}

/** Fallback tokens come from the client pretokenizer, which has no real ids. */
export const FALLBACK_TOKEN_ID = -1

function indexPretokens(texts: readonly string[]): Token[] {
  return texts.map((text, index) => ({ index, text, id: FALLBACK_TOKEN_ID }))
}

/**
 * Build a deterministic `ForwardPassSource` from already-tokenized input and output.
 * The frame sequence is precomputed once and replayed; `frames` is async only to honor
 * the streaming contract a real source needs, and stops early when the caller aborts.
 */
export function createForwardPassSourceFromTokens(
  prompt: string,
  inputTokens: readonly Token[],
  outputTokens: readonly Token[],
): ForwardPassSource {
  const builtFrames = buildForwardPassFrames(inputTokens, outputTokens)
  return {
    prompt,
    inputTokens,
    async *frames(signal?: AbortSignal) {
      for (const frame of builtFrames) {
        if (signal?.aborted) {
          return
        }
        yield frame
      }
    },
  }
}

/**
 * The client-side fallback source: pretokenize the prompt and output with GPT-2's
 * pretokenizer regex (no real BPE ids) and replay them. Used when the backend
 * tokenizer is unreachable, so the pipeline still animates.
 */
export function createScriptedForwardPassSource(
  config: ScriptedForwardPassConfig,
): ForwardPassSource {
  return createForwardPassSourceFromTokens(
    config.prompt,
    indexPretokens(pretokenizeText(config.prompt)),
    indexPretokens(pretokenizeText(config.output)),
  )
}

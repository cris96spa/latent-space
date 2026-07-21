import { CANONICAL_BIO, HERO_PROMPT } from './content'
import { buildForwardPassFrames } from './frames'
import { pretokenizeText } from './tokenize'
import type { ForwardPassSource, Token } from './types'

interface ScriptedForwardPassConfig {
  readonly prompt: string
  readonly output: string
}

function indexTokens(texts: readonly string[]): Token[] {
  return texts.map((text, index) => ({ index, text }))
}

/**
 * A deterministic, fully client-side `ForwardPassSource` backed by authored text.
 * It tokenizes the prompt and output once, precomputes the frame sequence, and
 * replays it; `frames` is async only to honor the streaming contract a real source
 * needs, and stops early when the caller aborts.
 */
export function createScriptedForwardPassSource(
  config: ScriptedForwardPassConfig,
): ForwardPassSource {
  const inputTokens = indexTokens(pretokenizeText(config.prompt))
  const outputTokens = indexTokens(pretokenizeText(config.output))
  const builtFrames = buildForwardPassFrames(inputTokens, outputTokens)

  return {
    prompt: config.prompt,
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

/** The canonical landing-page source: "Who is Cristian?" streaming the bio. */
export function createHeroForwardPassSource(): ForwardPassSource {
  return createScriptedForwardPassSource({ prompt: HERO_PROMPT, output: CANONICAL_BIO })
}

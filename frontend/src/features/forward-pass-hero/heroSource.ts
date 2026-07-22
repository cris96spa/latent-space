import { tokenize, type TokenSpan } from '../../lib/api'
import { CANONICAL_BIO, HERO_PROMPT } from './content'
import { createForwardPassSourceFromTokens, createScriptedForwardPassSource } from './scriptedSource'
import type { ForwardPassSource, Token } from './types'

/** Token, word, and character counts for a tokenized string. */
export interface TokenCounts {
  readonly tokenCount: number
  readonly wordCount: number
  readonly charCount: number
}

/**
 * Everything the hero needs to render its tokenized prompt and drive the animation.
 * `promptCounts` is `null` and `idsAvailable` is `false` in the pretokenizer fallback,
 * where there are no real ids or counts to show.
 */
export interface HeroForwardPass {
  readonly source: ForwardPassSource
  readonly promptTokens: readonly Token[]
  readonly promptCounts: TokenCounts | null
  readonly idsAvailable: boolean
}

function indexApiTokens(tokens: readonly TokenSpan[]): Token[] {
  return tokens.map((token, index) => ({ index, text: token.text, id: token.id }))
}

/** The resting state before tokenization resolves: no tokens, a source that yields nothing. */
export function idleHeroForwardPass(): HeroForwardPass {
  return {
    source: { prompt: HERO_PROMPT, inputTokens: [], async *frames() {} },
    promptTokens: [],
    promptCounts: null,
    idsAvailable: false,
  }
}

/**
 * Tokenize the fixed prompt and bio with the backend GPT-2 tokenizer and build the
 * hero source from the real tokens. If the backend is unreachable, fall back to the
 * client pretokenizer so the pipeline still animates (without ids or counts).
 */
export async function buildHeroForwardPass(): Promise<HeroForwardPass> {
  try {
    const [promptTokenization, bioTokenization] = await Promise.all([
      tokenize(HERO_PROMPT),
      tokenize(CANONICAL_BIO),
    ])
    const promptTokens = indexApiTokens(promptTokenization.tokens)
    const source = createForwardPassSourceFromTokens(
      HERO_PROMPT,
      promptTokens,
      indexApiTokens(bioTokenization.tokens),
    )
    return {
      source,
      promptTokens,
      promptCounts: {
        tokenCount: promptTokenization.tokenCount,
        wordCount: promptTokenization.wordCount,
        charCount: promptTokenization.charCount,
      },
      idsAvailable: true,
    }
  } catch (error) {
    console.warn(
      'forward-pass hero: backend tokenizer unavailable, using the client pretokenizer fallback',
      error,
    )
    const source = createScriptedForwardPassSource({ prompt: HERO_PROMPT, output: CANONICAL_BIO })
    return {
      source,
      promptTokens: [...source.inputTokens],
      promptCounts: null,
      idsAvailable: false,
    }
  }
}

import { Button } from '../../components/Button'
import type { ForwardPassPhase } from './types'
import type { ForwardPassPlayback } from './useForwardPass'

const PHASE_CAPTIONS: Record<ForwardPassPhase, string> = {
  tokenize: 'splitting the prompt into tokens',
  prefill: 'one parallel pass over every prompt position, filling the KV cache',
  decode: 'one pass per token, reusing the cache',
  complete: 'done — the KV cache is warm and nobody paid for a GPU',
}

/**
 * Transport for the forward pass: play/pause, single-step by frame, and a slider over
 * everything that has streamed so far. Keyboard support is the native range input's,
 * and the caption names the phase so scrubbing teaches something rather than just
 * moving pixels.
 */
export function PlaybackControls({ playback }: { playback: ForwardPassPlayback }) {
  const { frame, frames, position, status, playing, togglePlay, seek, stepBy, replay, skip } =
    playback
  const lastPosition = Math.max(0, frames.length - 1)
  const sliderPosition = Math.max(0, position)
  const disabled = frames.length === 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={togglePlay} disabled={disabled}>
          {status === 'complete' ? 'Play again' : playing ? 'Pause' : 'Play'}
        </Button>
        <Button variant="ghost" onClick={() => stepBy(-1)} disabled={disabled || position <= 0}>
          ◀ Step
        </Button>
        <Button
          variant="ghost"
          onClick={() => stepBy(1)}
          disabled={disabled || position >= lastPosition}
        >
          Step ▶
        </Button>
        <Button
          variant="ghost"
          onClick={skip}
          disabled={disabled || status === 'complete'}
        >
          Skip to end
        </Button>
        <Button variant="ghost" onClick={replay} disabled={disabled}>
          Restart
        </Button>
        <span className="font-mono text-xs text-muted">
          frame {sliderPosition} / {lastPosition} · phase {frame.phase} · step {frame.step}
        </span>
      </div>

      <label className="block space-y-1">
        <span className="sr-only">Scrub the forward pass, frame by frame</span>
        <input
          type="range"
          min={0}
          max={lastPosition}
          value={sliderPosition}
          disabled={disabled}
          onChange={(event) => seek(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:accent-brand-400"
        />
      </label>

      <p className="font-mono text-xs text-muted" aria-live="polite">
        {frame.phase}: {PHASE_CAPTIONS[frame.phase]}
      </p>
    </div>
  )
}

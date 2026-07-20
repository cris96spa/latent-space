import { useCallback, useEffect, useMemo, useState } from 'react'

import { frameDelayMs, idleFrame } from './frames'
import type { ForwardPassFrame, ForwardPassSource } from './types'

export type ForwardPassStatus = 'idle' | 'running' | 'paused' | 'complete'

interface UseForwardPassOptions {
  readonly reducedMotion: boolean
}

export interface ForwardPassPlayback {
  readonly frame: ForwardPassFrame
  /** Every frame received so far; scrubbing only ever covers what has arrived. */
  readonly frames: readonly ForwardPassFrame[]
  readonly position: number
  readonly status: ForwardPassStatus
  readonly playing: boolean
  readonly togglePlay: () => void
  readonly seek: (position: number) => void
  readonly stepBy: (delta: number) => void
  readonly replay: () => void
  readonly skip: () => void
}

const RESTING_FRAME = idleFrame()

/**
 * Drives a `ForwardPassSource` for React.
 *
 * Responsibilities are split so the two can move at different speeds. A *producer*
 * consumes the source as fast as it yields and appends to a buffer — it never adds
 * delay of its own, so frames from a real streamed source arrive at network speed and
 * frames from the scripted source arrive at once. A *player* then walks `position`
 * along that buffer at `frameDelayMs`, and that is what pause, scrub and single-step
 * move. Scrubbing is bounded by what has actually streamed, exactly as it would be for
 * a live model, and the rendering components still only ever read one frame.
 *
 * With `reducedMotion` the player parks on the final frame instead of walking, so the
 * answer is there immediately and nothing animates.
 */
export function useForwardPass(
  source: ForwardPassSource,
  options: UseForwardPassOptions,
): ForwardPassPlayback {
  const { reducedMotion } = options
  const [frames, setFrames] = useState<readonly ForwardPassFrame[]>([])
  const [position, setPosition] = useState(-1)
  const [playing, setPlaying] = useState(!reducedMotion)
  const [complete, setComplete] = useState(false)
  const [runToken, setRunToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setFrames([])
    setPosition(-1)
    setComplete(false)

    void (async () => {
      for await (const next of source.frames(signal)) {
        if (signal.aborted) {
          return
        }
        setFrames((received) => [...received, next])
      }
      if (!signal.aborted) {
        setComplete(true)
      }
    })()

    return () => controller.abort()
  }, [source, runToken])

  const lastPosition = frames.length - 1

  useEffect(() => {
    if (reducedMotion) {
      setPosition(lastPosition)
      return
    }
    if (!playing || position >= lastPosition) {
      return
    }
    const holdMs = position < 0 ? 0 : frameDelayMs(frames[position])
    const timeout = setTimeout(() => setPosition((at) => at + 1), holdMs)
    return () => clearTimeout(timeout)
  }, [playing, position, lastPosition, frames, reducedMotion])

  const frame = frames[position] ?? RESTING_FRAME
  const atEnd = complete && lastPosition >= 0 && position >= lastPosition

  const status: ForwardPassStatus = atEnd
    ? 'complete'
    : position < 0
      ? 'idle'
      : playing
        ? 'running'
        : 'paused'

  const seek = useCallback(
    (next: number) => {
      setPlaying(false)
      setPosition((at) => (lastPosition < 0 ? at : Math.max(0, Math.min(next, lastPosition))))
    },
    [lastPosition],
  )

  const stepBy = useCallback(
    (delta: number) => {
      setPlaying(false)
      setPosition((at) => Math.max(0, Math.min(at + delta, lastPosition)))
    },
    [lastPosition],
  )

  const togglePlay = useCallback(() => {
    // At the end there is nothing to pause, so the control replays from the top.
    if (atEnd) {
      setPosition(-1)
      setPlaying(true)
      return
    }
    setPlaying((wasPlaying) => !wasPlaying)
  }, [atEnd])

  const replay = useCallback(() => {
    setPlaying(true)
    setRunToken((token) => token + 1)
  }, [])

  const skip = useCallback(() => {
    setPlaying(false)
    setPosition(lastPosition)
  }, [lastPosition])

  return useMemo(
    () => ({
      frame,
      frames,
      position,
      status,
      playing,
      togglePlay,
      seek,
      stepBy,
      replay,
      skip,
    }),
    [frame, frames, position, status, playing, togglePlay, seek, stepBy, replay, skip],
  )
}

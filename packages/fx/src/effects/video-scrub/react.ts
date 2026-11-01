'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createVideoScrub, type VideoScrubOptions } from './index.ts';

/**
 * Hook de `video-scrub`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useVideoScrub<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: VideoScrubOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createVideoScrub(el, options), deps);
}

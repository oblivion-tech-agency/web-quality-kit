'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createLiveTimeline, type LiveTimelineOptions } from './index.ts';

/**
 * Hook de `live-timeline`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useLiveTimeline<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options: LiveTimelineOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createLiveTimeline(el, options), deps);
}

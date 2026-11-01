'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createSplitFlap, type SplitFlapOptions, type SplitFlapHandle } from './index.ts';

/**
 * Hook de `split-flap`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useSplitFlap<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: SplitFlapOptions,
  deps: DependencyList = [],
): RefObject<SplitFlapHandle | null> {
  return useFx(ref, (el) => createSplitFlap(el, options), deps);
}

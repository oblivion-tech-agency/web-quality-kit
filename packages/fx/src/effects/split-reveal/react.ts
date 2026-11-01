'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createSplitReveal, type SplitRevealOptions } from './index.ts';

/**
 * Hook de `split-reveal`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useSplitReveal<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: SplitRevealOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createSplitReveal(el, options), deps);
}

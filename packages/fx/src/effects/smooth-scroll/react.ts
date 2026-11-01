'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createSmoothScroll, type SmoothScrollOptions, type SmoothScrollHandle } from './index.ts';

/**
 * Hook de `smooth-scroll`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useSmoothScroll<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: SmoothScrollOptions,
  deps: DependencyList = [],
): RefObject<SmoothScrollHandle | null> {
  return useFx(ref, (el) => createSmoothScroll(el, options), deps);
}

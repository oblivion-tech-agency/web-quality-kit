'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createScrollProgress, type ScrollProgressOptions, type ScrollProgressHandle } from './index.ts';

/**
 * Hook de `scroll-progress`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useScrollProgress<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: ScrollProgressOptions,
  deps: DependencyList = [],
): RefObject<ScrollProgressHandle | null> {
  return useFx(ref, (el) => createScrollProgress(el, options), deps);
}

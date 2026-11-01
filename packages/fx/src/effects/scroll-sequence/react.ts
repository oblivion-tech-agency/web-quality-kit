'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createScrollSequence, type ScrollSequenceOptions } from './index.ts';

/**
 * Hook de `scroll-sequence`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useScrollSequence<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options: ScrollSequenceOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createScrollSequence(el, options), deps);
}

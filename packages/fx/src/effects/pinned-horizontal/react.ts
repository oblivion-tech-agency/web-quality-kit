'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createPinnedHorizontal, type PinnedHorizontalOptions } from './index.ts';

/**
 * Hook de `pinned-horizontal`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function usePinnedHorizontal<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: PinnedHorizontalOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createPinnedHorizontal(el, options), deps);
}

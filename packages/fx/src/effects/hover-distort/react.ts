'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createHoverDistort, type HoverDistortOptions } from './index.ts';

/**
 * Hook de `hover-distort`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useHoverDistort<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: HoverDistortOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createHoverDistort(el, options), deps);
}

'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createFlipLayout, type FlipLayoutOptions, type FlipLayoutHandle } from './index.ts';

/**
 * Hook de `flip-layout`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useFlipLayout<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: FlipLayoutOptions,
  deps: DependencyList = [],
): RefObject<FlipLayoutHandle | null> {
  return useFx(ref, (el) => createFlipLayout(el, options), deps);
}

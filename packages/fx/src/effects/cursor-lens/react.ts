'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createCursorLens, type CursorLensOptions } from './index.ts';

/**
 * Hook de `cursor-lens`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useCursorLens<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: CursorLensOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createCursorLens(el, options), deps);
}

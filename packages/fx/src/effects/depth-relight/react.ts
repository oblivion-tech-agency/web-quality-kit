'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createDepthRelight, type DepthRelightOptions } from './index.ts';

/**
 * Hook de `depth-relight`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useDepthRelight<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: DepthRelightOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createDepthRelight(el, options), deps);
}

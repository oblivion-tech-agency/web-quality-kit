'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createRouteDraw, type RouteDrawOptions } from './index.ts';

/**
 * Hook de `route-draw`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useRouteDraw<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: RouteDrawOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createRouteDraw(el, options), deps);
}

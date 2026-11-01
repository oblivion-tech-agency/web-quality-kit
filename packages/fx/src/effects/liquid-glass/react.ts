'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createLiquidGlass, type LiquidGlassOptions } from './index.ts';

/**
 * Hook de `liquid-glass`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useLiquidGlass<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: LiquidGlassOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createLiquidGlass(el, options), deps);
}

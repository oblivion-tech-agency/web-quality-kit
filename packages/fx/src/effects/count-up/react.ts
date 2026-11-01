'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createCountUp, type CountUpOptions } from './index.ts';

/**
 * Hook de `count-up`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useCountUp<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: CountUpOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createCountUp(el, options), deps);
}

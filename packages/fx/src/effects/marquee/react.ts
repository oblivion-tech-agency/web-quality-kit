'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createMarquee, type MarqueeOptions } from './index.ts';

/**
 * Hook de `marquee`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useMarquee<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: MarqueeOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createMarquee(el, options), deps);
}

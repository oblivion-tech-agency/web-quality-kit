'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createScramble, type ScrambleOptions, type ScrambleHandle } from './index.ts';

/**
 * Hook de `scramble`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useScramble<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: ScrambleOptions,
  deps: DependencyList = [],
): RefObject<ScrambleHandle | null> {
  return useFx(ref, (el) => createScramble(el, options), deps);
}

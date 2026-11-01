'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createClipReveal, type ClipRevealOptions, type ClipRevealHandle } from './index.ts';

/**
 * Hook de `clip-reveal`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useClipReveal<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: ClipRevealOptions,
  deps: DependencyList = [],
): RefObject<ClipRevealHandle | null> {
  return useFx(ref, (el) => createClipReveal(el, options), deps);
}

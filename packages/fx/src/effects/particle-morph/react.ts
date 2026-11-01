'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createParticleMorph, type ParticleMorphOptions, type ParticleMorphHandle } from './index.ts';

/**
 * Hook de `particle-morph`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useParticleMorph<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options: ParticleMorphOptions,
  deps: DependencyList = [],
): RefObject<ParticleMorphHandle | null> {
  return useFx(ref, (el) => createParticleMorph(el, options), deps);
}

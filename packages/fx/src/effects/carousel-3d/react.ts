'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createCarousel3D, type Carousel3DOptions } from './index.ts';

/**
 * Hook de `carousel-3d`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useCarousel3D<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: Carousel3DOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createCarousel3D(el, options), deps);
}

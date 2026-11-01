'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createInfiniteGallery, type InfiniteGalleryOptions } from './index.ts';

/**
 * Hook de `infinite-gallery`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useInfiniteGallery<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: InfiniteGalleryOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createInfiniteGallery(el, options), deps);
}

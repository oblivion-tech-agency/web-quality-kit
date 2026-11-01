'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createText3D, type Text3DOptions } from './index.ts';

/**
 * Hook de `text-3d`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useText3D<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: Text3DOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createText3D(el, options), deps);
}

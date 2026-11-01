'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createCursorLabel, type CursorLabelOptions } from './index.ts';

/**
 * Hook de `cursor-label`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useCursorLabel<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: CursorLabelOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createCursorLabel(el, options), deps);
}

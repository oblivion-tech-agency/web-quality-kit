'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createShaderBackdrop, type ShaderBackdropOptions } from './index.ts';

/**
 * Hook de `shader-backdrop`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useShaderBackdrop<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: ShaderBackdropOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createShaderBackdrop(el, options), deps);
}

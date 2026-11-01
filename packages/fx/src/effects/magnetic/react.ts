'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createMagnetic, type MagneticOptions } from './index.ts';

/**
 * Hook de `magnetic`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useMagnetic<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: MagneticOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createMagnetic(el, options), deps);
}

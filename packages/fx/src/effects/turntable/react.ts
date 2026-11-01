'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createTurntable, type TurntableOptions } from './index.ts';

/**
 * Hook de `turntable`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useTurntable<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options: TurntableOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createTurntable(el, options), deps);
}

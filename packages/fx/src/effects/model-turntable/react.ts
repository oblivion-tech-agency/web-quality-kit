'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createModelTurntable, type ModelTurntableOptions, type ModelTurntableHandle } from './index.ts';

/**
 * Hook de `model-turntable`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useModelTurntable<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options: ModelTurntableOptions,
  deps: DependencyList = [],
): RefObject<ModelTurntableHandle | null> {
  return useFx(ref, (el) => createModelTurntable(el, options), deps);
}

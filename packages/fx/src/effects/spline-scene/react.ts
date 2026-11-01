'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createSplineScene, type SplineSceneOptions } from './index.ts';

/**
 * Hook de `spline-scene`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useSplineScene<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: SplineSceneOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createSplineScene(el, options), deps);
}

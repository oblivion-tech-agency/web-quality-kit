'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import type { FxHandle } from '../../core/types.ts';
import { createStackedCards, type StackedCardsOptions } from './index.ts';

/**
 * Hook de `stacked-cards`. Monta sobre `ref.current` y destruye al desmontar.
 * Las opciones se leen al montar; pasá `deps` para volver a montar cuando cambien.
 */
export function useStackedCards<E extends HTMLElement>(
  ref: RefObject<E | null>,
  options?: StackedCardsOptions,
  deps: DependencyList = [],
): RefObject<FxHandle | null> {
  return useFx(ref, (el) => createStackedCards(el, options), deps);
}

'use client';

import type { DependencyList, RefObject } from 'react';
import { useFx } from '../../core/react.ts';
import { createViewTransition, type ViewTransitionHandle } from './index.ts';

/** Hook de `view-transition`. Usá `handle.current?.swap(() => flushSync(() => setState(x)))`. */
export function useViewTransition<E extends HTMLElement>(ref: RefObject<E | null>, deps: DependencyList = []): RefObject<ViewTransitionHandle | null> {
  return useFx(ref, (el) => createViewTransition(el), deps);
}

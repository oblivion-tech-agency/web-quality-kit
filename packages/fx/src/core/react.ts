'use client';

import { useEffect, useRef, type DependencyList, type RefObject } from 'react';
import type { FxHandle } from './types.ts';

/**
 * Monta un efecto sobre `ref.current` y lo destruye al desmontar o cuando
 * cambian las dependencias. Sobrevive StrictMode porque todo `destroy()` del
 * kit deja el DOM como estaba.
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   useFx(ref, (el) => createCountUp(el, { locale: 'es-AR' }), []);
 *
 * Devuelve una ref al handle actual, para llamar a su API (`set`, `setLight`…).
 */
export function useFx<E extends HTMLElement, H extends FxHandle>(
  ref: RefObject<E | null>,
  create: (el: E) => H | null | undefined,
  deps: DependencyList = [],
): RefObject<H | null> {
  const handle = useRef<H | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = create(el) ?? null;
    handle.current = h;
    return () => {
      h?.destroy();
      if (handle.current === h) handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return handle;
}

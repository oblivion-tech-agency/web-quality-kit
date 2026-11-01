'use client';

import { useEffect } from 'react';

/**
 * Monta un efecto del catálogo y lo destruye al desmontar. Sirve para todos
 * los `create*` de `effects/`, que devuelven un handle con `destroy()`:
 *
 *   useFx(() => createScrollProgress(document), []);
 *   useFx(() => ref.current && createSplitFlap(ref.current, { values }), [values]);
 *
 * Sobrevive StrictMode porque cada `destroy()` deja todo como estaba antes
 * del montaje. Los efectos se activan en un único componente cliente (por
 * ejemplo `<Motion />` al final de la página); las secciones siguen siendo
 * Server Components y solo declaran atributos `data-*`.
 *
 * @param {() => ({ destroy(): void } | null | undefined | false)} factory
 * @param {unknown[]} [deps]
 */
export function useFx(factory, deps = []) {
  useEffect(() => {
    const handle = factory();
    return () => {
      if (handle) handle.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Utilidades de test: matchMedia controlable y DOM de prueba. */

type Listener = (e: { matches: boolean }) => void;

/** Reemplaza matchMedia: `reduce` controla la query de reduced motion y se puede cambiar en vivo. */
export function mockMedia(initial: { reduce?: boolean; fine?: boolean; wide?: boolean } = {}) {
  const state = { reduce: false, fine: true, wide: true, ...initial };
  const listeners = new Map<string, Set<Listener>>();
  const matches = (q: string) =>
    q.includes('prefers-reduced-motion') ? state.reduce : q.includes('pointer') ? state.fine : q.includes('min-width') ? state.wide : false;
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches(query);
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: Listener) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(fn);
    },
    removeEventListener: (_: string, fn: Listener) => listeners.get(query)?.delete(fn),
    addListener() {},
    removeListener() {},
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;
  return {
    setReduce(value: boolean) {
      state.reduce = value;
      for (const [q, set] of listeners) if (q.includes('prefers-reduced-motion')) set.forEach((fn) => fn({ matches: value }));
    },
    listenerCount: () => [...listeners.values()].reduce((a, s) => a + s.size, 0),
  };
}

export function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById('root') as HTMLElement;
}

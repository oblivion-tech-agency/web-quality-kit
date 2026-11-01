/**
 * Reduced motion y visibilidad, con el mismo comportamiento en todos los efectos.
 *
 * `motionSwitch` es la pieza central del contrato: cada efecto declara cómo se
 * monta con movimiento (`full`) y cómo queda quieto (`reduced`), y el switch
 * cambia de uno a otro en vivo si la persona cambia la preferencia del sistema
 * sin recargar la página.
 */

const REDUCE = '(prefers-reduced-motion: reduce)';

export type Teardown = () => void;

const media = (query: string): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;

export const prefersReducedMotion = (): boolean => media(REDUCE)?.matches ?? false;

/**
 * Monta `full` o `reduced` según la preferencia y cambia en vivo.
 * Cada rama devuelve su propio teardown. Devuelve el teardown total.
 */
export function motionSwitch(branches: { full: () => Teardown | void; reduced?: () => Teardown | void }): Teardown {
  const mq = media(REDUCE);
  let current: Teardown | void;
  const mount = () => {
    current?.();
    current = mq?.matches ? branches.reduced?.() : branches.full();
  };
  mount();
  mq?.addEventListener('change', mount);
  return () => {
    mq?.removeEventListener('change', mount);
    current?.();
    current = undefined;
  };
}

/**
 * Llama a `onChange(true|false)` cuando el elemento entra o sale de la
 * pantalla. Sirve para pausar loops y rAF fuera de vista.
 */
export function onVisibility(el: Element, onChange: (visible: boolean) => void, rootMargin = '0px'): Teardown {
  if (typeof IntersectionObserver === 'undefined') {
    onChange(true);
    return () => {};
  }
  const io = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (entry) onChange(entry.isIntersecting);
  }, { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

/**
 * Llama a `cb` una sola vez, cuando el elemento queda a `margin` de la
 * pantalla (por defecto una pantalla). Para cargar dependencias o assets
 * pesados recién cuando hacen falta.
 */
export function whenNear(el: Element, cb: () => void, margin = '100% 0px'): Teardown {
  if (typeof IntersectionObserver === 'undefined') {
    cb();
    return () => {};
  }
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    cb();
  }, { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}

/** El puntero es fino (mouse o trackpad): para efectos de cursor y hover. */
export const finePointer = (): boolean => media('(hover: hover) and (pointer: fine)')?.matches ?? false;

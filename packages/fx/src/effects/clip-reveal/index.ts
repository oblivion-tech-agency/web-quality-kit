/**
 * clip-reveal — revelado con máscara. Cada hijo de `[data-fx-clip]` sube desde
 * abajo con `clip-path` mientras la imagen se asienta de un zoom leve.
 * Familia: imagen y media · Intensidad 1 · 0 deps.
 *
 * El clip va en los HIJOS del elemento observado: un IntersectionObserver no
 * dispara sobre un target recortado al 100%.
 *
 *   <figure data-fx-clip><img …></figure>
 *
 *   .js [data-fx-clip] > * { clip-path: inset(100% 0 0 0); transition: clip-path var(--fx-duration) var(--fx-ease); }
 *   .js [data-fx-clip] img { scale: 1.18; transition: clip-path var(--fx-duration) var(--fx-ease), scale 1600ms var(--fx-ease); }
 *   [data-fx-clip][data-fx-revealed] > * { clip-path: inset(0); }
 *   [data-fx-clip][data-fx-revealed] img { scale: 1; }
 *
 * Reduced motion: todo queda revelado al instante (también si cambia en vivo).
 * destroy(): desconecta el observer y saca `data-fx-revealed` de los que lo recibieron.
 */

import { motionSwitch, type FxHandle } from '../../core/index.ts';

export interface ClipRevealOptions {
  selector?: string;
  rootMargin?: string;
  threshold?: number;
}

export interface ClipRevealHandle extends FxHandle {
  /** Para nodos que llegan después del mount (fetch client-side). */
  observe(el: Element): void;
}

const MARK = 'data-fx-revealed';

export function createClipReveal(
  root: HTMLElement,
  { selector = '[data-fx-clip]', rootMargin = '0px 0px -10% 0px', threshold = 0.12 }: ClipRevealOptions = {},
): ClipRevealHandle {
  const touched = new Set<Element>();
  const reveal = (el: Element) => {
    if (!el.hasAttribute(MARK)) touched.add(el);
    el.setAttribute(MARK, '');
  };
  let observe: (el: Element) => void = reveal;

  const off = motionSwitch({
    full: () => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        },
        { rootMargin, threshold },
      );
      root.querySelectorAll(selector).forEach((el) => io.observe(el));
      observe = (el) => io.observe(el);
      return () => io.disconnect();
    },
    reduced: () => {
      root.querySelectorAll(selector).forEach(reveal);
      observe = reveal;
    },
  });

  return {
    observe: (el) => observe(el),
    destroy() {
      off();
      touched.forEach((el) => el.removeAttribute(MARK));
      touched.clear();
    },
  };
}

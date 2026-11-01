/**
 * flip-layout — cualquier cambio de layout se anima solo: filtrar una grilla,
 * abrir un caso a pantalla completa, reordenar, pasar de lista a grilla. Se
 * mide el antes, se aplica el cambio y GSAP Flip anima del antes al después
 * (FLIP). El cambio lo hace el host; el efecto solo lo anima.
 * Familia: transiciones · Intensidad 2 · deps: gsap.
 *
 *   <ul data-fx-flip-root> <li data-fx-flip>…</li> … </ul>
 *
 *   const flip = createFlipLayout(grid);
 *   flip.change(() => grid.classList.toggle('is-list'));          // vanilla
 *   flip.change(() => setFilter('3d'));  // en React: dentro de flushSync o con un effect sobre el estado
 *
 * Los elementos que aparecen o desaparecen entran y salen con fundido y escala.
 * Reduced motion: el cambio se aplica al instante.
 * destroy(): mata las animaciones en curso.
 */

import { prefersReducedMotion, type FxHandle } from '../../core/index.ts';
import { fxGsap, HOUSE_EASE } from '../../lib/gsap.ts';

export interface FlipLayoutOptions {
  selector?: string;
  duration?: number;
  stagger?: number;
}

export interface FlipLayoutHandle extends FxHandle {
  /** Aplica `mutate` (cambio de DOM o de estado) y anima del layout anterior al nuevo. */
  change(mutate: () => void): void;
}

export function createFlipLayout(
  root: HTMLElement,
  { selector = '[data-fx-flip]', duration = 0.7, stagger = 0.02 }: FlipLayoutOptions = {},
): FlipLayoutHandle {
  const { gsap, Flip } = fxGsap();
  const ctx = gsap.context(() => {}, root);

  return {
    change(mutate) {
      if (prefersReducedMotion()) {
        mutate();
        return;
      }
      const targets = root.querySelectorAll(selector);
      const state = Flip.getState(targets);
      mutate();
      ctx.add(() => {
        Flip.from(state, {
          targets: root.querySelectorAll(selector),
          duration,
          stagger,
          ease: HOUSE_EASE,
          absolute: true,
          nested: true,
          onEnter: (els: Element[]) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: duration * 0.8, ease: HOUSE_EASE }),
          onLeave: (els: Element[]) => gsap.to(els, { opacity: 0, scale: 0.94, duration: duration * 0.5, ease: 'power2.in' }),
        });
      });
    },
    destroy() {
      ctx.kill();
    },
  };
}

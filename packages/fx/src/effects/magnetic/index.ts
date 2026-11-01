/**
 * magnetic — botones y links que se dejan atraer por el puntero cuando pasa
 * cerca, y vuelven con inercia. Un hijo `data-fx-magnetic-inner` (el texto o el
 * ícono) se mueve un poco más, para dar profundidad. Microinteracción de
 * detalle: en uno o dos elementos clave, no en todos los links.
 * Familia: interacción · Intensidad 1 · deps: gsap.
 *
 *   <a data-fx-magnetic href="#contacto"><span data-fx-magnetic-inner>Hablemos</span></a>
 *
 * Solo con puntero fino. Reduced motion: no se mueve (en vivo).
 * destroy(): saca listeners y devuelve el transform original.
 */

import { bundle, finePointer, motionSwitch, preserve, type FxHandle } from '../../core/index.ts';
import { fxGsap } from '../../lib/gsap.ts';

export interface MagneticOptions {
  selector?: string;
  /** Fracción de la distancia al puntero que se mueve el elemento. */
  strength?: number;
  /** Radio extra alrededor del elemento donde ya atrae (px). */
  radius?: number;
}

export function createMagnetic(
  root: HTMLElement,
  { selector = '[data-fx-magnetic]', strength = 0.3, radius = 40 }: MagneticOptions = {},
): FxHandle {
  if (!finePointer()) return { destroy() {} };
  const { gsap } = fxGsap();
  const els = Array.from(root.querySelectorAll<HTMLElement>(selector));

  const off = motionSwitch({
    full: () => {
      const restore = bundle(
        ...els.flatMap((el) => [el, el.querySelector('[data-fx-magnetic-inner]')]).filter((e): e is Element => !!e).map((e) => preserve(e, { styles: ['transform', 'translate', 'rotate', 'scale'] })),
      );
      const ctx = gsap.context(() => {}, root);
      const movers = els.map((el) => {
        const inner = el.querySelector<HTMLElement>('[data-fx-magnetic-inner]');
        return {
          el,
          x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'expo.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'expo.out' }),
          ix: inner ? gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'expo.out' }) : null,
          iy: inner ? gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'expo.out' }) : null,
        };
      });
      const onMove = (e: PointerEvent) => {
        for (const m of movers) {
          const r = m.el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const near = Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius;
          m.x(near ? dx * strength : 0);
          m.y(near ? dy * strength : 0);
          m.ix?.(near ? dx * strength * 0.5 : 0);
          m.iy?.(near ? dy * strength * 0.5 : 0);
        }
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => {
        window.removeEventListener('pointermove', onMove);
        ctx.revert();
        for (const m of movers) {
          const targets = [m.el, m.el.querySelector('[data-fx-magnetic-inner]')].filter(Boolean);
          gsap.killTweensOf(targets);
          gsap.set(targets, { clearProps: 'transform' }); // limpia también la caché de GSAP
        }
        restore();
      };
    },
  });

  return { destroy: off };
}

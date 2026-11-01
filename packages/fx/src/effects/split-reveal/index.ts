/**
 * split-reveal — un titular entra línea por línea (o palabra, o letra), cada
 * una subiendo desde atrás de su propia máscara. GSAP SplitText con `mask`,
 * `autoSplit` (re-parte al cargar fuentes o cambiar el ancho) y `aria`.
 * Familia: texto · Intensidad 2 · deps: gsap.
 *
 *   <h2 data-fx-split>Toda la sala en una mano</h2>
 *
 * Para que no se vea el texto antes de partir, ocultalo solo con JS y con una
 * salida si el script falla (se muestra a los 2,5 s igual):
 *
 *   .js [data-fx-split]:not([data-fx-ready]) { opacity: 0; animation: fx-show 0s 2.5s forwards; }
 *   @keyframes fx-show { to { opacity: 1; } }
 *
 * Reduced motion: el texto queda entero y visible (en vivo).
 * destroy(): SplitText.revert() devuelve el texto original y los tweens se matan.
 */

import { motionSwitch, preserve, type FxHandle } from '../../core/index.ts';
import { SplitText } from 'gsap/SplitText';
import { fxGsap, HOUSE_EASE } from '../../lib/gsap.ts';

export interface SplitRevealOptions {
  by?: 'lines' | 'words' | 'chars';
  /** Segundos por parte. */
  duration?: number;
  stagger?: number;
  /** 'view' espera a que entre en pantalla; 'load' arranca ya (para el hero). */
  trigger?: 'view' | 'load';
  /** Posición de ScrollTrigger para `view`. */
  start?: string;
  delay?: number;
}

export function createSplitReveal(
  el: HTMLElement,
  { by = 'lines', duration = 0.9, stagger = 0.08, trigger = 'view', start = 'top 85%', delay = 0 }: SplitRevealOptions = {},
): FxHandle {
  const { gsap } = fxGsap(SplitText);
  const restore = preserve(el, { attributes: ['data-fx-ready'] });

  const off = motionSwitch({
    full: () => {
      const ctx = gsap.context(() => {
        SplitText.create(el, {
          type: by === 'lines' ? 'lines' : `${by},lines`,
          mask: by,
          autoSplit: true,
          aria: 'auto',
          onSplit(self: { lines: Element[]; words: Element[]; chars: Element[] }) {
            el.setAttribute('data-fx-ready', '');
            const parts = by === 'lines' ? self.lines : by === 'words' ? self.words : self.chars;
            return gsap.from(parts, {
              yPercent: 110,
              duration,
              stagger,
              delay,
              ease: HOUSE_EASE,
              ...(trigger === 'view' ? { scrollTrigger: { trigger: el, start, once: true } } : {}),
            });
          },
        });
      }, el);
      return () => ctx.revert();
    },
    reduced: () => {
      el.setAttribute('data-fx-ready', '');
    },
  });

  return {
    destroy() {
      off();
      restore();
    },
  };
}

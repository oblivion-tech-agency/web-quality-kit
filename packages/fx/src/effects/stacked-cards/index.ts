/**
 * stacked-cards — cartas que se apilan con el scroll: cada una queda fija
 * (sticky) y, cuando llega la siguiente, se achica y se oscurece debajo.
 * Para servicios, pasos, casos, capítulos: cosas que se leen de a una y se
 * acumulan. GSAP ScrollTrigger con scrub.
 * Familia: scroll · Intensidad 3 · deps: gsap.
 *
 *   <div data-fx-stack>
 *     <article data-fx-stack-card>…</article> …
 *
 * El sticky lo da el CSS (así sin JS ya se apilan); el efecto escribe la escala
 * y `--fx-covered` (0 → 1) para que el CSS oscurezca como quiera:
 *
 *   [data-fx-stack-card] { position: sticky; top: calc(12vh + var(--i, 0) * 20px); transform-origin: 50% 0; }
 *   [data-fx-stack-card]::after { content: ""; position: absolute; inset: 0; pointer-events: none;
 *     background: var(--fx-ground); opacity: calc(var(--fx-covered, 0) * 0.6); }
 *   @media (prefers-reduced-motion: reduce) { [data-fx-stack-card] { position: relative; top: auto; } }
 *
 * Composición: el contenido de cada carta va ARRIBA (la siguiente tapa la parte
 * de abajo) y en celular conviene una columna simple, sin sticky ni efecto.
 *
 * Reduced motion: no escala ni oscurece (en vivo).
 * destroy(): mata los ScrollTriggers y saca escala y `--fx-covered`.
 */

import { bundle, motionSwitch, parts, preserve, type FxHandle } from '../../core/index.ts';
import { fxGsap } from '../../lib/gsap.ts';

export interface StackedCardsOptions {
  /** Escala mínima de la carta más tapada. */
  minScale?: number;
  /** Cuánto se achica cada carta por cada una que tiene encima. */
  step?: number;
}

export function createStackedCards(root: HTMLElement, { minScale = 0.86, step = 0.04 }: StackedCardsOptions = {}): FxHandle {
  const { gsap } = fxGsap();
  const cards = parts(root, 'stack-card');

  const off = motionSwitch({
    full: () => {
      const restore = bundle(...cards.map((c) => preserve(c, { styles: ['transform', 'scale', 'translate', '--fx-covered'] })));
      const ctx = gsap.context(() => {
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          const above = cards.length - 1 - i;
          gsap.to(card, {
            scale: Math.max(minScale, 1 - step * above),
            '--fx-covered': 1,
            ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top+=15%', scrub: true },
          });
        });
      }, root);
      return () => {
        ctx.revert();
        restore();
      };
    },
  });

  return { destroy: off };
}

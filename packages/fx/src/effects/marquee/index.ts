/**
 * marquee — una tira que corre sin fin (clientes, servicios, una frase) y
 * responde al scroll: acelera cuando se scrollea rápido y cambia de sentido
 * con la dirección. Los elementos se duplican solo lo necesario para cubrir el
 * ancho, con `aria-hidden` (el lector de pantalla lee la tira una sola vez).
 * Familia: texto · Intensidad 2 · 0 deps.
 *
 *   <div data-fx-marquee style="overflow: hidden">
 *     <div data-fx-marquee-track style="display: flex; width: max-content">…</div>
 *
 * Se pausa fuera de pantalla y, si `pauseOnHover`, con el puntero encima.
 * Reduced motion: quieta y sin copias (en vivo).
 * destroy(): saca las copias, el transform y los listeners.
 */

import { createLoop, damp, motionSwitch, onVisibility, part, preserve, type FxHandle } from '../../core/index.ts';

export interface MarqueeOptions {
  /** Velocidad base en px/s. Negativa: hacia la derecha. */
  speed?: number;
  /** Cuánto suma la velocidad del scroll (0 = nada). */
  scrollBoost?: number;
  /** Invierte el sentido cuando se scrollea hacia arriba. */
  followScroll?: boolean;
  pauseOnHover?: boolean;
}

export function createMarquee(
  root: HTMLElement,
  { speed = 60, scrollBoost = 0.25, followScroll = true, pauseOnHover = false }: MarqueeOptions = {},
): FxHandle {
  const track = part(root, 'marquee-track');
  if (!track) return { destroy() {} };
  const restore = preserve(track, { children: true, styles: ['transform'] });
  const originals = Array.from(track.children);

  const off = motionSwitch({
    full: () => {
      // Copias hasta cubrir dos anchos de pantalla, para que el bucle no muestre el corte.
      const width = () => originals.reduce((w, c) => w + (c as HTMLElement).offsetWidth, 0) || root.clientWidth || 1;
      const base = width();
      const copies = Math.max(1, Math.ceil((root.clientWidth * 2) / base));
      for (let i = 0; i < copies; i++) {
        for (const c of originals) {
          const clone = c.cloneNode(true) as Element;
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('a, button, input').forEach((n) => n.setAttribute('tabindex', '-1'));
          track.append(clone);
        }
      }

      let x = 0;
      let dir = 1;
      let boost = 0;
      let hover = false;
      let lastY = window.scrollY;
      let scrollVel = 0;
      const loop = createLoop((dt) => {
        boost = damp(boost, scrollVel * scrollBoost, 0.001, dt);
        scrollVel = damp(scrollVel, 0, 0.0005, dt);
        const v = hover ? 0 : (speed + Math.abs(boost)) * dir;
        x -= v * dt;
        const span = width();
        if (x <= -span) x += span;
        if (x > 0) x -= span;
        track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      });
      const onScroll = () => {
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        scrollVel = dy * 60; // px/frame → px/s aprox.
        if (followScroll && dy !== 0) dir = dy > 0 ? 1 : -1;
      };
      const enter = () => (hover = true);
      const leave = () => (hover = false);
      addEventListener('scroll', onScroll, { passive: true });
      if (pauseOnHover) {
        root.addEventListener('pointerenter', enter);
        root.addEventListener('pointerleave', leave);
      }
      const offVisible = onVisibility(root, (visible) => (visible ? loop.wake() : loop.stop()));
      return () => {
        offVisible();
        loop.stop();
        removeEventListener('scroll', onScroll);
        root.removeEventListener('pointerenter', enter);
        root.removeEventListener('pointerleave', leave);
        restore();
      };
    },
    reduced: () => restore(),
  });

  return {
    destroy() {
      off();
      restore();
    },
  };
}

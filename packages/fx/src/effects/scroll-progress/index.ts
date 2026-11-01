/**
 * scroll-progress — escribe el avance de scroll como `--fx-p` (0 → 1) en cada
 * `[data-fx-progress]`. Es el motor de los efectos que se resuelven en CSS
 * (foto que se abre, parallax por columnas, tipografía variable, cartas que se
 * reparten). El JS solo mide; el efecto lo dibuja el CSS.
 * Familia: scroll · Intensidad 1–3 (según el CSS) · 0 deps.
 *
 * Modos (`data-fx-progress="…"`):
 * - `""` / `"exit"`: desde que la sección toca el tope hasta que sale por arriba.
 * - `"view"`: cruce completo de la pantalla.
 * - `"sticky"`: sección alta con hijo sticky; 0 al empezar el pin, 1 al terminar.
 *
 * Reduced motion: no escribe `--fx-p`; el CSS define el estado quieto con
 * `var(--fx-p, 1)`.
 * destroy(): saca listeners, el frame pendiente y `--fx-p` de cada elemento.
 */

import { clamp01, motionSwitch, preserve, type FxHandle, type Restore } from '../../core/index.ts';

export interface ScrollProgressOptions {
  selector?: string;
  /** Nombre de la variable que se escribe. */
  variable?: string;
}

export interface ScrollProgressHandle extends FxHandle {
  /** Volvé a buscar elementos (contenido montado después de un fetch). */
  refresh(): void;
}

function progressOf(el: HTMLElement, vh: number): number {
  const r = el.getBoundingClientRect();
  switch (el.getAttribute('data-fx-progress')) {
    case 'view':
      return (vh - r.top) / (vh + r.height);
    case 'sticky':
      return -r.top / Math.max(1, r.height - vh);
    default:
      return -r.top / Math.max(1, r.height);
  }
}

export function createScrollProgress(
  root: HTMLElement,
  { selector = '[data-fx-progress]', variable = '--fx-p' }: ScrollProgressOptions = {},
): ScrollProgressHandle {
  let els: HTMLElement[] = [];
  const restores = new Map<HTMLElement, Restore>();
  const collect = () => {
    els = Array.from(root.querySelectorAll<HTMLElement>(selector));
    for (const el of els) if (!restores.has(el)) restores.set(el, preserve(el, { styles: [variable] }));
  };
  const clear = () => {
    restores.forEach((r) => r());
  };
  collect();
  let schedule = () => {};

  const off = motionSwitch({
    full: () => {
      let frame = 0;
      const measure = () => {
        frame = 0;
        const vh = window.innerHeight;
        for (const el of els) el.style.setProperty(variable, clamp01(progressOf(el, vh)).toFixed(4));
      };
      schedule = () => {
        if (!frame) frame = requestAnimationFrame(measure);
      };
      measure();
      addEventListener('scroll', schedule, { passive: true });
      addEventListener('resize', schedule, { passive: true });
      return () => {
        removeEventListener('scroll', schedule);
        removeEventListener('resize', schedule);
        cancelAnimationFrame(frame);
        schedule = () => {};
        clear();
      };
    },
    reduced: () => clear(),
  });

  return {
    refresh() {
      collect();
      schedule();
    },
    destroy() {
      off();
      clear();
    },
  };
}

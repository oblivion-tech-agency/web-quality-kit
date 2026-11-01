/**
 * text-3d — tipografía que entra en 3D con el scroll: cada línea gira desde
 * atrás (como una persiana que se abre hacia el lector) y se asienta al llegar
 * a su lugar. Para titulares enormes que funcionan como layout.
 * Familia: texto · Intensidad 3 · 0 deps.
 *
 *   <h2 data-fx-3d>
 *     <span data-fx-3d-line>Ocho brazos,</span>
 *     <span data-fx-3d-line>una sola cabeza</span>
 *   </h2>
 *
 *   [data-fx-3d] { perspective: 900px; }
 *   [data-fx-3d-line] { display: block; transform-origin: 50% 100%; backface-visibility: hidden; }
 *
 * Cada línea anima en su propio cruce de la pantalla (de 95% a 55% del alto),
 * con el avance suavizado. Las líneas se marcan a mano: el corte es una
 * decisión de diseño, no de ancho.
 * Reduced motion: las líneas quedan quietas (en vivo).
 * destroy(): saca listeners y frame y devuelve los transforms originales.
 */

import { bundle, clamp01, createLoop, damp, motionSwitch, parts, preserve, progress, type FxHandle } from '../../core/index.ts';

export interface Text3DOptions {
  /** Ángulo inicial en grados (positivo: la línea viene acostada hacia atrás). */
  angle?: number;
  /** Profundidad inicial en px. */
  depth?: number;
  /** Fracciones del alto de pantalla donde empieza y termina cada línea. */
  from?: number;
  to?: number;
}

export function createText3D(root: HTMLElement, { angle = 75, depth = -120, from = 0.95, to = 0.55 }: Text3DOptions = {}): FxHandle {
  const lines = parts(root, '3d-line');
  if (!lines.length) return { destroy() {} };
  const restore = bundle(...lines.map((l) => preserve(l, { styles: ['transform', 'opacity'] })));

  const off = motionSwitch({
    full: () => {
      const target = lines.map(() => 0);
      const value = lines.map(() => 0);
      const paint = () => {
        lines.forEach((l, i) => {
          const k = value[i] ?? 0;
          const a = (1 - k) * angle;
          const z = (1 - k) * depth;
          l.style.transform = `translate3d(0, ${((1 - k) * 0.35).toFixed(3)}em, ${z.toFixed(1)}px) rotateX(${a.toFixed(2)}deg)`;
          l.style.opacity = String(clamp01(0.15 + k * 0.85).toFixed(3));
        });
      };
      const read = () => {
        const vh = window.innerHeight;
        lines.forEach((l, i) => {
          const r = l.getBoundingClientRect();
          // 0 cuando el pie de la línea está en `from`, 1 cuando llega a `to`.
          target[i] = 1 - progress(r.bottom / vh, to, from);
        });
      };
      const loop = createLoop((dt) => {
        let moving = false;
        lines.forEach((_, i) => {
          const t = target[i] ?? 0;
          let v = damp(value[i] ?? 0, t, 0.0008, dt);
          if (Math.abs(t - v) < 0.0005) v = t;
          else moving = true;
          value[i] = v;
        });
        paint();
        return moving;
      });
      const kick = () => {
        read();
        loop.wake();
      };
      read();
      lines.forEach((_, i) => (value[i] = target[i] ?? 0));
      paint();
      addEventListener('scroll', kick, { passive: true });
      addEventListener('resize', kick, { passive: true });
      return () => {
        removeEventListener('scroll', kick);
        removeEventListener('resize', kick);
        loop.stop();
        restore();
      };
    },
  });

  return {
    destroy() {
      off();
      restore();
    },
  };
}

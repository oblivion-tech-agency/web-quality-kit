/**
 * route-draw — un trazo SVG que se dibuja con el scroll mientras la sección
 * está fijada, con un marcador orientado según la tangente y paradas que se
 * encienden al pasar. Para todo sujeto con una línea propia: una ruta, un río,
 * un cable, una cadena de montaje, una línea de tiempo.
 * Familia: scroll y narrativa · Intensidad 3 · 0 deps · Firma posible.
 *
 *   <section data-fx-route class="h-[380vh]">
 *     <div class="sticky top-0 h-svh">
 *       <svg>…<path data-fx-path />…<g data-fx-marker>…</g><circle data-fx-stop …/></svg>
 *
 * Reduced motion: pinta el recorrido terminado y no escucha el scroll (en vivo).
 * destroy(): saca listeners y frame y devuelve al trazo, al marcador y a las
 * paradas sus atributos y estilos originales.
 */

import { bundle, clamp01, createLoop, damp, motionSwitch, part, parts, preserve, progress, type FxHandle } from '../../core/index.ts';

/**
 * Fracción (0–1) del largo del trazo más cercana a un punto: para ubicar las
 * paradas sin calcular a mano dónde cae cada una.
 */
export function nearestFraction(path: SVGGeometryElement, x: number, y: number, samples = 600): number {
  const len = path.getTotalLength();
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= samples; i++) {
    const p = path.getPointAtLength((i / samples) * len);
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestD) [best, bestD] = [i / samples, d];
  }
  return best;
}

export interface RouteInfo {
  x: number;
  y: number;
  angle: number;
  active: number;
}

export interface RouteDrawOptions {
  path?: SVGGeometryElement | null;
  marker?: SVGGraphicsElement | null;
  /** Fracción de cada parada, en orden. Por defecto se calcula desde `[data-fx-stop]` (cx/cy). */
  stops?: number[];
  /** Elementos que reciben `data-fx-passed` al llegar a la parada i. */
  stopEls?: Element[][];
  /** Tramo del pin que mapea a 0 → 1, para dejar aire al entrar y salir. */
  range?: [number, number];
  onProgress?: (t: number, info: RouteInfo) => void;
}

export function createRouteDraw(section: HTMLElement, options: RouteDrawOptions = {}): FxHandle {
  const path = options.path ?? part<SVGGeometryElement>(section, 'path');
  if (!path) return { destroy() {} };
  const marker = options.marker ?? part<SVGGraphicsElement>(section, 'marker');
  const stopNodes = parts<SVGGraphicsElement>(section, 'stop');
  const stopEls = options.stopEls ?? stopNodes.map((n) => [n]);
  const stops =
    options.stops ??
    stopNodes.map((n) => nearestFraction(path, Number(n.getAttribute('cx')), Number(n.getAttribute('cy'))));
  const [r0, r1] = options.range ?? [0.05, 0.9];

  const restore = bundle(
    preserve(path, { attributes: ['pathLength'], styles: ['stroke-dasharray', 'stroke-dashoffset'] }),
    marker && preserve(marker, { attributes: ['transform'] }),
    ...stopEls.flat().map((el) => preserve(el, { attributes: ['data-fx-passed'] })),
  );

  const len = path.getTotalLength();
  path.setAttribute('pathLength', '1');
  path.style.strokeDasharray = '1 1';

  const paint = (t: number) => {
    path.style.strokeDashoffset = String(1 - t);
    const l = t * len;
    const a = path.getPointAtLength(l);
    const p0 = path.getPointAtLength(Math.max(0, l - 0.5));
    const p1 = path.getPointAtLength(Math.min(len, l + 0.5));
    const angle = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
    marker?.setAttribute('transform', `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${angle.toFixed(1)})`);
    let active = 0;
    stops.forEach((f, i) => {
      const passed = t + 0.004 >= f;
      if (passed) active = i;
      stopEls[i]?.forEach((el) => el.toggleAttribute('data-fx-passed', passed));
    });
    options.onProgress?.(t, { x: a.x, y: a.y, angle, active });
  };

  const off = motionSwitch({
    full: () => {
      let target = 0;
      let value = 0;
      const read = () => {
        const r = section.getBoundingClientRect();
        const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
        target = progress(p, r0, r1);
      };
      const loop = createLoop((dt) => {
        value = damp(value, target, 0.0015, dt);
        if (Math.abs(target - value) < 0.0004) value = target;
        paint(value);
        return value !== target;
      });
      const kick = () => {
        read();
        loop.wake();
      };
      read();
      value = target;
      paint(value);
      addEventListener('scroll', kick, { passive: true });
      addEventListener('resize', kick, { passive: true });
      return () => {
        removeEventListener('scroll', kick);
        removeEventListener('resize', kick);
        loop.stop();
      };
    },
    reduced: () => paint(1),
  });

  return {
    destroy() {
      off();
      restore();
    },
  };
}

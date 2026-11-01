/**
 * Recorrido que se dibuja con el scroll: un trazo SVG avanza mientras la
 * sección está fijada, un marcador lo sigue orientado según la tangente y
 * las paradas se encienden al pasar. Nació como el corredor de Ruta 3 de
 * Transporte Lehman; sirve para cualquier sujeto que tenga una línea propia:
 * una ruta, un río, un cable, una cadena de montaje, una línea de tiempo.
 *
 * Marcado esperado:
 *
 *   <section class="h-[380vh]">               ← alto: define cuánto scroll dura
 *     <div class="sticky top-0 h-svh">
 *       <svg>…<path id="route" />…<g id="marker">…</g></svg>
 *
 * Contrato del catálogo:
 * - Sin literales de color: el trazo y el marcador se pintan desde el CSS.
 * - `destroy()` saca listeners y el frame pendiente.
 * - Con `prefers-reduced-motion` pinta el recorrido terminado y no escucha
 *   el scroll. Conviene que el SSR también lo traiga terminado.
 * - El scroll se suaviza con lerp exponencial (el marcador planea, no salta).
 */

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Fracción (0–1) del largo del trazo más cercana a un punto: para ubicar las
 * paradas sin calcular a mano dónde cae cada una.
 * @param {SVGGeometryElement} path @param {number} x @param {number} y
 */
export function nearestFraction(path, x, y, samples = 600) {
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

/**
 * @typedef {{ x: number, y: number, angle: number, active: number }} RouteInfo
 * @param {{
 *   section: HTMLElement,
 *   path: SVGGeometryElement,
 *   marker?: SVGGraphicsElement,
 *   stops?: number[],
 *   stopEls?: Element[][],
 *   range?: [number, number],
 *   onProgress?: (t: number, info: RouteInfo) => void,
 * }} options
 *   `stops`: fracciones de cada parada, en orden. `stopEls[i]`: elementos que
 *   reciben `data-passed` al llegar a la parada i (círculo, etiqueta, fila).
 *   `range`: tramo del pin que mapea a 0 → 1, para dejar aire al entrar y salir.
 * @returns {{ destroy(): void }}
 */
export function createRouteDraw({ section, path, marker, stops = [], stopEls = [], range = [0.05, 0.9], onProgress }) {
  const len = path.getTotalLength();
  path.setAttribute('pathLength', '1');
  path.style.strokeDasharray = '1 1';

  const paint = (t) => {
    path.style.strokeDashoffset = String(1 - t);
    const l = t * len;
    const a = path.getPointAtLength(l);
    // Tangente con medio punto a cada lado; en los extremos queda de un solo lado.
    const p0 = path.getPointAtLength(Math.max(0, l - 0.5));
    const p1 = path.getPointAtLength(Math.min(len, l + 0.5));
    const angle = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
    marker?.setAttribute('transform', `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${angle.toFixed(1)})`);

    let active = 0;
    stops.forEach((f, i) => {
      const passed = t + 0.004 >= f;
      if (passed) active = i;
      stopEls[i]?.forEach((el) => el.toggleAttribute('data-passed', passed));
    });
    onProgress?.(t, { x: a.x, y: a.y, angle, active });
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paint(1);
    return { destroy() {} };
  }

  let target = 0;
  let value = 0;
  let raf = 0;
  let last = 0;

  const read = () => {
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
    target = clamp01((p - range[0]) / (range[1] - range[0]));
  };
  const tick = (now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
    last = now;
    value += (target - value) * (1 - Math.pow(0.0015, dt));
    if (Math.abs(target - value) < 0.0004) value = target;
    paint(value);
    raf = value === target ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => {
    read();
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };

  read();
  value = target;
  paint(value);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });

  return {
    destroy() {
      removeEventListener('scroll', kick);
      removeEventListener('resize', kick);
      cancelAnimationFrame(raf);
    },
  };
}

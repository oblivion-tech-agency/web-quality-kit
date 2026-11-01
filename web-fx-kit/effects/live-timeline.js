/**
 * "Estado en vivo" simulado: una línea de tiempo de tramos (moverse,
 * detenerse) que se reproduce en bucle y le pasa el estado de cada frame a
 * quien dibuja. Es el panel de rastreo del hero de Transporte Lehman, pero
 * sirve para cualquier proceso que el sujeto tenga: un pedido que avanza por
 * estados, una máquina que cambia de etapa, una consulta que se procesa.
 *
 * El módulo no toca el DOM: solo calcula el tiempo. El dibujo (camión,
 * barra, textos) lo hace `onFrame`, escribiendo refs directo, sin re-render.
 *
 * Lo que se simula se etiqueta como simulación en la interfaz.
 *
 * Contrato del catálogo:
 * - `destroy()` corta el loop y el observer.
 * - Se pausa fuera de pantalla y retoma donde quedó.
 * - Con `prefers-reduced-motion` llama `onFrame` una sola vez, con el
 *   estado de `stillAt` (fracción del loop), y no anima.
 */

export const easeInOutSine = (k) => 0.5 - Math.cos(Math.PI * k) / 2;

/**
 * @typedef {{ from: number, to: number, dur: number, moving: boolean, index: number }} Segment
 * @typedef {{ value: number, segment: Segment, k: number, elapsed: number, loop: number }} FrameState
 */

/**
 * Tramos a partir de paradas sobre un eje (km, %, etapas): una espera en cada
 * parada y un viaje proporcional a la distancia hasta la siguiente.
 * @param {number[]} positions  posición de cada parada, creciente
 * @param {{ travel?: number, dwell?: number, lastDwell?: number, minTravel?: number }} [options]
 *   `travel`: ms que dura el recorrido entero, repartidos según la distancia.
 * @returns {Segment[]}
 */
export function segmentsFromStops(positions, { travel = 15000, dwell = 650, lastDwell = 2400, minTravel = 1100 } = {}) {
  const span = positions[positions.length - 1] - positions[0] || 1;
  return positions.flatMap((pos, i) => {
    const last = i === positions.length - 1;
    const wait = { from: pos, to: pos, dur: last ? lastDwell : dwell, moving: false, index: i };
    if (last) return [wait];
    const next = positions[i + 1];
    const dur = Math.max(minTravel, ((next - pos) / span) * travel);
    return [wait, { from: pos, to: next, dur, moving: true, index: i }];
  });
}

/**
 * @param {Element} el  lo que se observa para pausar fuera de pantalla
 * @param {{ segments: Segment[], onFrame: (s: FrameState) => void, ease?: (k: number) => number, stillAt?: number }} options
 * @returns {{ destroy(): void }}
 */
export function createLiveTimeline(el, { segments, onFrame, ease = easeInOutSine, stillAt = 0.5 }) {
  const loop = segments.reduce((a, s) => a + s.dur, 0);

  /** @param {number} elapsed */
  const stateAt = (elapsed) => {
    let t = elapsed % loop;
    let i = 0;
    while (i < segments.length - 1 && t >= segments[i].dur) t -= segments[i++].dur;
    const segment = segments[i];
    const k = Math.min(1, t / segment.dur);
    const value = segment.moving ? segment.from + (segment.to - segment.from) * ease(k) : segment.from;
    return { value, segment, k, elapsed: elapsed % loop, loop };
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onFrame(stateAt(stillAt * loop));
    return { destroy() {} };
  }

  let raf = 0;
  let start = 0;
  let pausedAt = 0;
  const frame = (now) => {
    if (!start) start = now;
    onFrame(stateAt(now - start));
    raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !raf) {
      if (pausedAt) start += performance.now() - pausedAt;
      raf = requestAnimationFrame(frame);
    } else if (!entry.isIntersecting && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      pausedAt = performance.now();
    }
  });
  io.observe(el);

  return {
    destroy() {
      io.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}

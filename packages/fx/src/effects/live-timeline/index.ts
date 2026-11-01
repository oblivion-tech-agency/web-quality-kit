/**
 * live-timeline — un proceso del sujeto simulado en bucle (un viaje, un pedido
 * que avanza, una máquina que cambia de etapa). No toca el DOM: calcula el
 * estado de cada frame y se lo pasa a `onFrame`, que dibuja escribiendo refs.
 * Familia: interacción / estado · Intensidad 2 · 0 deps.
 *
 * Lo simulado se etiqueta como simulación en la interfaz.
 *
 * Reduced motion: llama `onFrame` una vez con el estado de `stillAt` y no anima
 * (cambia en vivo). Se pausa fuera de pantalla y retoma donde quedó.
 * destroy(): corta el loop y el observer.
 */

import { motionSwitch, onVisibility, type FxHandle } from '../../core/index.ts';

export const easeInOutSine = (k: number): number => 0.5 - Math.cos(Math.PI * k) / 2;

export interface Segment {
  from: number;
  to: number;
  dur: number;
  moving: boolean;
  index: number;
}

export interface FrameState {
  value: number;
  segment: Segment;
  k: number;
  elapsed: number;
  loop: number;
}

/**
 * Tramos a partir de paradas sobre un eje (km, %, etapas): una espera en cada
 * parada y un viaje proporcional a la distancia hasta la siguiente.
 * `travel`: ms del recorrido entero, repartidos según la distancia.
 */
export function segmentsFromStops(
  positions: number[],
  { travel = 15000, dwell = 650, lastDwell = 2400, minTravel = 1100 } = {},
): Segment[] {
  const first = positions[0] ?? 0;
  const span = (positions[positions.length - 1] ?? first) - first || 1;
  return positions.flatMap((pos, i) => {
    const last = i === positions.length - 1;
    const wait: Segment = { from: pos, to: pos, dur: last ? lastDwell : dwell, moving: false, index: i };
    if (last) return [wait];
    const next = positions[i + 1] ?? pos;
    const dur = Math.max(minTravel, ((next - pos) / span) * travel);
    return [wait, { from: pos, to: next, dur, moving: true, index: i }];
  });
}

export interface LiveTimelineOptions {
  segments: Segment[];
  onFrame: (state: FrameState) => void;
  ease?: (k: number) => number;
  /** Fracción del loop que se muestra quieta con reduced motion. */
  stillAt?: number;
}

export function createLiveTimeline(
  el: HTMLElement,
  { segments, onFrame, ease = easeInOutSine, stillAt = 0.5 }: LiveTimelineOptions,
): FxHandle {
  const loop = segments.reduce((a, s) => a + s.dur, 0) || 1;
  const stateAt = (elapsed: number): FrameState => {
    let t = elapsed % loop;
    let i = 0;
    while (i < segments.length - 1 && t >= (segments[i]?.dur ?? 0)) t -= segments[i++]?.dur ?? 0;
    const segment = segments[i] as Segment;
    const k = Math.min(1, t / segment.dur);
    const value = segment.moving ? segment.from + (segment.to - segment.from) * ease(k) : segment.from;
    return { value, segment, k, elapsed: elapsed % loop, loop };
  };

  const off = motionSwitch({
    full: () => {
      let raf = 0;
      let start = 0;
      let pausedAt = 0;
      const frame = (now: number) => {
        if (!start) start = now;
        onFrame(stateAt(now - start));
        raf = requestAnimationFrame(frame);
      };
      const offVisible = onVisibility(el, (visible) => {
        if (visible && !raf) {
          if (pausedAt) start += performance.now() - pausedAt;
          raf = requestAnimationFrame(frame);
        } else if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
          pausedAt = performance.now();
        }
      });
      return () => {
        offVisible();
        cancelAnimationFrame(raf);
      };
    },
    reduced: () => onFrame(stateAt(stillAt * loop)),
  });

  return { destroy: off };
}

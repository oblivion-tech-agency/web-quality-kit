/**
 * scroll-sequence — el producto gira con el scroll: una secuencia de imágenes
 * (render orbital, video del producto girando, mesa giratoria) en un <canvas>
 * mientras la sección está fijada.
 * Familia: scroll y narrativa · Intensidad 3–4 · 0 deps · Firma posible.
 *
 * Dos modos:
 * - `chapters` (recomendado, con `poses`): el scroll elige el capítulo y el
 *   giro hasta la pose se reproduce solo, a velocidad constante y con fundido.
 * - `scrub` (sin `poses`): el cuadro sigue al scroll con lerp; con pocos
 *   cuadros por tramo se ven saltos al scrollear despacio.
 *
 *   <section data-fx-sequence class="h-[220svh]">
 *     <div class="sticky top-0 h-svh">
 *       <canvas data-fx-canvas></canvas>
 *       <img data-fx-fallback src="frame-001.webp" alt="El producto, de frente">
 *
 * Reduced motion: un solo cuadro (`stillFrame`), sin escuchar el scroll (en vivo).
 * destroy(): saca listeners y observer, corta las cargas, suelta las imágenes
 * y devuelve el canvas y el fallback como estaban.
 */

import { clamp01, createLoop, damp, motionSwitch, part, preserve, progress, bundle, type FxHandle } from '../../core/index.ts';
import { createFramePlayer, frameUrls, loadOrder, type Frames } from '../../lib/frame-player.ts';

/** Capítulo activo: `stops` son las fracciones (0–1) donde empieza cada uno. */
export function chapterAt(p: number, stops: number[]): number {
  let active = 0;
  for (let i = 0; i < stops.length; i++) if (p >= (stops[i] ?? Infinity)) active = i;
  return active;
}

export interface ScrollSequenceOptions {
  frames: Frames;
  canvas?: HTMLCanvasElement | null;
  fallback?: HTMLElement | null;
  /** Tramo del pin que se usa (aire al entrar y salir). */
  range?: [number, number];
  fit?: 'contain' | 'cover';
  /** Cuadro quieto de reduced motion (default: el del medio). */
  stillFrame?: number;
  /** Dónde empieza cada capítulo (fracción del pin). */
  stops?: number[];
  /** Dónde queda la secuencia (0–1) en cada capítulo. Con `poses`, modo capítulos. */
  poses?: number[];
  /** Segundos para recorrer la secuencia entera en modo capítulos. */
  duration?: number;
  onFrame?: (index: number, progress: number) => void;
  onChapter?: (chapter: number) => void;
}

export function createScrollSequence(section: HTMLElement, options: ScrollSequenceOptions): FxHandle {
  const canvas = options.canvas ?? part<HTMLCanvasElement>(section, 'canvas');
  const fallback = options.fallback ?? part(section, 'fallback');
  const urls = frameUrls(options.frames);
  const n = urls.length;
  if (!canvas || !n || !canvas.getContext('2d')) return { destroy() {} };
  const { range = [0, 1], fit = 'contain', stops = [0], poses, duration = 2.4, onFrame, onChapter } = options;

  const player = createFramePlayer({ canvas, urls, fit });
  const still = Math.min(n - 1, Math.max(0, Math.round(options.stillFrame ?? Math.floor(n / 2))));
  const toIndex = (t: number) => Math.round(clamp01(t) * (n - 1));
  const restore = bundle(
    preserve(canvas, { attributes: ['aria-hidden'] }),
    fallback && preserve(fallback, { attributes: ['hidden'] }),
  );
  canvas.setAttribute('aria-hidden', 'true');
  fallback?.setAttribute('hidden', '');
  player.resize();

  let target = 0;
  let value = 0;
  let goal = 0;
  let chapter = -1;
  const paint = () => {
    player.show(clamp01(value) * (n - 1));
    onFrame?.(toIndex(value), poses ? target : value);
  };
  const read = () => {
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
    target = progress(p, range[0], range[1]);
    const ch = chapterAt(target, stops);
    if (ch !== chapter) {
      chapter = ch;
      onChapter?.(ch);
    }
    goal = poses ? (poses[Math.min(ch, poses.length - 1)] ?? 0) : target;
  };
  const loop = createLoop((dt) => {
    if (poses) {
      const step = dt / duration; // velocidad constante: cada cuadro se ve, a ritmo de video
      value = Math.abs(goal - value) <= step ? goal : value + Math.sign(goal - value) * step;
    } else {
      value = damp(value, goal, 0.0015, dt);
      if (Math.abs(goal - value) < 0.0004) value = goal;
    }
    paint();
    return value !== goal;
  });
  const kick = () => {
    read();
    loop.wake();
  };
  const onResize = () => player.resize();
  addEventListener('resize', onResize, { passive: true });

  let started = false;
  const off = motionSwitch({
    full: () => {
      read();
      value = goal; // al montar no anima: aparece en su pose
      paint();
      if (!started) player.loadWhenNear(section, () => loadOrder(n, toIndex(value)));
      started = true;
      addEventListener('scroll', kick, { passive: true });
      return () => {
        removeEventListener('scroll', kick);
        loop.stop();
      };
    },
    reduced: () => {
      player.show(still);
      onFrame?.(still, 0.5);
      if (!started) player.loadWhenNear(section, () => loadOrder(n, still));
      started = true;
    },
  });

  return {
    destroy() {
      off();
      removeEventListener('resize', onResize);
      player.destroy();
      restore();
    },
  };
}

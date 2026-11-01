/**
 * Reproductor de secuencias de imágenes sobre un <canvas>: carga progresiva,
 * dibujo con devicePixelRatio, el cuadro cargado más cercano mientras falta
 * el pedido y fundido entre cuadros vecinos. No decide qué mostrar: eso lo
 * hacen `scroll-sequence` y `turntable`.
 */

import { whenNear } from '../core/index.ts';

/** Orden de carga: primero el cuadro que se va a ver, después cada 8º, cada 4º y el resto. */
export function loadOrder(n: number, first: number): number[] {
  const seen = new Set([first]);
  const out = [first];
  for (const step of [8, 4, 1]) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
    }
  }
  return out;
}

export type Frames = string[] | { count: number; src: (i: number) => string };

export const frameUrls = (frames: Frames): string[] =>
  Array.isArray(frames) ? frames.slice() : Array.from({ length: frames.count }, (_, i) => frames.src(i));

export interface FramePlayer {
  readonly count: number;
  /** Posición con decimales: `12.4` funde el 12 con el 13 al 40%. `wrap` = bucle. */
  show(pos: number, wrap?: boolean): void;
  resize(): void;
  /** Empieza a cargar cuando `el` queda a ~1 pantalla. `order` se evalúa al disparar. */
  loadWhenNear(el: Element, order: () => number[]): void;
  destroy(): void;
}

export function createFramePlayer({
  canvas,
  urls,
  fit = 'contain',
  concurrency = 6,
}: {
  canvas: HTMLCanvasElement;
  urls: string[];
  fit?: 'contain' | 'cover';
  concurrency?: number;
}): FramePlayer {
  const n = urls.length;
  const ctx = canvas.getContext('2d');
  let imgs: (HTMLImageElement | null)[] = new Array(n).fill(null);
  const inFlight = new Set<HTMLImageElement>();
  let queue: number[] = [];
  let offNear: (() => void) | null = null;
  let active = 0;
  let dead = false;
  let want = 0;
  let mix = 0;
  let loop = false;
  let drawn = '';

  const nearest = (i: number) => {
    if (imgs[i]) return i;
    for (let d = 1; d < n; d++) {
      if (i - d >= 0 && imgs[i - d]) return i - d;
      if (i + d < n && imgs[i + d]) return i + d;
    }
    return -1;
  };
  const paintImg = (img: HTMLImageElement, alpha: number) => {
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const s = (fit === 'cover' ? Math.max : Math.min)(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  };
  const draw = () => {
    if (!ctx) return;
    const i = nearest(want);
    if (i < 0) return; // sin cuadros todavía: queda lo que hubiera
    const next = loop ? (i + 1) % n : i + 1;
    const nextImg = next < n ? imgs[next] : null;
    const f = i === want && mix > 0.02 && nextImg ? Math.round(mix * 32) / 32 : 0;
    const key = `${i}:${f}`;
    if (key === drawn) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Base opaca y siguiente encima con alfa: el objeto nunca se vuelve translúcido.
    paintImg(imgs[i] as HTMLImageElement, 1);
    if (f && nextImg) paintImg(nextImg, f);
    drawn = key;
  };
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w;
      canvas.height = h;
      drawn = '';
    }
    draw();
  };
  const pump = () => {
    while (!dead && active < concurrency && queue.length) {
      const i = queue.shift() as number;
      const img = new Image();
      img.decoding = 'async';
      img.src = urls[i] as string;
      inFlight.add(img);
      active++;
      img
        .decode()
        .then(() => {
          if (dead) return;
          imgs[i] = img;
          draw();
        })
        .catch(() => {}) // un cuadro roto no corta nada: se usa el vecino
        .finally(() => {
          inFlight.delete(img);
          active--;
          pump();
        });
    }
  };

  return {
    count: n,
    show(pos, wrap = false) {
      loop = wrap;
      const p = wrap ? ((pos % n) + n) % n : Math.min(n - 1, Math.max(0, pos));
      want = Math.floor(p);
      mix = p - want;
      draw();
    },
    resize,
    loadWhenNear(el, order) {
      offNear = whenNear(el, () => {
        queue = order();
        pump();
      });
    },
    destroy() {
      dead = true;
      offNear?.();
      queue = [];
      for (const img of inFlight) img.src = '';
      for (const img of imgs) if (img) img.src = '';
      inFlight.clear();
      imgs = [];
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

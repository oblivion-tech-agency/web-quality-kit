/**
 * turntable — producto en 360° hecho con cuadros (una vuelta completa) en un
 * <canvas>, con fundido entre cuadros. Gira solo, se arrastra y sigue con
 * inercia. Con giro automático lento se nota el pulso entre ángulos: si el
 * giro es protagonista, usá `model-turntable`.
 * Familia: 3D / producto · Intensidad 2 · 0 deps.
 *
 *   <figure data-fx-turntable>
 *     <canvas data-fx-canvas></canvas>
 *     <img data-fx-fallback src="spin-001.webp" alt="El producto, de frente">
 *
 * Reduced motion: no gira solo ni tiene inercia.
 * destroy(): suelta imágenes y listeners y devuelve canvas y fallback como estaban.
 */

import { bundle, part, preserve, type FxHandle } from '../../core/index.ts';
import { createFramePlayer, frameUrls, loadOrder, type Frames } from '../../lib/frame-player.ts';
import { createSpinControl, type SpinControlOptions } from '../../lib/spin-control.ts';

export interface TurntableOptions extends Partial<Pick<SpinControlOptions, 'input' | 'auto' | 'turnSeconds' | 'label'>> {
  /** Una vuelta completa; el último cuadro justo antes del primero. */
  frames: Frames;
  canvas?: HTMLCanvasElement | null;
  fallback?: HTMLElement | null;
  fit?: 'contain' | 'cover';
  startFrame?: number;
  onFrame?: (index: number, turn: number) => void;
}

export function createTurntable(root: HTMLElement, options: TurntableOptions): FxHandle {
  const canvas = options.canvas ?? (root instanceof HTMLCanvasElement ? root : part<HTMLCanvasElement>(root, 'canvas'));
  const fallback = options.fallback ?? part(root, 'fallback');
  const urls = frameUrls(options.frames);
  const n = urls.length;
  if (!canvas || !n || !canvas.getContext('2d')) return { destroy() {} };

  const player = createFramePlayer({ canvas, urls, fit: options.fit ?? 'contain' });
  const restore = bundle(fallback && preserve(fallback, { attributes: ['hidden'] }));
  fallback?.setAttribute('hidden', '');
  player.resize();

  let shown = -1;
  const control = createSpinControl({
    el: canvas,
    input: options.input,
    auto: options.auto,
    turnSeconds: options.turnSeconds,
    label: options.label,
    start: (options.startFrame ?? 0) / n,
    onTurn: (turn) => {
      const pos = turn * n;
      player.show(pos, true);
      const i = Math.round(pos) % n;
      if (i !== shown) {
        shown = i;
        options.onFrame?.(i, turn);
      }
    },
  });
  player.loadWhenNear(canvas, () => loadOrder(n, Math.round(control.turn * n) % n));
  const onResize = () => player.resize();
  addEventListener('resize', onResize, { passive: true });

  return {
    destroy() {
      control.destroy();
      removeEventListener('resize', onResize);
      player.destroy();
      restore();
    },
  };
}

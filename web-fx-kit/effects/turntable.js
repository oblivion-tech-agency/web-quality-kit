/**
 * Producto en 360° con una secuencia de imágenes: una vuelta completa (render
 * orbital, mesa giratoria) dibujada en un <canvas>, con fundido entre cuadros.
 * Gira solo despacio, se arrastra con el mouse o el dedo y sigue con inercia.
 * Usa `frame-player.js` y `spin-control.js` (se copian juntos).
 *
 * Con cuadros, un giro lento muestra pocos ángulos por segundo y se nota el
 * pulso aunque haya fundido. Si el giro automático es protagonista, usá
 * `model-turntable.js` (Three.js con un .glb): es fluido a cualquier velocidad.
 *
 * Marcado esperado:
 *
 *   <figure>
 *     <canvas class="turntable"></canvas>
 *     <img data-turntable-fallback src="spin-001.webp" alt="El parlante, de frente">
 *
 * Contrato del catálogo:
 * - Sin literales de color.
 * - `destroy()` saca listeners, observers y el frame pendiente, suelta las
 *   imágenes y devuelve el canvas y el fallback como estaban.
 * - Con `prefers-reduced-motion` no gira solo ni tiene inercia.
 * - Teclado: ← → giran de a 15°. En touch el arrastre vertical scrollea.
 */

import { createFramePlayer, frameUrls, loadOrder } from './frame-player.js';
import { createSpinControl } from './spin-control.js';

/**
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   frames: string[] | { count: number, src: (i: number) => string },
 *   fit?: 'contain' | 'cover',
 *   input?: 'drag' | 'hover',
 *   auto?: boolean,
 *   turnSeconds?: number,
 *   startFrame?: number,
 *   fallback?: HTMLElement | null,
 *   label?: string,
 *   onFrame?: (index: number, turn: number) => void,
 * }} options
 *   `frames`: una vuelta completa, el último cuadro justo antes del primero.
 *   Entre cuadro y cuadro se funde el siguiente.
 * @returns {{ destroy(): void }}
 */
export function createTurntable({
  canvas,
  frames,
  fit = 'contain',
  input,
  auto,
  turnSeconds,
  startFrame = 0,
  fallback = canvas.parentElement?.querySelector('[data-turntable-fallback]'),
  label,
  onFrame,
}) {
  const urls = frameUrls(frames);
  const n = urls.length;
  if (!n || !canvas.getContext('2d')) return { destroy() {} };

  const player = createFramePlayer({ canvas, urls, fit });
  let shown = -1;
  const onResize = () => player.resize();

  if (fallback) fallback.hidden = true;
  player.resize();
  const control = createSpinControl({
    el: canvas,
    input,
    auto,
    turnSeconds,
    label,
    start: startFrame / n,
    onTurn: (turn) => {
      const pos = turn * n;
      player.show(pos, true); // con fundido entre cuadros
      const i = Math.round(pos) % n;
      if (i !== shown) {
        shown = i;
        onFrame?.(i, turn);
      }
    },
  });
  player.loadWhenNear(canvas, () => loadOrder(n, Math.round(control.turn * n) % n));
  addEventListener('resize', onResize, { passive: true });

  return {
    destroy() {
      control.destroy();
      removeEventListener('resize', onResize);
      player.destroy();
      if (fallback) fallback.hidden = false;
    },
  };
}

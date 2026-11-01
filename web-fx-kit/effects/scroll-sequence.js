/**
 * Producto que gira con el scroll: una secuencia de imágenes (render orbital,
 * video del producto girando, mesa giratoria) se dibuja en un <canvas>
 * mientras la sección está fijada, y cada tramo del pin muestra el objeto
 * desde otro ángulo. Es la versión barata y predecible de un modelo 3D en
 * vivo: sin Three.js, sin shaders, el mismo resultado en cualquier equipo.
 * Usa `frame-player.js` (se copian juntos).
 *
 * Dos modos:
 * - `chapters` (recomendado, se activa al pasar `poses`): el scroll solo
 *   elige el capítulo; al cambiar, el giro hasta la pose del capítulo se
 *   reproduce solo, con tiempo propio. Siempre fluido, scrollees como scrollees.
 * - `scrub` (sin `poses`): el cuadro sigue al scroll, con lerp. Con pocos
 *   cuadros por tramo se ven los saltos de ángulo al scrollear despacio.
 *
 * Marcado esperado:
 *
 *   <section class="h-[400vh]">                 ← alto: define cuánto dura
 *     <div class="sticky top-0 h-svh">
 *       <canvas></canvas>
 *       <img data-seq-fallback src="frame-001.webp" alt="El parlante, de frente">
 *       <h2>…</h2> <h2>…</h2>                   ← titulares por capítulo
 *
 * Sin JS se ve el <img> del cuadro principal (con su texto alternativo); al
 * montar, el módulo lo oculta y el canvas toma su lugar.
 *
 * Contrato del catálogo:
 * - Sin literales de color.
 * - `destroy()` saca listeners, observer y el frame pendiente, corta las
 *   cargas en vuelo, suelta las imágenes y vuelve a mostrar el fallback.
 * - Con `prefers-reduced-motion` carga y dibuja un solo cuadro (`stillFrame`)
 *   y no escucha el scroll.
 * - Nada se descarga hasta que la sección está a ~1 pantalla de distancia, y
 *   mientras falta un cuadro se dibuja el cargado más cercano.
 */

import { createFramePlayer, frameUrls, loadOrder } from './frame-player.js';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Capítulo activo para un avance dado: `stops` son las fracciones (0–1) donde
 * empieza cada capítulo, en orden. El host marca `data-active` en el titular.
 * @param {number} progress @param {number[]} stops
 * @returns {number}
 */
export function chapters(progress, stops) {
  let active = 0;
  for (let i = 0; i < stops.length; i++) if (progress >= stops[i]) active = i;
  return active;
}

/**
 * @param {{
 *   section: HTMLElement,
 *   canvas: HTMLCanvasElement,
 *   frames: string[] | { count: number, src: (i: number) => string },
 *   range?: [number, number],
 *   fit?: 'contain' | 'cover',
 *   stillFrame?: number,
 *   fallback?: HTMLElement | null,
 *   stops?: number[],
 *   poses?: number[],
 *   duration?: number,
 *   onFrame?: (index: number, progress: number) => void,
 *   onChapter?: (chapter: number) => void,
 * }} options
 *   `range`: tramo del pin que se usa, para dejar aire al entrar y salir.
 *   `stops`: dónde empieza cada capítulo (fracción del pin). `poses`: en qué
 *   punto de la secuencia (0–1) queda el objeto en cada capítulo; con `poses`
 *   el modo es `chapters`. `duration`: segundos para recorrer la secuencia
 *   entera (un salto de un tercio tarda un tercio). La curva del giro conviene
 *   que venga en el render (keyframes con ease): acá se reproduce lineal.
 *   `stillFrame`: cuadro quieto de reduced motion (default, el del medio).
 * @returns {{ destroy(): void }}
 */
export function createScrollSequence({
  section,
  canvas,
  frames,
  range = [0, 1],
  fit = 'contain',
  stillFrame,
  fallback = section.querySelector('[data-seq-fallback]'),
  stops = [0],
  poses,
  duration = 2.4,
  onFrame,
  onChapter,
}) {
  const urls = frameUrls(frames);
  const n = urls.length;
  if (!n || !canvas.getContext('2d')) return { destroy() {} };

  const player = createFramePlayer({ canvas, urls, fit });
  const still = Math.min(n - 1, Math.max(0, Math.round(stillFrame ?? Math.floor(n / 2))));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toIndex = (t) => Math.round(clamp01(t) * (n - 1));

  let target = 0; // avance del pin (0–1), sin suavizar
  let value = 0; // posición en la secuencia (0–1) que se está mostrando
  let goal = 0; // a dónde va `value`
  let chapter = -1;
  let raf = 0;
  let last = 0;

  const paint = () => {
    const i = toIndex(value);
    player.show(clamp01(value) * (n - 1)); // con decimales: funde el cuadro siguiente
    onFrame?.(i, poses ? target : value);
  };
  const read = () => {
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
    target = clamp01((p - range[0]) / (range[1] - range[0]));
    const ch = chapters(target, stops);
    if (ch !== chapter) {
      chapter = ch;
      onChapter?.(ch);
    }
    goal = poses ? poses[Math.min(ch, poses.length - 1)] : target;
  };
  const tick = (now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
    last = now;
    if (poses) {
      // Velocidad constante: cada cuadro intermedio se ve, a ritmo de video.
      const step = dt / duration;
      value = Math.abs(goal - value) <= step ? goal : value + Math.sign(goal - value) * step;
    } else {
      value += (goal - value) * (1 - Math.pow(0.0015, dt));
      if (Math.abs(goal - value) < 0.0004) value = goal;
    }
    paint();
    raf = value === goal ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => {
    read();
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const onResize = () => {
    player.resize();
    if (!reduce) kick();
  };

  const prevHidden = canvas.getAttribute('aria-hidden');
  canvas.setAttribute('aria-hidden', 'true');
  if (fallback) fallback.hidden = true;
  player.resize();

  if (reduce) {
    player.show(still);
    onFrame?.(still, 0.5);
    player.loadWhenNear(section, () => [still]);
  } else {
    read();
    value = goal; // al montar no hay animación: aparece en su pose
    paint();
    player.loadWhenNear(section, () => loadOrder(n, toIndex(value)));
    addEventListener('scroll', kick, { passive: true });
  }
  addEventListener('resize', onResize, { passive: true });

  return {
    destroy() {
      removeEventListener('scroll', kick);
      removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      raf = 0;
      player.destroy();
      if (prevHidden === null) canvas.removeAttribute('aria-hidden');
      else canvas.setAttribute('aria-hidden', prevHidden);
      if (fallback) fallback.hidden = false;
    },
  };
}

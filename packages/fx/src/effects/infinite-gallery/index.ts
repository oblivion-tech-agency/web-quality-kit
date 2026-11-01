/**
 * infinite-gallery — una grilla de imágenes sin bordes que se recorre
 * arrastrando en cualquier dirección (mouse, dedo, rueda o flechas), con
 * inercia. Las celdas se reciclan al salir por un borde y entran por el otro:
 * no se termina nunca. Para portfolios, archivos, moodboards.
 * Familia: imagen · Intensidad 3 · 0 deps.
 *
 *   <div data-fx-gallery style="height: 100svh; overflow: hidden; position: relative; touch-action: none">
 *     <figure data-fx-gallery-item>…</figure> …
 *
 * El módulo posiciona las celdas en absoluto y suma copias (`aria-hidden`,
 * sin foco) hasta cubrir la pantalla. Sin JS, el CSS debería mostrar una
 * grilla común con scroll.
 * Reduced motion: sin inercia (el arrastre sigue funcionando, es del usuario).
 * destroy(): saca copias, posiciones y listeners.
 */

import { createLoop, onVisibility, parts, preserve, prefersReducedMotion, bundle, type FxHandle } from '../../core/index.ts';

export interface InfiniteGalleryOptions {
  /** Tamaño de cada celda en px (ancho, alto) incluido el espacio entre celdas. */
  cell?: [number, number];
  /** Las columnas impares se corren media celda para que no parezca planilla. */
  stagger?: boolean;
  label?: string;
}

export function createInfiniteGallery(root: HTMLElement, { cell = [320, 400], stagger = true, label = 'Galería: arrastrá o usá las flechas para recorrerla' }: InfiniteGalleryOptions = {}): FxHandle {
  const originals = parts(root, 'gallery-item');
  if (!originals.length) return { destroy() {} };
  const restoreRoot = preserve(root, { children: true, attributes: ['tabindex', 'role', 'aria-label', 'data-fx-gallery-on'] });
  const restoreItems = bundle(...originals.map((o) => preserve(o, { styles: ['position', 'left', 'top', 'width', 'height', 'transform'] })));
  const [cw, ch] = cell;

  root.setAttribute('data-fx-gallery-on', '');
  root.tabIndex = 0;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', label);

  // Celdas suficientes para cubrir la pantalla más un borde.
  const cols = Math.ceil(root.clientWidth / cw) + 2;
  const rows = Math.ceil(root.clientHeight / ch) + 2;
  const cells: HTMLElement[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const src = originals[i % originals.length] as HTMLElement;
    const el = i < originals.length ? src : (src.cloneNode(true) as HTMLElement);
    if (i >= originals.length) {
      el.setAttribute('aria-hidden', 'true');
      el.querySelectorAll('a, button').forEach((n) => n.setAttribute('tabindex', '-1'));
      root.append(el);
    }
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = `${cw}px`;
    el.style.height = `${ch}px`;
    cells.push(el);
  }
  const W = cols * cw;
  const H = rows * ch;

  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  const wrap = (v: number, size: number) => ((v % size) + size) % size;
  const paint = () => {
    cells.forEach((el, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const ox = wrap(c * cw + x, W) - cw;
      const oy = wrap(r * ch + y + (stagger && c % 2 ? ch / 2 : 0), H) - ch;
      el.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`;
    });
  };
  const loop = createLoop((dt) => {
    if (!dragging) {
      x += vx * dt;
      y += vy * dt;
      const k = Math.pow(0.04, dt);
      vx *= k;
      vy *= k;
    }
    paint();
    return dragging || Math.abs(vx) > 2 || Math.abs(vy) > 2;
  });
  const onDown = (e: PointerEvent) => {
    dragging = true;
    vx = vy = 0;
    [lastX, lastY, lastT] = [e.clientX, e.clientY, e.timeStamp];
    root.setPointerCapture?.(e.pointerId);
    loop.wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    x += dx;
    y += dy;
    if (!prefersReducedMotion()) {
      vx = vx * 0.5 + (dx / dt) * 0.5;
      vy = vy * 0.5 + (dy / dt) * 0.5;
    }
    [lastX, lastY, lastT] = [e.clientX, e.clientY, e.timeStamp];
  };
  const onUp = () => {
    dragging = false;
    if (prefersReducedMotion()) vx = vy = 0;
    loop.wake();
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    x -= e.deltaX;
    y -= e.deltaY;
    paint();
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    x += d[0] * cw * 0.5;
    y += d[1] * ch * 0.5;
    paint();
  };

  paint();
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('keydown', onKey);
  const offVisible = onVisibility(root, (v) => (v ? loop.wake() : loop.stop()));

  return {
    destroy() {
      offVisible();
      loop.stop();
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('keydown', onKey);
      restoreItems();
      restoreRoot();
    },
  };
}

/**
 * carousel-3d — las piezas de una colección giran en un anillo 3D mientras la
 * sección está fijada: el scroll hace girar el anillo y la pieza de frente se
 * marca con `data-fx-front`. Para colecciones, flota, productos, casos.
 * Familia: scroll · Intensidad 3 · 0 deps.
 *
 *   <section data-fx-carousel class="h-[260svh]">
 *     <div class="sticky top-0 h-svh" data-fx-ring-stage>
 *       <ul data-fx-ring> <li data-fx-ring-item>…</li> … </ul>
 *
 *   [data-fx-ring-stage] { perspective: 1400px; display: grid; place-items: center; overflow: hidden; }
 *   [data-fx-ring] { position: relative; transform-style: preserve-3d; width: var(--card-w); height: var(--card-h); }
 *   [data-fx-ring-item] { position: absolute; inset: 0; backface-visibility: hidden; }
 *   [data-fx-ring-item][data-fx-front] { … resaltado … }
 *
 * Sin JS (y con reduced motion) el CSS debería mostrar las piezas en una fila
 * con scroll horizontal: el módulo solo pone `data-fx-ring-on` en la sección
 * cuando el anillo está activo, para que el CSS 3D aplique solo entonces.
 * Debajo de `minWidth` no gira (queda la fila).
 * destroy(): devuelve transforms y atributos.
 */

import { bundle, clamp01, createLoop, damp, motionSwitch, part, parts, preserve, progress, type FxHandle } from '../../core/index.ts';

export interface Carousel3DOptions {
  /** Vueltas completas que da el anillo en todo el pin. */
  turns?: number;
  range?: [number, number];
  minWidth?: number;
  onFront?: (index: number) => void;
}

export function createCarousel3D(section: HTMLElement, { turns = 1, range = [0.05, 0.95], minWidth = 768, onFront }: Carousel3DOptions = {}): FxHandle {
  const ring = part(section, 'ring');
  const items = parts(section, 'ring-item');
  if (!ring || items.length < 3) return { destroy() {} };
  const restore = bundle(
    preserve(section, { attributes: ['data-fx-ring-on'] }),
    preserve(ring, { styles: ['transform'] }),
    ...items.map((it) => preserve(it, { styles: ['transform'], attributes: ['data-fx-front', 'aria-hidden'] })),
  );
  const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
  const n = items.length;
  const step = 360 / n;

  let teardown: (() => void) | null = null;
  const mount = () => {
    section.setAttribute('data-fx-ring-on', '');
    const radius = () => Math.round((ring.offsetWidth / 2) / Math.tan(Math.PI / n)) + 24;
    const layout = () => {
      const r = radius();
      items.forEach((it, i) => (it.style.transform = `rotateY(${i * step}deg) translateZ(${r}px)`));
      return r;
    };
    let r = layout();
    let target = 0;
    let value = 0;
    let front = -1;
    const paint = () => {
      const deg = -value * turns * 360;
      ring.style.transform = `translateZ(${-r}px) rotateY(${deg.toFixed(2)}deg)`;
      const idx = ((Math.round(-deg / step) % n) + n) % n;
      if (idx !== front) {
        front = idx;
        items.forEach((it, i) => it.toggleAttribute('data-fx-front', i === idx));
        onFront?.(idx);
      }
    };
    const read = () => {
      const b = section.getBoundingClientRect();
      target = progress(clamp01(-b.top / Math.max(1, b.height - window.innerHeight)), range[0], range[1]);
    };
    const loop = createLoop((dt) => {
      value = damp(value, target, 0.002, dt);
      if (Math.abs(target - value) < 0.0002) value = target;
      paint();
      return value !== target;
    });
    const kick = () => {
      read();
      loop.wake();
    };
    const onResize = () => {
      r = layout();
      kick();
    };
    read();
    value = target;
    paint();
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    teardown = () => {
      removeEventListener('scroll', kick);
      removeEventListener('resize', onResize);
      loop.stop();
      restore();
    };
  };
  const unmount = () => {
    teardown?.();
    teardown = null;
  };

  const off = motionSwitch({
    full: () => {
      const sync = () => (wide.matches ? !teardown && mount() : unmount());
      sync();
      wide.addEventListener('change', sync);
      return () => {
        wide.removeEventListener('change', sync);
        unmount();
      };
    },
  });

  return {
    destroy() {
      off();
      restore();
    },
  };
}

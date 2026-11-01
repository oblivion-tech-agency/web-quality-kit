/**
 * pinned-horizontal — galería horizontal que avanza con el scroll vertical: la
 * sección se fija y la tira se desliza. Para flota, proyectos, menú,
 * colección: cosas del sujeto que se miran de a una, en orden.
 * Familia: scroll y narrativa · Intensidad 2 · 0 deps.
 *
 *   <section data-fx-pin>
 *     <div data-fx-pin-viewport>         ← el que se fija
 *       <ul data-fx-pin-track>…</ul>     ← el que se desliza
 *
 * El módulo le da a la sección la altura justa y escribe `data-fx-pinned`. El
 * CSS fija solo con ese atributo; sin él la tira es un carrusel nativo:
 *
 *   [data-fx-pin-track] { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
 *   [data-fx-pinned] [data-fx-pin-viewport] { position: sticky; top: 0; height: 100svh; overflow: hidden; }
 *   [data-fx-pinned] [data-fx-pin-track] { overflow: visible; will-change: transform; }
 *
 * Debajo de `minWidth` y con reduced motion no fija: queda el carrusel nativo.
 * Teclado: si el foco entra a un elemento fuera de vista, la página scrollea
 * hasta donde ese elemento queda a la vista. Escribe el avance como `--fx-p`.
 * destroy(): devuelve la sección a su altura y saca listeners y atributos.
 */

import { clamp01, part, preserve, type FxHandle } from '../../core/index.ts';

export interface PinnedHorizontalOptions {
  viewport?: HTMLElement | null;
  track?: HTMLElement | null;
  minWidth?: number;
}

export function createPinnedHorizontal(section: HTMLElement, options: PinnedHorizontalOptions = {}): FxHandle {
  const viewport = options.viewport ?? part(section, 'pin-viewport');
  const track = options.track ?? part(section, 'pin-track');
  if (!viewport || !track) return { destroy() {} };
  const wide = window.matchMedia(`(min-width: ${options.minWidth ?? 768}px)`);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const restoreSection = preserve(section, { attributes: ['data-fx-pinned'], styles: ['height', '--fx-p'] });
  const restoreTrack = preserve(track, { styles: ['transform'] });

  let maxX = 0;
  let frame = 0;
  let on = false;

  const layout = () => {
    maxX = Math.max(0, track.scrollWidth - viewport.clientWidth);
    section.style.height = `${maxX + window.innerHeight}px`;
  };
  const paint = () => {
    frame = 0;
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
    track.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px, 0, 0)`;
    section.style.setProperty('--fx-p', p.toFixed(4));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const onResize = () => {
    layout();
    schedule();
  };
  // Al enfocar algo fuera de vista, el navegador scrollea el viewport fijado en
  // vez de la página: se deshace y se mueve la página al punto del pin donde el
  // elemento queda a la vista.
  const unscroll = () => {
    if (viewport.scrollLeft) viewport.scrollLeft = 0;
  };
  const onFocus = (e: FocusEvent) => {
    const item = (e.target as Element).closest('[data-fx-pin-track] > *') as HTMLElement | null;
    if (!item || maxX === 0) return;
    requestAnimationFrame(() => {
      unscroll();
      const start = item.offsetLeft - track.offsetLeft;
      const x = clamp01((start + item.offsetWidth - viewport.clientWidth) / maxX);
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + x * (section.offsetHeight - window.innerHeight), behavior: 'instant' as ScrollBehavior });
      paint();
    });
  };

  const enable = () => {
    on = true;
    section.setAttribute('data-fx-pinned', '');
    layout();
    paint();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    section.addEventListener('focusin', onFocus);
    viewport.addEventListener('scroll', unscroll, { passive: true });
  };
  const disable = () => {
    on = false;
    removeEventListener('scroll', schedule);
    removeEventListener('resize', onResize);
    section.removeEventListener('focusin', onFocus);
    viewport.removeEventListener('scroll', unscroll);
    cancelAnimationFrame(frame);
    frame = 0;
    restoreSection();
    restoreTrack();
  };
  const sync = () => {
    const want = wide.matches && !reduce.matches;
    if (want && !on) enable();
    else if (!want && on) disable();
  };

  sync();
  wide.addEventListener('change', sync);
  reduce.addEventListener('change', sync);

  return {
    destroy() {
      wide.removeEventListener('change', sync);
      reduce.removeEventListener('change', sync);
      if (on) disable();
    },
  };
}

/**
 * Galería horizontal que avanza con el scroll vertical: la sección se fija y
 * la tira de elementos se desliza de derecha a izquierda. Para flota,
 * proyectos, menú, colección: una serie de cosas del sujeto que se miran de
 * a una, en orden.
 *
 * Marcado esperado:
 *
 *   <section data-pin>
 *     <div data-pin-viewport>            ← el que se fija
 *       <ul data-pin-track>…</ul>        ← el que se desliza
 *
 * El módulo le da a la sección la altura justa (lo que sobra de la tira más
 * una pantalla) y escribe `data-pinned` en la sección. El CSS fija solo con
 * ese atributo; sin él la tira es un carrusel nativo con scroll-snap:
 *
 *   [data-pin-track] { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
 *   [data-pinned] [data-pin-viewport] { position: sticky; top: 0; height: 100svh; overflow: hidden; }
 *   [data-pinned] [data-pin-track] { overflow: visible; will-change: transform; }
 *
 * Contrato del catálogo:
 * - `destroy()` devuelve la sección a su altura y saca listeners.
 * - Debajo de `minWidth` y con `prefers-reduced-motion` no fija: queda el
 *   carrusel nativo, que con el pulgar es mejor.
 * - Teclado: si el foco entra a un elemento de la tira fuera de vista, la
 *   página scrollea hasta donde ese elemento queda a la vista.
 * - Escribe el avance como `--p` en la sección, para contadores o barras.
 */

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * @param {HTMLElement} section
 * @param {{ viewport?: HTMLElement, track?: HTMLElement, minWidth?: number }} [options]
 * @returns {{ destroy(): void }}
 */
export function createPinnedHorizontal(
  section,
  {
    viewport = section.querySelector('[data-pin-viewport]'),
    track = section.querySelector('[data-pin-track]'),
    minWidth = 768,
  } = {},
) {
  if (!viewport || !track) return { destroy() {} };
  const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    section.style.setProperty('--p', p.toFixed(4));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const onResize = () => {
    layout();
    schedule();
  };
  // Al enfocar algo fuera de vista, el navegador scrollea el viewport fijado
  // (overflow: hidden igual se puede scrollear por código y por foco) en vez
  // de la página. Se deshace eso y se mueve la página al punto del pin donde
  // el elemento queda a la vista; en el frame siguiente, cuando el navegador
  // ya terminó su propio scroll de foco.
  const unscroll = () => {
    if (viewport.scrollLeft) viewport.scrollLeft = 0;
  };
  const onFocus = (e) => {
    const item = /** @type {HTMLElement} */ (e.target).closest('[data-pin-track] > *');
    if (!item || maxX === 0) return;
    requestAnimationFrame(() => {
      unscroll();
      const start = item.offsetLeft - track.offsetLeft;
      const x = clamp01((start + item.offsetWidth - viewport.clientWidth) / maxX);
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + x * (section.offsetHeight - window.innerHeight), behavior: 'instant' });
      paint();
    });
  };

  const enable = () => {
    on = true;
    section.setAttribute('data-pinned', '');
    layout();
    paint();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    section.addEventListener('focusin', onFocus);
    viewport.addEventListener('scroll', unscroll, { passive: true });
  };
  const disable = () => {
    on = false;
    section.removeAttribute('data-pinned');
    section.style.height = '';
    section.style.removeProperty('--p');
    track.style.transform = '';
    removeEventListener('scroll', schedule);
    removeEventListener('resize', onResize);
    section.removeEventListener('focusin', onFocus);
    viewport.removeEventListener('scroll', unscroll);
    cancelAnimationFrame(frame);
    frame = 0;
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

/**
 * Avance de scroll como variable CSS `--p` (0 → 1) en cada `[data-progress]`.
 * Es el motor de los efectos que se resuelven en CSS: foto que se expande,
 * columnas con parallax, tipografía variable atada al scroll (ver
 * `recipes/scroll-css.md`). El JS solo mide; el efecto lo dibuja el CSS.
 *
 * Modos (`data-progress="…"`):
 * - `""` / `"exit"`: desde que la sección toca el tope del viewport hasta que
 *   sale por arriba. Para el parallax de un hero.
 * - `"view"`: cruce completo; 0 cuando el borde superior asoma por abajo,
 *   1 cuando el inferior sale por arriba. Para columnas y fotos en el medio.
 * - `"sticky"`: para una sección alta con un hijo `position: sticky`;
 *   0 cuando arranca el pin y 1 cuando termina.
 *
 * Contrato del catálogo:
 * - `destroy()` saca los listeners y el frame pendiente.
 * - Con `prefers-reduced-motion` no escribe `--p`: el CSS define el estado
 *   quieto con `var(--p, 1)` (o el valor que corresponda).
 * - Un solo frame por scroll, sin importar cuántos elementos haya.
 */

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/** @param {HTMLElement} el @param {number} vh */
function progressOf(el, vh) {
  const r = el.getBoundingClientRect();
  switch (el.dataset.progress) {
    case 'view':
      return (vh - r.top) / (vh + r.height);
    case 'sticky':
      return -r.top / Math.max(1, r.height - vh);
    default:
      return -r.top / Math.max(1, r.height);
  }
}

/**
 * @param {ParentNode} [root]
 * @param {{ selector?: string }} [options]
 * @returns {{ refresh(): void, destroy(): void }}
 */
export function createScrollProgress(root = document, { selector = '[data-progress]' } = {}) {
  const noop = { refresh() {}, destroy() {} };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;

  /** @type {HTMLElement[]} */
  let els = Array.from(root.querySelectorAll(selector));
  let frame = 0;

  const measure = () => {
    frame = 0;
    const vh = window.innerHeight;
    for (const el of els) {
      el.style.setProperty('--p', clamp01(progressOf(el, vh)).toFixed(4));
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };

  measure();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });

  return {
    /** Volvé a buscar elementos (contenido montado después de un fetch). */
    refresh() {
      els = Array.from(root.querySelectorAll(selector));
      schedule();
    },
    destroy() {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    },
  };
}

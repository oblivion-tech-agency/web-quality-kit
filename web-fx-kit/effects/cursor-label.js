/**
 * Etiqueta que acompaña al puntero sobre lo que se puede abrir: una foto de
 * flota dice "Ver unidad", un caso dice "Ver caso", un video dice "Play".
 * Se declara con `data-cursor="Ver unidad"` y el módulo crea un solo nodo
 * flotante para toda la página.
 *
 * No esconde el cursor del sistema ni reemplaza el texto del link: es un
 * refuerzo visual, el link sigue diciendo lo suyo para lectores de pantalla.
 *
 * CSS que acompaña (colores desde tokens):
 *
 *   .fx-cursor {
 *     position: fixed; left: 0; top: 0; z-index: 60; pointer-events: none;
 *     padding: 8px 12px; background: var(--color-accent); color: var(--color-on-accent);
 *     opacity: 0; scale: 0.6; transition: opacity 160ms, scale 220ms var(--ease-out-expo);
 *   }
 *   .fx-cursor[data-active] { opacity: 1; scale: 1; }
 *
 * Contrato del catálogo:
 * - Solo con puntero fino (`pointer: fine`); en touch no hace nada.
 * - `destroy()` saca el nodo, los listeners y el frame.
 * - Con `prefers-reduced-motion` la etiqueta sigue al puntero sin inercia.
 */

/**
 * @param {ParentNode & EventTarget} [root]
 * @param {{ attribute?: string, className?: string, offset?: [number, number] }} [options]
 * @returns {{ destroy(): void }}
 */
export function createCursorLabel(root = document, { attribute = 'data-cursor', className = 'fx-cursor', offset = [16, 18] } = {}) {
  if (!window.matchMedia('(pointer: fine)').matches) return { destroy() {} };
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const label = document.createElement('div');
  label.className = className;
  label.setAttribute('aria-hidden', 'true');
  document.body.append(label);

  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  let last = 0;

  const place = () => {
    label.style.transform = `translate3d(${(x + offset[0]).toFixed(1)}px, ${(y + offset[1]).toFixed(1)}px, 0)`;
  };
  const tick = (now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
    last = now;
    const k = 1 - Math.pow(0.0001, dt);
    x += (tx - x) * k;
    y += (ty - y) * k;
    if (Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) [x, y] = [tx, ty];
    place();
    raf = x === tx && y === ty ? 0 : requestAnimationFrame(tick);
  };

  const onMove = (e) => {
    [tx, ty] = [e.clientX, e.clientY];
    const target = /** @type {Element} */ (e.target).closest?.(`[${attribute}]`);
    if (target) {
      const text = target.getAttribute(attribute) ?? '';
      if (label.textContent !== text) label.textContent = text;
      if (!label.hasAttribute('data-active')) {
        // Aparece donde está el puntero, no viajando desde la última posición.
        [x, y] = [tx, ty];
        label.toggleAttribute('data-active', true);
      }
    } else label.removeAttribute('data-active');

    if (!smooth) {
      [x, y] = [tx, ty];
      place();
    } else if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const onLeave = () => label.removeAttribute('data-active');

  root.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  return {
    destroy() {
      root.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      label.remove();
    },
  };
}

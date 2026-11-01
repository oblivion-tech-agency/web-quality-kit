/**
 * cursor-label — etiqueta que acompaña al puntero sobre lo que se abre:
 * `data-fx-cursor="Ver caso"`. Un solo nodo flotante para todo el contenedor.
 * Familia: interacción · Intensidad 2 · 0 deps.
 *
 * No esconde el cursor del sistema ni reemplaza el texto del link: es un
 * refuerzo visual. CSS (colores desde tokens):
 *
 *   .fx-cursor { position: fixed; left: 0; top: 0; z-index: 60; pointer-events: none;
 *     padding: 8px 12px; background: var(--fx-accent); color: var(--fx-on-accent);
 *     opacity: 0; scale: 0.6; transition: opacity 160ms, scale 220ms var(--fx-ease); }
 *   .fx-cursor[data-fx-active] { opacity: 1; scale: 1; }
 *
 * Solo con puntero fino; en touch no hace nada.
 * Reduced motion: la etiqueta sigue al puntero sin inercia (cambia en vivo).
 * destroy(): saca el nodo, los listeners y el frame.
 */

import { createLoop, damp, finePointer, prefersReducedMotion, type FxHandle } from '../../core/index.ts';

export interface CursorLabelOptions {
  attribute?: string;
  className?: string;
  offset?: [number, number];
}

export function createCursorLabel(
  root: HTMLElement,
  { attribute = 'data-fx-cursor', className = 'fx-cursor', offset = [16, 18] }: CursorLabelOptions = {},
): FxHandle {
  if (!finePointer()) return { destroy() {} };

  const label = document.createElement('div');
  label.className = className;
  label.setAttribute('aria-hidden', 'true');
  document.body.append(label);

  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  const place = () => {
    label.style.transform = `translate3d(${(x + offset[0]).toFixed(1)}px, ${(y + offset[1]).toFixed(1)}px, 0)`;
  };
  const loop = createLoop((dt) => {
    x = damp(x, tx, 0.0001, dt);
    y = damp(y, ty, 0.0001, dt);
    if (Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1) [x, y] = [tx, ty];
    place();
    return x !== tx || y !== ty;
  });

  const onMove = (e: PointerEvent) => {
    [tx, ty] = [e.clientX, e.clientY];
    const target = (e.target as Element | null)?.closest?.(`[${attribute}]`);
    if (target) {
      const text = target.getAttribute(attribute) ?? '';
      if (label.textContent !== text) label.textContent = text;
      if (!label.hasAttribute('data-fx-active')) {
        [x, y] = [tx, ty]; // aparece donde está el puntero, no viajando
        label.setAttribute('data-fx-active', '');
      }
    } else label.removeAttribute('data-fx-active');

    if (prefersReducedMotion()) {
      [x, y] = [tx, ty];
      place();
    } else loop.wake();
  };
  const onLeave = () => label.removeAttribute('data-fx-active');

  root.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  return {
    destroy() {
      root.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      loop.stop();
      label.remove();
    },
  };
}

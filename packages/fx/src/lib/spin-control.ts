/**
 * Control de giro para un objeto en 360°: gira solo, se arrastra con el mouse
 * o el dedo, sigue con inercia, retoma el giro solo y responde a las flechas.
 * No dibuja: llama a `onTurn(vuelta)` y el host pinta.
 *
 * Reduced motion: no gira solo ni tiene inercia (en vivo).
 * El elemento es un slider enfocable; ← → giran de a 15°. En touch el arrastre
 * vertical sigue scrolleando (pan-y). Fuera de pantalla no hay rAF.
 */

import { createLoop, onVisibility, preserve, prefersReducedMotion } from '../core/index.ts';

export interface SpinControlOptions {
  el: HTMLElement;
  input?: 'drag' | 'hover';
  auto?: boolean;
  /** Segundos por vuelta en el giro automático. */
  turnSeconds?: number;
  /** Fracción de vuelta inicial. */
  start?: number;
  label?: string;
  onTurn: (turn: number) => void;
}

export interface SpinControl {
  readonly turn: number;
  destroy(): void;
}

export function createSpinControl({
  el,
  input = 'drag',
  auto = true,
  turnSeconds = 14,
  start = 0,
  label = 'Producto en 360°: arrastrá o usá las flechas para girarlo',
  onTurn,
}: SpinControlOptions): SpinControl {
  const autoVel = () => (auto && !prefersReducedMotion() ? 1 / turnSeconds : 0);
  let angle = start;
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let idleUntil = 0;
  let visible = false;
  let deg = -1;

  const turn = () => ((angle % 1) + 1) % 1;
  const emit = () => {
    const t = turn();
    onTurn(t);
    const d = Math.round(t * 360) % 360;
    if (d !== deg) {
      deg = d;
      el.setAttribute('aria-valuenow', String(d));
    }
  };
  const loop = createLoop((dt, now) => {
    if (!dragging) {
      const want = now > idleUntil ? autoVel() : 0;
      vel += (want - vel) * (1 - Math.pow(0.05, dt));
      angle += vel * dt;
    }
    emit();
    return visible && (dragging || Math.abs(vel) > 1e-4 || autoVel() > 0);
  });
  const kick = () => {
    if (visible) loop.wake();
  };

  const perPx = () => 0.5 / Math.max(1, el.clientWidth); // un ancho ≈ media vuelta
  const onDown = (e: PointerEvent) => {
    dragging = true;
    vel = 0;
    lastX = e.clientX;
    lastT = e.timeStamp;
    el.setPointerCapture?.(e.pointerId);
    kick();
  };
  const onMove = (e: PointerEvent) => {
    const hover = input === 'hover' && e.pointerType === 'mouse';
    if (!dragging && !hover) return;
    if (hover && !dragging && !lastT) [lastX, lastT] = [e.clientX, e.timeStamp];
    const dx = e.clientX - lastX;
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    angle -= dx * perPx();
    vel = prefersReducedMotion() ? 0 : vel * 0.6 + ((-dx * perPx()) / dt) * 0.4;
    lastX = e.clientX;
    lastT = e.timeStamp;
    idleUntil = performance.now() + 2500;
    emit();
    kick();
  };
  const onUp = () => {
    dragging = false;
    if (prefersReducedMotion()) vel = 0;
    idleUntil = performance.now() + 2500;
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !dragging) lastT = 0;
  };
  const onKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    angle += dir / 24;
    vel = 0;
    idleUntil = performance.now() + 4000;
    emit();
    kick();
  };

  const restore = preserve(el, {
    attributes: ['tabindex', 'role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    styles: ['touch-action'],
  });
  el.tabIndex = 0;
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', label);
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '359');
  el.style.touchAction = 'pan-y';

  emit();
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('keydown', onKey);
  const offVisible = onVisibility(el, (v) => {
    visible = v;
    if (v) kick();
  });

  return {
    get turn() {
      return turn();
    },
    destroy() {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('keydown', onKey);
      offVisible();
      loop.stop();
      visible = false;
      restore();
    },
  };
}

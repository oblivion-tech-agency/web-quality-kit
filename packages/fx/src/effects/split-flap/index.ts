/**
 * split-flap — texto que cambia como un cartel de aeropuerto: cada carácter
 * pasa por letras intermedias hasta caer en el destino, en cascada.
 * Familia: texto · Intensidad 2 · 0 deps.
 *
 *   <span data-fx-flap>USHUAIA</span>
 *
 * Accesible: el valor real vive en un span visualmente oculto; lo que gira va
 * con `aria-hidden`. Dale al host cifras tabulares y `min-width` en `ch`.
 *
 * Reduced motion: `set()` es instantáneo y el ciclo automático no corre.
 * El ciclo se pausa fuera de pantalla y con la pestaña oculta.
 * destroy(): corta todo y devuelve el contenido original (sin duplicar texto
 * en un remount de StrictMode).
 */

import { onVisibility, preserve, prefersReducedMotion, type FxHandle } from '../../core/index.ts';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const HIDDEN = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';

export interface SplitFlapOptions {
  /** Con dos o más, rota entre ellos cada `interval` ms. */
  values?: string[];
  interval?: number;
  /** Letras intermedias por carácter. */
  flips?: number;
  /** ms por letra. */
  step?: number;
  /** ms de cascada entre caracteres. */
  stagger?: number;
  alphabet?: string;
}

export interface SplitFlapHandle extends FxHandle {
  set(value: string): void;
}

export function createSplitFlap(
  el: HTMLElement,
  { values = [], interval = 3600, flips = 6, step = 45, stagger = 28, alphabet = ALPHABET }: SplitFlapOptions = {},
): SplitFlapHandle {
  const restore = preserve(el, { children: true });
  let current = (el.textContent ?? '').trim();

  const real = document.createElement('span');
  real.style.cssText = HIDDEN;
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  el.replaceChildren(real, shown);
  real.textContent = shown.textContent = current;

  let raf = 0;
  const set = (next: string) => {
    cancelAnimationFrame(raf);
    raf = 0;
    real.textContent = next;
    if (prefersReducedMotion()) {
      shown.textContent = current = next;
      return;
    }
    const from = current.padEnd(next.length);
    const to = next.padEnd(from.length);
    const start = performance.now();
    const frame = (now: number) => {
      const t = now - start;
      let out = '';
      let done = true;
      for (let i = 0; i < to.length; i++) {
        const target = to[i] ?? ' ';
        const source = from[i] ?? ' ';
        const n = Math.floor((t - i * stagger) / step);
        if (n >= flips || target === ' ' || source === target) {
          out += target;
          continue;
        }
        done = false;
        const base = alphabet.indexOf(source.toUpperCase());
        out += n < 0 ? source : alphabet[(base + n + 1 + alphabet.length) % alphabet.length];
      }
      shown.textContent = out;
      if (done) {
        shown.textContent = current = next;
        raf = 0;
      } else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };

  let timer = 0;
  let visible = false;
  let index = Math.max(0, values.indexOf(current));
  const cycle = () => {
    clearInterval(timer);
    timer = 0;
    if (prefersReducedMotion() || values.length < 2 || !visible || document.hidden) return;
    timer = window.setInterval(() => {
      index = (index + 1) % values.length;
      set(values[index] ?? '');
    }, interval);
  };
  const offVisible = onVisibility(el, (v) => {
    visible = v;
    cycle();
  });
  document.addEventListener('visibilitychange', cycle);

  return {
    set,
    destroy() {
      offVisible();
      document.removeEventListener('visibilitychange', cycle);
      clearInterval(timer);
      cancelAnimationFrame(raf);
      restore();
    },
  };
}

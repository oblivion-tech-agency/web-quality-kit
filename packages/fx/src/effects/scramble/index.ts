/**
 * scramble — un texto corto se "decodifica": pasa por caracteres al azar y se
 * asienta letra por letra de izquierda a derecha al entrar en vista. Para
 * etiquetas técnicas, números de versión, nombres de servicios, cifras: texto
 * corto de un sujeto con algo de máquina. Nunca en párrafos.
 * Familia: texto · Intensidad 2 · 0 deps.
 *
 *   <span data-fx-scramble>Agentes de IA</span>
 *
 * Accesible: el valor real vive en un span oculto visualmente; lo que se mezcla
 * va con `aria-hidden`. Usá una fuente con cifras tabulares si hay números.
 *
 * Reduced motion: no anima (en vivo). Se reproduce una vez, al entrar en vista;
 * `play()` lo repite (por ejemplo en hover).
 * destroy(): corta el frame y devuelve el contenido original.
 */

import { motionSwitch, onVisibility, preserve, prefersReducedMotion, type FxHandle } from '../../core/index.ts';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
const HIDDEN = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';

export interface ScrambleOptions {
  /** Duración total en ms. */
  duration?: number;
  glyphs?: string;
}

export interface ScrambleHandle extends FxHandle {
  play(): void;
}

export function createScramble(el: HTMLElement, { duration = 900, glyphs = GLYPHS }: ScrambleOptions = {}): ScrambleHandle {
  const restore = preserve(el, { children: true });
  const text = el.textContent ?? '';
  const real = document.createElement('span');
  real.style.cssText = HIDDEN;
  real.textContent = text;
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  shown.textContent = text;
  el.replaceChildren(real, shown);

  let raf = 0;
  const play = () => {
    cancelAnimationFrame(raf);
    if (prefersReducedMotion()) {
      shown.textContent = text;
      return;
    }
    const start = performance.now();
    const frame = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const settled = Math.floor(k * text.length);
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        const c = text[i] ?? '';
        out += c === ' ' ? ' ' : (glyphs[Math.floor(Math.random() * glyphs.length)] ?? c);
      }
      shown.textContent = out;
      raf = k < 1 ? requestAnimationFrame(frame) : 0;
    };
    raf = requestAnimationFrame(frame);
  };

  const off = motionSwitch({
    full: () => {
      let done = false;
      const offVisible = onVisibility(el, (visible) => {
        if (visible && !done) {
          done = true;
          play();
        }
      });
      return () => {
        offVisible();
        cancelAnimationFrame(raf);
        shown.textContent = text;
      };
    },
  });

  return {
    play,
    destroy() {
      off();
      cancelAnimationFrame(raf);
      restore();
    },
  };
}

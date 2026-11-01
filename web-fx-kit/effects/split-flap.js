/**
 * Texto que cambia como un cartel de aeropuerto o de estación: cada carácter
 * pasa por unas letras intermedias hasta caer en el destino, en cascada de
 * izquierda a derecha. Para destinos, estados, horarios: valores cortos que
 * cambian y que en el mundo real ya se muestran así.
 *
 * Accesible: el valor real vive en un span visualmente oculto; lo que gira
 * está en un span con `aria-hidden`. El ancho no salta si el CSS del host le
 * da una fuente con cifras tabulares o mono (acá sí es un fragmento de
 * interfaz) y `min-width` en `ch`.
 *
 * Contrato del catálogo:
 * - `destroy()` corta el ciclo, los frames y el observer.
 * - Sin JS se ve el texto original. Con `prefers-reduced-motion` los cambios
 *   llamados con `set()` son instantáneos y el ciclo automático no corre.
 * - El ciclo automático se pausa fuera de pantalla y con la pestaña oculta.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const HIDDEN =
  'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';

/**
 * @param {HTMLElement} el
 * @param {{ values?: string[], interval?: number, flips?: number, step?: number, stagger?: number, alphabet?: string }} [options]
 *   `values`: si hay dos o más, rota entre ellos cada `interval` ms.
 *   `flips`: letras intermedias por carácter. `step`: ms por letra.
 * @returns {{ set(value: string): void, destroy(): void }}
 */
export function createSplitFlap(
  el,
  { values = [], interval = 3600, flips = 6, step = 45, stagger = 28, alphabet = ALPHABET } = {},
) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = (el.textContent ?? '').trim();

  const real = document.createElement('span');
  real.style.cssText = HIDDEN;
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  el.replaceChildren(real, shown);
  real.textContent = shown.textContent = current;

  let raf = 0;
  const set = (next) => {
    cancelAnimationFrame(raf);
    real.textContent = next;
    if (reduce) {
      shown.textContent = current = next;
      return;
    }
    const from = current.padEnd(next.length);
    const to = next.padEnd(from.length);
    const start = performance.now();
    const frame = (now) => {
      const t = now - start;
      let out = '';
      let done = true;
      for (let i = 0; i < to.length; i++) {
        const n = Math.floor((t - i * stagger) / step);
        if (n >= flips || to[i] === ' ' || from[i] === to[i]) {
          out += to[i];
          continue;
        }
        done = false;
        // Antes de su turno queda el carácter viejo; después, letras siguientes del alfabeto.
        const base = alphabet.indexOf(from[i].toUpperCase());
        out += n < 0 ? from[i] : alphabet[(base + n + 1 + alphabet.length) % alphabet.length];
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
    if (reduce || values.length < 2 || !visible || document.hidden) return;
    timer = window.setInterval(() => set(values[(index = (index + 1) % values.length)]), interval);
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cycle();
  });
  io.observe(el);
  document.addEventListener('visibilitychange', cycle);

  return {
    set,
    destroy() {
      io.disconnect();
      document.removeEventListener('visibilitychange', cycle);
      clearInterval(timer);
      cancelAnimationFrame(raf);
    },
  };
}

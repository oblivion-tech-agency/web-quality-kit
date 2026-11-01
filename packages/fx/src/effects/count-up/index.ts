/**
 * count-up — cifras reales que suben hasta su valor al entrar en vista.
 * Familia: texto · Intensidad 1 · 0 deps.
 *
 *   <span data-fx-count="3150">3.150</span> km
 *
 * El HTML trae el número final (SEO y sin JS). Prefijo y sufijo van fuera del
 * span para que el ancho no salte; usá `font-variant-numeric: tabular-nums`.
 * Si el número ya está en pantalla al montar, no se toca: bajarlo a 0 sería
 * un parpadeo.
 *
 * Reduced motion: no anima; los números quedan en su valor final.
 * destroy(): corta observers y frames y devuelve a cada número su texto original.
 */

import { motionSwitch, preserve, type FxHandle, type Restore } from '../../core/index.ts';

export interface CountUpOptions {
  /** Atributo que trae el valor final. */
  attribute?: string;
  /** ms de la cuenta. */
  duration?: number;
  /** Locale para el separador de miles; por defecto el `lang` del documento. */
  locale?: string;
}

const easeOutExpo = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));

export function createCountUp(
  root: HTMLElement,
  { attribute = 'data-fx-count', duration = 1400, locale }: CountUpOptions = {},
): FxHandle {
  const els = Array.from(root.querySelectorAll<HTMLElement>(`[${attribute}]`));
  const restores: Restore[] = els.map((el) => preserve(el, { children: true }));
  const fmt = new Intl.NumberFormat(locale || document.documentElement.lang || undefined);
  const valueOf = (el: HTMLElement) => Number(el.getAttribute(attribute));

  const off = motionSwitch({
    full: () => {
      const frames = new Set<number>();
      const run = (el: HTMLElement) => {
        const target = valueOf(el);
        const start = performance.now();
        const tick = (now: number) => {
          frames.delete(id);
          const k = Math.min(1, (now - start) / duration);
          el.textContent = fmt.format(Math.round(target * easeOutExpo(k)));
          if (k < 1) frames.add((id = requestAnimationFrame(tick)));
        };
        let id = requestAnimationFrame(tick);
        frames.add(id);
      };
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            io.unobserve(entry.target);
            run(entry.target as HTMLElement);
          }
        },
        { threshold: 0.6 },
      );
      const vh = window.innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) continue; // ya visible: no parpadear
        el.textContent = fmt.format(0);
        io.observe(el);
      }
      return () => {
        io.disconnect();
        frames.forEach(cancelAnimationFrame);
        restores.forEach((r) => r()); // si se corta a mitad, vuelve el valor real
      };
    },
    reduced: () => restores.forEach((r) => r()),
  });

  return {
    destroy() {
      off();
      restores.forEach((r) => r());
    },
  };
}

/**
 * Contadores que suben hasta su valor al entrar en vista: `<span data-count="15">15</span>`.
 * El HTML ya trae el número final (SEO y sin JS); el prefijo y el sufijo
 * ("+", " años") van fuera del span, así el ancho no salta.
 *
 * La primera pintura tiene que ser legible: si el número ya está en pantalla
 * al montar, no se toca (bajarlo a 0 ahora sería un parpadeo).
 *
 * Contrato del catálogo: `destroy()` corta observers y frames; con
 * `prefers-reduced-motion` no hace nada. Usá `tabular-nums` en el CSS.
 */

const easeOutExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));

/**
 * @param {ParentNode} [root]
 * @param {{ selector?: string, duration?: number, locale?: string }} [options]
 * @returns {{ destroy(): void }}
 */
export function createCountUp(root = document, { selector = '[data-count]', duration = 1400, locale } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { destroy() {} };

  const fmt = new Intl.NumberFormat(locale || document.documentElement.lang || undefined);
  const frames = new Set();
  const vh = window.innerHeight;

  /** @param {HTMLElement} el */
  const run = (el) => {
    const target = Number(el.dataset.count);
    const start = performance.now();
    const tick = (now) => {
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
        run(/** @type {HTMLElement} */ (entry.target));
      }
    },
    { threshold: 0.6 },
  );

  root.querySelectorAll(selector).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) return;
    el.textContent = fmt.format(0);
    io.observe(el);
  });

  return {
    destroy() {
      io.disconnect();
      frames.forEach(cancelAnimationFrame);
    },
  };
}

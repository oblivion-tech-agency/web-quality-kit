/**
 * Revelado con máscara: la foto (o cualquier hijo) sube desde abajo con
 * `clip-path` mientras la imagen se asienta de un zoom leve. Reemplaza al
 * fade genérico en fotos y bloques de media.
 *
 * El clip va en los HIJOS de `[data-clip]`, nunca en el elemento observado:
 * un `IntersectionObserver` no dispara sobre un target recortado al 100%,
 * así que si se recorta el propio contenedor, nunca se revela.
 *
 * CSS que acompaña (el `.js` lo pone un script inline en <head>, así sin JS
 * el contenido se ve):
 *
 *   .js [data-clip] > * {
 *     clip-path: inset(100% 0 0 0);
 *     transition: clip-path 1100ms var(--ease-out-expo);
 *   }
 *   .js [data-clip] img {
 *     scale: 1.18;
 *     transition: clip-path 1100ms var(--ease-out-expo), scale 1600ms var(--ease-out-expo);
 *   }
 *   .js [data-clip].revealed > * { clip-path: inset(0 0 0 0); }
 *   .js [data-clip].revealed img { scale: 1; }
 *   @media (prefers-reduced-motion: reduce) {
 *     .js [data-clip] > *, .js [data-clip] img { clip-path: none; scale: 1; }
 *   }
 *
 * Si además hay un hover con zoom sobre la foto, ese selector tiene que ganarle
 * en especificidad a `.js [data-clip].revealed img`, o el hover no hace nada.
 *
 * Contrato del catálogo: `destroy()` desconecta el observer; con
 * `prefers-reduced-motion` todo queda revelado al instante.
 */

/**
 * @param {ParentNode} [root]
 * @param {{ selector?: string, className?: string, rootMargin?: string, threshold?: number }} [options]
 * @returns {{ observe(el: Element): void, destroy(): void }}
 */
export function createClipReveal(
  root = document,
  { selector = '[data-clip]', className = 'revealed', rootMargin = '0px 0px -10% 0px', threshold = 0.12 } = {},
) {
  const els = Array.from(root.querySelectorAll(selector));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add(className));
    return { observe: (el) => el.classList.add(className), destroy() {} };
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(className);
        io.unobserve(entry.target);
      }
    },
    { rootMargin, threshold },
  );
  els.forEach((el) => io.observe(el));

  return {
    /** Para nodos que llegan después del mount (fetch client-side). */
    observe: (el) => io.observe(el),
    destroy: () => io.disconnect(),
  };
}

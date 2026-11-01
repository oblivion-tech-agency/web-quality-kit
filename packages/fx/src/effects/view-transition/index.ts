/**
 * view-transition — cambios de estado que se animan solos con la View
 * Transitions API del navegador (Baseline desde octubre de 2025): filtrar,
 * abrir un caso, cambiar de pestaña. Los elementos con el mismo
 * `data-fx-vt="nombre"` antes y después viajan de un lugar al otro.
 * Familia: transiciones · Intensidad 2 · 0 deps.
 *
 *   <img data-fx-vt="caso-12" …>       ← en la grilla
 *   <img data-fx-vt="caso-12" …>       ← en el detalle (después del cambio)
 *
 *   const vt = createViewTransition(document.body);
 *   vt.swap(() => setOpen(12));   // en React, envolvé el setState con flushSync
 *
 * Entre páginas de Next.js usá el soporte de React/Next para View Transitions
 * (`<ViewTransition>` con `experimental.viewTransition` en next.config); entre
 * páginas de un sitio multipágina sin framework: `@view-transition { navigation: auto; }`.
 *
 * Curva y duración desde los tokens:
 *   ::view-transition-group(*) { animation-duration: var(--fx-duration); animation-timing-function: var(--fx-ease); }
 *
 * Reduced motion: el cambio se aplica al instante. Sin soporte: también.
 * destroy(): saca los `view-transition-name` que puso.
 */

import { prefersReducedMotion, preserve, bundle, type FxHandle, type Restore } from '../../core/index.ts';

export interface ViewTransitionHandle extends FxHandle {
  /** Aplica `update` dentro de una transición (o al instante si no corresponde). */
  swap(update: () => void | Promise<void>): Promise<void>;
  /** Vuelve a leer los `data-fx-vt` (después de montar contenido nuevo). */
  refresh(): void;
}

type DocWithVT = Document & { startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> } };

export function createViewTransition(root: HTMLElement): ViewTransitionHandle {
  let restores: Restore[] = [];
  const name = () => {
    bundle(...restores)();
    restores = [];
    root.querySelectorAll<HTMLElement>('[data-fx-vt]').forEach((el) => {
      restores.push(preserve(el, { styles: ['view-transition-name'] }));
      el.style.setProperty('view-transition-name', el.getAttribute('data-fx-vt') ?? 'none');
    });
  };
  name();

  return {
    async swap(update) {
      const doc = document as DocWithVT;
      if (!doc.startViewTransition || prefersReducedMotion()) {
        await update();
        name();
        return;
      }
      const t = doc.startViewTransition(async () => {
        await update();
        name();
      });
      await t.finished.catch(() => {});
    },
    refresh: name,
    destroy() {
      bundle(...restores)();
      restores = [];
    },
  };
}

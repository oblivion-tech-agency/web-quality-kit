/**
 * GSAP para los efectos del kit. Cada efecto registra solo los plugins que usa
 * (`fxGsap(SplitText)`), así un sitio que usa stacked-cards no carga SplitText
 * ni Flip. Todo lo que crea un efecto va en un `gsap.context()`, y `revert()`
 * deja el DOM como estaba (contrato §2).
 *
 * GSAP es 100% gratis (incluidos SplitText, ScrollTrigger y Flip) desde 2025.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const registered = new Set<unknown>();

/** Registra ScrollTrigger y los plugins pedidos (una sola vez cada uno). */
export function fxGsap(...plugins: object[]) {
  if (typeof window !== 'undefined') {
    for (const plugin of [ScrollTrigger, ...plugins]) {
      if (registered.has(plugin)) continue;
      gsap.registerPlugin(plugin);
      registered.add(plugin);
    }
  }
  return { gsap, ScrollTrigger };
}

/** Curva de la casa como ease de GSAP (equivale a cubic-bezier(0.16, 1, 0.3, 1)). */
export const HOUSE_EASE = 'expo.out';

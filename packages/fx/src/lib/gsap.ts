/**
 * GSAP para los efectos del kit: registra los plugins una sola vez y envuelve
 * todo lo que crea un efecto en un `gsap.context()`, así `revert()` deshace
 * tweens, ScrollTriggers y SplitText y deja el DOM como estaba (contrato §2).
 *
 * GSAP es 100% gratis (incluidos SplitText, ScrollTrigger y Flip) desde 2025.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';

let registered = false;

export function fxGsap() {
  if (!registered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
    registered = true;
  }
  return { gsap, ScrollTrigger, SplitText, Flip };
}

/** Curva de la casa como ease de GSAP (equivale a cubic-bezier(0.16, 1, 0.3, 1)). */
export const HOUSE_EASE = 'expo.out';

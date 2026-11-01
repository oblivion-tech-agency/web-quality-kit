/**
 * smooth-scroll — scroll suave con Lenis, sincronizado con GSAP ScrollTrigger.
 * Conserva el scroll nativo (no es scroll-jacking): solo suaviza la rueda.
 * Familia: scroll · Intensidad 2 (base de ●●● y ●●●●) · deps: lenis, gsap.
 *
 * Se monta una vez, sobre `document.documentElement`. Lenis agrega las clases
 * `lenis` y `lenis-smooth` al <html>; el CSS que recomienda Lenis:
 *
 *   html.lenis, html.lenis body { height: auto; }
 *   .lenis.lenis-smooth { scroll-behavior: auto !important; }
 *   .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
 *
 * Según la huella Oblivion va solo en intensidad ●●● o más.
 * Reduced motion: no monta (scroll nativo); cambia en vivo.
 * destroy(): Lenis se destruye (saca sus clases) y GSAP vuelve a su ticker normal.
 */

import Lenis from 'lenis';
import { motionSwitch, type FxHandle } from '../../core/index.ts';
import { fxGsap } from '../../lib/gsap.ts';

export interface SmoothScrollOptions {
  /** Suavizado por frame (0–1). 0.1 es el punto de la casa. */
  lerp?: number;
  wheelMultiplier?: number;
  /** Los links #ancla scrollean con Lenis. */
  anchors?: boolean;
}

export interface SmoothScrollHandle extends FxHandle {
  /** La instancia de Lenis activa (null con reduced motion). */
  readonly lenis: Lenis | null;
  scrollTo(target: string | number | HTMLElement): void;
}

export function createSmoothScroll(_root: HTMLElement = document.documentElement, { lerp = 0.1, wheelMultiplier = 1, anchors = true }: SmoothScrollOptions = {}): SmoothScrollHandle {
  const { gsap, ScrollTrigger } = fxGsap();
  let lenis: Lenis | null = null;

  const off = motionSwitch({
    full: () => {
      const instance = new Lenis({ lerp, wheelMultiplier, anchors, autoRaf: false });
      lenis = instance;
      const onScroll = () => ScrollTrigger.update();
      instance.on('scroll', onScroll);
      const tick = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        instance.destroy();
        lenis = null;
      };
    },
  });

  return {
    get lenis() {
      return lenis;
    },
    scrollTo(target) {
      if (lenis) lenis.scrollTo(target as never);
      else if (typeof target === 'number') window.scrollTo({ top: target });
      else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView();
    },
    destroy: off,
  };
}

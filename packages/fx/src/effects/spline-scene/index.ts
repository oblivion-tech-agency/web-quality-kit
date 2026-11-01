/**
 * spline-scene — una escena de Spline (hecha a mano o con el MCP de Spline)
 * montada con carga diferida: el runtime y la escena se descargan recién cuando
 * la sección está a una pantalla, la foto de respaldo se ve hasta el primer
 * cuadro, y la escena se pausa fuera de pantalla.
 * Familia: 3D · Intensidad 4 · deps: @splinetool/runtime · Firma posible.
 *
 *   <figure data-fx-spline data-fx-scene="https://prod.spline.design/…/scene.splinecode">
 *     <canvas data-fx-canvas style="width: 100%; height: 100%"></canvas>
 *     <img data-fx-fallback src="escena.webp" alt="…">
 *
 * El runtime de Spline pesa: autohospedá el `.splinecode` exportado y medí el
 * LCP con y sin la escena. Si la escena es un producto que solo gira, conviene
 * `model-turntable` con el `.glb` (más liviano).
 * Reduced motion: no carga la escena; queda la foto.
 * destroy(): libera la aplicación de Spline y devuelve canvas y fallback.
 */

import { bundle, onVisibility, part, preserve, prefersReducedMotion, whenNear, type FxHandle } from '../../core/index.ts';

export interface SplineSceneOptions {
  /** URL del `.splinecode` (si no, `data-fx-scene` del raíz). */
  scene?: string;
  onReady?: (app: unknown) => void;
  onError?: (error: unknown) => void;
}

interface SplineApp {
  load(url: string): Promise<void>;
  play?(): void;
  stop?(): void;
  dispose?(): void;
}

export function createSplineScene(root: HTMLElement, options: SplineSceneOptions = {}): FxHandle {
  const canvas = part<HTMLCanvasElement>(root, 'canvas');
  const fallback = part(root, 'fallback');
  const url = options.scene ?? root.getAttribute('data-fx-scene');
  if (!canvas || !url || prefersReducedMotion()) return { destroy() {} };
  const restore = bundle(fallback && preserve(fallback, { attributes: ['hidden'] }), preserve(canvas, { attributes: ['width', 'height', 'style'] }));
  let app: SplineApp | null = null;
  let dead = false;
  let offVisible: (() => void) | null = null;

  const offNear = whenNear(root, async () => {
    try {
      const { Application } = (await import('@splinetool/runtime')) as unknown as { Application: new (c: HTMLCanvasElement) => SplineApp };
      if (dead) return;
      app = new Application(canvas);
      await app.load(url);
      if (dead) return;
      fallback?.setAttribute('hidden', '');
      offVisible = onVisibility(root, (v) => (v ? app?.play?.() : app?.stop?.()));
      options.onReady?.(app);
    } catch (error) {
      if (!dead) options.onError?.(error); // queda la foto
    }
  });

  return {
    destroy() {
      dead = true;
      offNear();
      offVisible?.();
      app?.dispose?.();
      app = null;
      restore();
    },
  };
}

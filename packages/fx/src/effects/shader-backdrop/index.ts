/**
 * shader-backdrop — un fondo vivo hecho con un shader, sin Three.js (WebGL2,
 * ~3 KB). Tres variantes, con los colores de los tokens:
 * - `mesh`: un gradiente de ruido que fluye lento entre `--fx-ground` y
 *   `--fx-accent`, con grano; reacciona leve al puntero.
 * - `grain`: el ground con grano de película y viñeta. Textura, no decoración.
 * - `dither`: un campo de ruido tramado con matriz Bayer en dos tintas
 *   (`--fx-ground` y `--fx-accent`), pixelado. Gráfico, técnico.
 * Familia: fondo · Intensidad 2 (grain 1) · 0 deps.
 *
 *   <section data-fx-backdrop style="position: relative">
 *     <canvas data-fx-canvas style="position: absolute; inset: 0; width: 100%; height: 100%"></canvas>
 *     …contenido encima…
 *
 * Un fondo sin idea detrás es decoración: usalo cuando el sujeto lo pida (la
 * niebla de un lugar, la trama de un material, la señal de una máquina).
 * Se pausa fuera de pantalla. Sin WebGL2 queda el color del CSS.
 * Reduced motion: un cuadro quieto (en vivo).
 * destroy(): libera el programa y devuelve el canvas como estaba.
 */

import { createLoop, finePointer, motionSwitch, onVisibility, part, preserve, token, damp, type FxHandle } from '../../core/index.ts';
import { createGlQuad, cssColor } from '../../lib/gl.ts';

export type BackdropVariant = 'mesh' | 'grain' | 'dither';

export interface ShaderBackdropOptions {
  variant?: BackdropVariant;
  /** Multiplica la velocidad del movimiento. */
  speed?: number;
  /** 0–1: cuánto acento entra en el ground. */
  intensity?: number;
  /** Tamaño del pixel del tramado (`dither`), en px de CSS. */
  pixel?: number;
  canvas?: HTMLCanvasElement | null;
}

const COMMON = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uIntensity; uniform float uPixel;
uniform vec3 uGround; uniform vec3 uAccent; uniform vec3 uInk;
out vec4 outColor;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }
`;

const FRAG: Record<BackdropVariant, string> = {
  mesh: `${COMMON}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.05;
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.1));
  float n = fbm(p * 1.2 + q * 1.6 + (uMouse - 0.5) * 0.25);
  float m = smoothstep(0.38, 0.9, n) * uIntensity;
  vec3 col = mix(uGround, uAccent, m * 0.6);
  col = mix(col, uInk, smoothstep(0.86, 1.0, n) * 0.06 * uIntensity);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.03;
  outColor = vec4(col, 1.0);
}`,
  grain: `${COMMON}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float g = hash(gl_FragCoord.xy + floor(uTime * 24.0) * 17.0) - 0.5;
  float v = smoothstep(1.2, 0.2, length(uv - 0.5));
  vec3 col = uGround * mix(0.82, 1.0, v) + g * 0.05 * uIntensity;
  outColor = vec4(col, 1.0);
}`,
  dither: `${COMMON}
float bayer4(vec2 c) {
  int x = int(mod(c.x, 4.0)), y = int(mod(c.y, 4.0));
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[y * 4 + x]) + 0.5) / 16.0;
}
void main() {
  vec2 cell = floor(gl_FragCoord.xy / uPixel);
  vec2 p = cell * uPixel / uRes.y;
  float t = uTime * 0.06;
  float n = fbm(p * 2.2 + vec2(t, -t * 0.7) + (uMouse - 0.5) * 0.4);
  float level = smoothstep(0.3, 0.8, n) * uIntensity;
  float on = step(bayer4(cell), level);
  outColor = vec4(mix(uGround, uAccent, on), 1.0);
}`,
};

export function createShaderBackdrop(root: HTMLElement, options: ShaderBackdropOptions = {}): FxHandle {
  const { variant = 'mesh', speed = 1, intensity = 1, pixel = 3 } = options;
  const canvas = options.canvas ?? part<HTMLCanvasElement>(root, 'canvas');
  if (!canvas) return { destroy() {} };
  const restore = preserve(canvas, { attributes: ['width', 'height', 'aria-hidden'] });
  const quad = createGlQuad(canvas, FRAG[variant]);
  if (!quad) {
    restore();
    return { destroy() {} };
  }
  canvas.setAttribute('aria-hidden', 'true');
  const { gl } = quad;
  const color = (name: '--fx-ground' | '--fx-accent' | '--fx-ink', fallback: string) => cssColor(root, token(root, name, fallback));
  const setColors = () => {
    gl.uniform3fv(quad.uniform('uGround'), color('--fx-ground', 'black'));
    gl.uniform3fv(quad.uniform('uAccent'), color('--fx-accent', 'white'));
    gl.uniform3fv(quad.uniform('uInk'), color('--fx-ink', 'white'));
  };
  setColors();
  gl.uniform1f(quad.uniform('uIntensity'), intensity);

  let mouse = [0.5, 0.5];
  let target = [0.5, 0.5];
  let time = Math.random() * 100;
  const render = () => {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    if (quad.resize()) gl.uniform2f(quad.uniform('uRes'), canvas.width, canvas.height);
    gl.uniform1f(quad.uniform('uPixel'), pixel * dpr);
    gl.uniform1f(quad.uniform('uTime'), time);
    gl.uniform2f(quad.uniform('uMouse'), mouse[0] ?? 0.5, mouse[1] ?? 0.5);
    quad.draw();
  };
  gl.uniform2f(quad.uniform('uRes'), 1, 1);

  const off = motionSwitch({
    full: () => {
      const loop = createLoop((dt) => {
        time += dt * speed;
        mouse = [damp(mouse[0] ?? 0.5, target[0] ?? 0.5, 0.05, dt), damp(mouse[1] ?? 0.5, target[1] ?? 0.5, 0.05, dt)];
        render();
      });
      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        target = [(e.clientX - r.left) / Math.max(1, r.width), 1 - (e.clientY - r.top) / Math.max(1, r.height)];
      };
      if (finePointer() && variant !== 'grain') window.addEventListener('pointermove', onMove, { passive: true });
      const offVisible = onVisibility(root, (visible) => (visible ? loop.wake() : loop.stop()));
      return () => {
        offVisible();
        loop.stop();
        window.removeEventListener('pointermove', onMove);
      };
    },
    reduced: () => {
      render();
      const onResize = () => render();
      addEventListener('resize', onResize, { passive: true });
      return () => removeEventListener('resize', onResize);
    },
  });

  return {
    destroy() {
      off();
      quad.destroy();
      restore();
    },
  };
}

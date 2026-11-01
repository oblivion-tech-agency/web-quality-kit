/**
 * cursor-lens — una lente que sigue al cursor sobre una imagen: amplía lo que
 * tiene debajo, con el borde refractado y un leve corrimiento de color. Para
 * mirar de cerca: un producto, una pieza, una lámina, un plano.
 * WebGL2 sobre un canvas encima de la imagen (la imagen sigue siendo el LCP).
 * Familia: imagen · Intensidad 3 · 0 deps.
 *
 *   <figure data-fx-lens style="position: relative">
 *     <img src="pieza.webp" alt="…">
 *     <canvas data-fx-canvas style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0"></canvas>
 *
 *   [data-fx-lens][data-fx-active] canvas { opacity: 1; }
 *
 * La imagen tiene que ser del mismo origen (o con CORS).
 * Solo con puntero fino. Reduced motion: la lente aparece y sigue sin inercia.
 * destroy(): libera textura y programa y devuelve figura y canvas.
 */

import { bundle, createLoop, damp, finePointer, part, preserve, prefersReducedMotion, type FxHandle } from '../../core/index.ts';
import { createGlQuad } from '../../lib/gl.ts';

export interface CursorLensOptions {
  /** Aumento dentro de la lente. */
  zoom?: number;
  /** Radio en fracción del lado menor. */
  radius?: number;
  /** 'circle' o 'square' (la versión cuadrada de Codrops). */
  shape?: 'circle' | 'square';
}

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImage; uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uMouse;
uniform float uOpen; uniform float uZoom; uniform float uRadius; uniform float uSquare;
out vec4 outColor;
vec2 cover(vec2 uv) {
  float r = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 s = r > ri ? vec2(1.0, ri / r) : vec2(r / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes; uv.y = 1.0 - uv.y;
  vec2 d = uv - uMouse; vec2 a = vec2(uRes.x / min(uRes.x, uRes.y), uRes.y / min(uRes.x, uRes.y));
  vec2 da = d * a;
  float dist = mix(length(da), max(abs(da.x), abs(da.y)), uSquare);
  float R = uRadius * uOpen;
  float inside = 1.0 - smoothstep(R - 0.004, R, dist);
  float edge = smoothstep(R * 0.7, R, dist) * inside;
  vec2 zuv = uMouse + d / uZoom * (1.0 - edge * 0.35);
  float shift = edge * 0.006;
  vec3 lens = vec3(texture(uImage, cover(zuv + vec2(shift, 0))).r, texture(uImage, cover(zuv)).g, texture(uImage, cover(zuv - vec2(shift, 0))).b);
  vec3 base = texture(uImage, cover(uv)).rgb;
  outColor = vec4(mix(base, lens, inside), 1.0);
}`;

export function createCursorLens(root: HTMLElement, { zoom = 1.8, radius = 0.16, shape = 'circle' }: CursorLensOptions = {}): FxHandle {
  const canvas = part<HTMLCanvasElement>(root, 'canvas');
  const img = root.querySelector('img');
  if (!canvas || !img || !finePointer()) return { destroy() {} };
  const restore = bundle(preserve(root, { attributes: ['data-fx-active'] }), preserve(canvas, { attributes: ['width', 'height', 'aria-hidden'] }));
  const quad = createGlQuad(canvas, FRAG);
  if (!quad) {
    restore();
    return { destroy() {} };
  }
  canvas.setAttribute('aria-hidden', 'true');
  const { gl } = quad;
  const tex = gl.createTexture();
  let ready = false;
  const upload = () => {
    if (!img.naturalWidth) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch {
      return;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(quad.uniform('uImg'), img.naturalWidth, img.naturalHeight);
    ready = true;
  };
  if (img.complete) upload();
  else img.addEventListener('load', upload, { once: true });
  gl.uniform1f(quad.uniform('uZoom'), zoom);
  gl.uniform1f(quad.uniform('uRadius'), radius);
  gl.uniform1f(quad.uniform('uSquare'), shape === 'square' ? 1 : 0);

  let open = 0;
  let openTarget = 0;
  let [mx, my, tx, ty] = [0.5, 0.5, 0.5, 0.5];
  const loop = createLoop((dt) => {
    if (!ready) return false;
    const snap = prefersReducedMotion();
    open = snap ? openTarget : damp(open, openTarget, 0.0005, dt);
    mx = snap ? tx : damp(mx, tx, 0.00002, dt);
    my = snap ? ty : damp(my, ty, 0.00002, dt);
    if (quad.resize(2)) gl.uniform2f(quad.uniform('uRes'), canvas.width, canvas.height);
    gl.uniform2f(quad.uniform('uMouse'), mx, my);
    gl.uniform1f(quad.uniform('uOpen'), open);
    quad.draw();
    if (openTarget === 0 && open < 0.01) {
      root.removeAttribute('data-fx-active');
      return false;
    }
  });
  const pos = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    tx = (e.clientX - r.left) / Math.max(1, r.width);
    ty = (e.clientY - r.top) / Math.max(1, r.height);
  };
  const onEnter = (e: PointerEvent) => {
    pos(e);
    [mx, my] = [tx, ty];
    openTarget = 1;
    root.setAttribute('data-fx-active', '');
    loop.wake();
  };
  const onMove = (e: PointerEvent) => {
    pos(e);
    loop.wake();
  };
  const onLeave = () => {
    openTarget = 0;
    loop.wake();
  };
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);

  return {
    destroy() {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      img.removeEventListener('load', upload);
      loop.stop();
      gl.deleteTexture(tex);
      quad.destroy();
      restore();
    },
  };
}

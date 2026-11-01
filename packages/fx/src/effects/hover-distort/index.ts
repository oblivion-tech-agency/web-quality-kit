/**
 * hover-distort — al pasar el puntero, la foto se deforma como agua alrededor
 * del cursor, con un leve corrimiento de color, y vuelve a su lugar al salir.
 * WebGL2 sobre un canvas encima de la imagen (la imagen sigue siendo el LCP y
 * el fallback). Para portfolios, casos, productos: fotos que invitan a abrirse.
 * Familia: imagen · Intensidad 2 · 0 deps.
 *
 *   <figure data-fx-distort style="position: relative">
 *     <img src="caso.webp" alt="…">
 *     <canvas data-fx-canvas style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0"></canvas>
 *
 * El canvas se muestra solo mientras dura el efecto (`data-fx-active`):
 *   [data-fx-distort] canvas { transition: opacity 200ms; }
 *   [data-fx-distort][data-fx-active] canvas { opacity: 1; }
 *
 * La imagen tiene que ser del mismo origen (o con CORS) para poder leerla.
 * Solo con puntero fino. Reduced motion: no hace nada (en vivo).
 * destroy(): libera la textura y el programa, y devuelve figura y canvas como estaban.
 */

import { bundle, createLoop, damp, finePointer, motionSwitch, part, preserve, type FxHandle } from '../../core/index.ts';
import { createGlQuad } from '../../lib/gl.ts';

export interface HoverDistortOptions {
  /** 0–1: cuánto deforma. */
  strength?: number;
  /** Radio de la onda, en fracción del ancho. */
  radius?: number;
  /** Corrimiento de color (0 = nada). */
  rgbShift?: number;
}

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImage; uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uMouse;
uniform float uHover; uniform float uTime; uniform float uStrength; uniform float uRadius; uniform float uShift;
out vec4 outColor;
vec2 cover(vec2 uv) {
  float r = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 s = r > ri ? vec2(1.0, ri / r) : vec2(r / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes; uv.y = 1.0 - uv.y;
  vec2 d = uv - uMouse; d.x *= uRes.x / uRes.y;
  float dist = length(d);
  float wave = sin(dist * 38.0 - uTime * 6.0) * exp(-dist / max(0.001, uRadius)) * uHover;
  vec2 off = normalize(d + 1e-5) * wave * 0.02 * uStrength;
  vec2 tuv = cover(uv + off);
  float s = uShift * uHover * 0.004 * (0.5 + wave);
  vec3 col = vec3(texture(uImage, tuv + vec2(s, 0)).r, texture(uImage, tuv).g, texture(uImage, tuv - vec2(s, 0)).b);
  outColor = vec4(col, 1.0);
}`;

export function createHoverDistort(root: HTMLElement, { strength = 1, radius = 0.35, rgbShift = 1 }: HoverDistortOptions = {}): FxHandle {
  const canvas = part<HTMLCanvasElement>(root, 'canvas');
  const img = root.querySelector('img');
  if (!canvas || !img || !finePointer()) return { destroy() {} };
  const restore = bundle(
    preserve(root, { attributes: ['data-fx-active'] }),
    preserve(canvas, { attributes: ['width', 'height', 'aria-hidden'] }),
  );

  const off = motionSwitch({
    full: () => {
      const quad = createGlQuad(canvas, FRAG);
      if (!quad) return;
      canvas.setAttribute('aria-hidden', 'true');
      const { gl } = quad;
      const tex = gl.createTexture();
      let ready = false;
      const upload = () => {
        if (!img.naturalWidth) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        } catch {
          return; // imagen de otro origen sin CORS: queda la foto sin efecto
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform2f(quad.uniform('uImg'), img.naturalWidth, img.naturalHeight);
        ready = true;
      };
      if (img.complete) upload();
      else img.addEventListener('load', upload, { once: true });
      gl.uniform1f(quad.uniform('uStrength'), strength);
      gl.uniform1f(quad.uniform('uRadius'), radius);
      gl.uniform1f(quad.uniform('uShift'), rgbShift);

      let hover = 0;
      let hoverTarget = 0;
      let mx = 0.5;
      let my = 0.5;
      let tx = 0.5;
      let ty = 0.5;
      let time = 0;
      const loop = createLoop((dt) => {
        if (!ready) return false;
        time += dt;
        hover = damp(hover, hoverTarget, 0.002, dt);
        mx = damp(mx, tx, 0.0005, dt);
        my = damp(my, ty, 0.0005, dt);
        if (quad.resize(2)) gl.uniform2f(quad.uniform('uRes'), canvas.width, canvas.height);
        gl.uniform2f(quad.uniform('uMouse'), mx, my);
        gl.uniform1f(quad.uniform('uHover'), hover);
        gl.uniform1f(quad.uniform('uTime'), time);
        quad.draw();
        if (hoverTarget === 0 && hover < 0.01) {
          root.removeAttribute('data-fx-active');
          return false;
        }
      });
      const onEnter = (e: PointerEvent) => {
        onMove(e);
        [mx, my] = [tx, ty];
        hoverTarget = 1;
        root.setAttribute('data-fx-active', '');
        loop.wake();
      };
      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        tx = (e.clientX - r.left) / Math.max(1, r.width);
        ty = (e.clientY - r.top) / Math.max(1, r.height);
      };
      const onLeave = () => {
        hoverTarget = 0;
        loop.wake();
      };
      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerleave', onLeave);
      return () => {
        root.removeEventListener('pointerenter', onEnter);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerleave', onLeave);
        img.removeEventListener('load', upload);
        loop.stop();
        gl.deleteTexture(tex);
        quad.destroy();
        restore();
      };
    },
  });

  return {
    destroy() {
      off();
      restore();
    },
  };
}

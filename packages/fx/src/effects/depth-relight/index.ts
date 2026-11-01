/**
 * depth-relight — una foto se vuelve a iluminar en vivo: con un mapa de
 * profundidad (blanco = cerca), el shader calcula el relieve y una luz sigue
 * al cursor (o gira sola despacio), con un leve paralaje por profundidad. Para
 * el hero de un producto o un lugar: se siente físico sin cargar 3D.
 * WebGL2, sin Three.js. Familia: imagen / 3D · Intensidad 3 · 0 deps · Firma posible.
 *
 *   <figure data-fx-relight style="position: relative">
 *     <img data-fx-fallback src="hero.webp" data-fx-depth="hero-depth.webp" alt="…">
 *     <canvas data-fx-canvas style="position: absolute; inset: 0; width: 100%; height: 100%"></canvas>
 *
 * El mapa de profundidad sale de `tools/blender/product.py` (stills con
 * `"depth": true`) o de un modelo de estimación de profundidad.
 * La foto (`data-fx-fallback`) se ve hasta el primer render y vuelve si falla.
 * Reduced motion: luz fija, sin paralaje ni giro (en vivo).
 * destroy(): libera texturas y programa y devuelve figura y canvas.
 */

import { bundle, createLoop, damp, finePointer, motionSwitch, onVisibility, part, preserve, token, type FxHandle } from '../../core/index.ts';
import { createGlQuad, cssColor } from '../../lib/gl.ts';

export interface DepthRelightOptions {
  /** URL del mapa de profundidad (si no, `data-fx-depth` de la imagen). */
  depth?: string;
  /** 0–1: fuerza de la luz que se suma. */
  intensity?: number;
  /** Paralaje máximo en fracción del ancho. */
  parallax?: number;
  /** Sin puntero, la luz gira sola (segundos por vuelta; 0 = quieta). */
  orbit?: number;
}

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImage; uniform sampler2D uDepth; uniform vec2 uRes; uniform vec2 uImg;
uniform vec2 uLight; uniform float uIntensity; uniform vec2 uShift; uniform vec3 uTint;
out vec4 outColor;
vec2 cover(vec2 uv) {
  float r = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 s = r > ri ? vec2(1.0, ri / r) : vec2(r / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes; uv.y = 1.0 - uv.y;
  vec2 cuv = cover(uv);
  float d = texture(uDepth, cuv).r;
  vec2 puv = cover(uv + uShift * (d - 0.5));
  vec3 base = texture(uImage, puv).rgb;
  vec2 px = 4.0 / uImg; // pendiente sobre 4 píxeles: menos ruido, más relieve
  float dx = texture(uDepth, puv + vec2(px.x, 0)).r - texture(uDepth, puv - vec2(px.x, 0)).r;
  float dy = texture(uDepth, puv + vec2(0, px.y)).r - texture(uDepth, puv - vec2(0, px.y)).r;
  vec3 n = normalize(vec3(-dx * 3.0, dy * 3.0, 0.35));
  vec3 l = normalize(vec3((uLight - uv) * vec2(1.6, -1.6), 0.55));
  float diff = max(dot(n, l), 0.0);
  float fall = 1.0 / (1.0 + 4.0 * length(uLight - uv));
  vec3 lit = base + base * uTint * diff * fall * uIntensity * 2.2;
  outColor = vec4(lit, 1.0);
}`;

function loadTexture(gl: WebGL2RenderingContext, img: HTMLImageElement, unit: number): WebGLTexture | null {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function createDepthRelight(root: HTMLElement, options: DepthRelightOptions = {}): FxHandle {
  const canvas = part<HTMLCanvasElement>(root, 'canvas');
  const photo = (part<HTMLImageElement>(root, 'fallback') ?? root.querySelector('img')) as HTMLImageElement | null;
  const depthUrl = options.depth ?? photo?.getAttribute('data-fx-depth');
  if (!canvas || !photo || !depthUrl) return { destroy() {} };
  const { intensity = 0.8, parallax = 0.012, orbit = 14 } = options;
  const restore = bundle(
    preserve(canvas, { attributes: ['width', 'height', 'aria-hidden'] }),
    preserve(photo, { attributes: ['hidden'] }),
  );
  let dead = false;
  let teardown: (() => void) | null = null;

  const start = async () => {
    const depth = new Image();
    depth.src = depthUrl;
    const base = new Image();
    base.src = photo.currentSrc || photo.src;
    try {
      await Promise.all([base.decode(), depth.decode()]);
    } catch {
      return; // queda la foto
    }
    if (dead) return;
    const quad = createGlQuad(canvas, FRAG);
    if (!quad) return;
    const { gl } = quad;
    canvas.setAttribute('aria-hidden', 'true');
    const tImg = loadTexture(gl, base, 0);
    const tDepth = loadTexture(gl, depth, 1);
    gl.uniform1i(quad.uniform('uImage'), 0);
    gl.uniform1i(quad.uniform('uDepth'), 1);
    gl.uniform2f(quad.uniform('uImg'), base.naturalWidth, base.naturalHeight);
    gl.uniform1f(quad.uniform('uIntensity'), intensity);
    gl.uniform3fv(quad.uniform('uTint'), cssColor(root, token(root, '--fx-rim', token(root, '--fx-accent', 'white'))));
    let [lx, ly, tx, ty] = [0.3, 0.3, 0.3, 0.3];
    let pointer = false;
    let time = 0;
    const render = (shift: [number, number]) => {
      if (quad.resize(2)) gl.uniform2f(quad.uniform('uRes'), canvas.width, canvas.height);
      gl.uniform2f(quad.uniform('uLight'), lx, ly);
      gl.uniform2f(quad.uniform('uShift'), shift[0], shift[1]);
      quad.draw();
    };
    render([0, 0]);
    photo.setAttribute('hidden', '');

    const off = motionSwitch({
      full: () => {
        const loop = createLoop((dt) => {
          time += dt;
          if (!pointer && orbit > 0) {
            tx = 0.5 + Math.cos((time / orbit) * Math.PI * 2) * 0.32;
            ty = 0.42 + Math.sin((time / orbit) * Math.PI * 2) * 0.22;
          }
          lx = damp(lx, tx, 0.01, dt);
          ly = damp(ly, ty, 0.01, dt);
          render([(lx - 0.5) * -parallax, (ly - 0.5) * -parallax]);
        });
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          pointer = true;
          tx = (e.clientX - r.left) / Math.max(1, r.width);
          ty = (e.clientY - r.top) / Math.max(1, r.height);
        };
        const onLeave = () => (pointer = false);
        if (finePointer()) {
          root.addEventListener('pointermove', onMove);
          root.addEventListener('pointerleave', onLeave);
        }
        const offVisible = onVisibility(root, (v) => (v ? loop.wake() : loop.stop()));
        return () => {
          offVisible();
          loop.stop();
          root.removeEventListener('pointermove', onMove);
          root.removeEventListener('pointerleave', onLeave);
        };
      },
      reduced: () => {
        [lx, ly] = [0.3, 0.3];
        render([0, 0]);
      },
    });
    const onResize = () => render([0, 0]);
    addEventListener('resize', onResize, { passive: true });
    teardown = () => {
      off();
      removeEventListener('resize', onResize);
      gl.deleteTexture(tImg);
      gl.deleteTexture(tDepth);
      quad.destroy();
    };
  };
  void start();

  return {
    destroy() {
      dead = true;
      teardown?.();
      restore();
    },
  };
}

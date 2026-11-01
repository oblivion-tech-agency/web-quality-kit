/**
 * WebGL2 mínimo para fondos y efectos de imagen con shaders, sin Three.js:
 * un triángulo que cubre el canvas y un fragment shader. ~1 KB.
 */

export interface GlQuad {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniform(name: string): WebGLUniformLocation | null;
  /** Ajusta el tamaño al del elemento (DPR con tope). Devuelve true si cambió. */
  resize(maxDpr?: number): boolean;
  draw(): void;
  destroy(): void;
}

const VERT = `#version 300 es
in vec2 p;
out vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('No se pudo crear el shader');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader: ${log}`);
  }
  return sh;
}

/** Crea el quad o devuelve null si no hay WebGL2 (el efecto queda en su fallback). */
export function createGlQuad(canvas: HTMLCanvasElement, fragment: string, options: WebGLContextAttributes = {}): GlQuad | null {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, ...options });
  if (!gl) return null;
  let vs: WebGLShader, fs: WebGLShader;
  try {
    vs = compile(gl, gl.VERTEX_SHADER, VERT);
    fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  } catch {
    return null;
  }
  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const cache = new Map<string, WebGLUniformLocation | null>();

  return {
    gl,
    program,
    uniform(name) {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
      return cache.get(name) ?? null;
    },
    resize(maxDpr = 1.5) {
      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w === canvas.width && h === canvas.height) return false;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      return true;
    },
    draw() {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Sin loseContext(): un remount sobre el mismo canvas (StrictMode, cambio de
      // ruta) recibiría el contexto perdido. Los recursos ya están liberados.
    },
  };
}

/** Un color CSS (cualquier formato) a RGB lineal 0–1, resuelto por el navegador. */
export function cssColor(el: Element, value: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  el.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  probe.remove();
  return [(rgb[0] ?? 0) / 255, (rgb[1] ?? 0) / 255, (rgb[2] ?? 0) / 255];
}

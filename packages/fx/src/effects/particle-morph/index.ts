/**
 * particle-morph — miles de partículas (Canvas 2D, sin Three.js) que forman la
 * silueta de una imagen (un logo, un isotipo, un producto) o de un texto, y se
 * transforman de una forma a otra con `to(i)`. Respiran, se apartan del
 * puntero y vuelven. Para marcas con un isotipo propio o una palabra clave.
 * Familia: 3D / fondo · Intensidad 4 · 0 deps · Firma posible.
 *
 *   <div data-fx-particles style="position: relative; aspect-ratio: 1">
 *     <canvas data-fx-canvas style="position: absolute; inset: 0; width: 100%; height: 100%"></canvas>
 *     <img data-fx-fallback src="isotipo.svg" alt="…">
 *
 * Colores desde `--fx-accent` e `--fx-ink` (las partículas mezclan los dos).
 * Se pausa fuera de pantalla y baja la cantidad si el frame rate cae.
 * Reduced motion: las partículas quedan quietas en la primera forma.
 * destroy(): corta el loop y listeners y devuelve canvas y fallback.
 */

import { bundle, createLoop, finePointer, motionSwitch, onVisibility, part, preserve, prefersReducedMotion, token, type FxHandle } from '../../core/index.ts';

export type MorphTarget = { image: string } | { text: string; font?: string };

export interface ParticleMorphOptions {
  targets: MorphTarget[];
  count?: number;
  /** Fracción del lado menor que ocupa la forma. */
  fit?: number;
  /** Cambia de forma sola cada `cycle` ms (0 = no). */
  cycle?: number;
}

export interface ParticleMorphHandle extends FxHandle {
  to(index: number): void;
}

async function sample(target: MorphTarget, want: number): Promise<Array<[number, number]>> {
  const S = 220;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  if ('image' in target) {
    const img = new Image();
    img.src = target.image;
    await img.decode();
    const ratio = img.naturalWidth / img.naturalHeight || 1;
    const w = ratio >= 1 ? S : S * ratio;
    const h = ratio >= 1 ? S / ratio : S;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
  } else {
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 120;
    ctx.font = target.font ?? `800 ${size}px system-ui, sans-serif`;
    while (ctx.measureText(target.text).width > S * 0.95 && size > 10) {
      size -= 4;
      ctx.font = target.font ?? `800 ${size}px system-ui, sans-serif`;
    }
    ctx.fillText(target.text, S / 2, S / 2);
  }
  const data = ctx.getImageData(0, 0, S, S).data;
  const inside: Array<[number, number]> = [];
  for (let y = 0; y < S; y += 1) for (let x = 0; x < S; x += 1) if ((data[(y * S + x) * 4 + 3] ?? 0) > 128) inside.push([x / S - 0.5, y / S - 0.5]);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < want && inside.length; i++) out.push(inside[Math.floor(Math.random() * inside.length)] as [number, number]);
  return out;
}

export function createParticleMorph(root: HTMLElement, options: ParticleMorphOptions): ParticleMorphHandle {
  const canvas = part<HTMLCanvasElement>(root, 'canvas');
  const fallback = part(root, 'fallback');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !options.targets.length) return { destroy() {}, to() {} };
  const restore = bundle(
    preserve(canvas, { attributes: ['width', 'height', 'aria-hidden'] }),
    fallback && preserve(fallback, { attributes: ['hidden'] }),
  );
  canvas.setAttribute('aria-hidden', 'true');
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  let count = options.count ?? (small ? 1400 : 2800);
  const fit = options.fit ?? 0.8;

  type P = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; seed: number; mix: number };
  let ps: P[] = [];
  let shapes: Array<Array<[number, number]>> = [];
  let current = 0;
  let dead = false;
  let size = 0;
  const accent = token(root, '--fx-accent', 'white');
  const ink = token(root, '--fx-ink', 'white');
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    size = Math.min(canvas.width, canvas.height) * fit;
  };
  const aim = (index: number) => {
    const shape = shapes[index];
    if (!shape?.length) return;
    current = index;
    ps.forEach((p, i) => {
      const [sx, sy] = shape[i % shape.length] as [number, number];
      p.tx = sx;
      p.ty = sy;
    });
  };
  const draw = (t: number, still = false) => {
    const { width: W, height: H } = canvas;
    ctx.clearRect(0, 0, W, H);
    const r = Math.max(1, size / 260);
    for (const p of ps) {
      if (!still) {
        const bx = p.tx + Math.sin(t * 0.0008 + p.seed * 6.28) * 0.004;
        const by = p.ty + Math.cos(t * 0.0007 + p.seed * 6.28) * 0.004;
        p.vx += (bx - p.x) * 0.06;
        p.vy += (by - p.y) * 0.06;
        const px = (p.x * size + W / 2 - mouse.x) / size;
        const py = (p.y * size + H / 2 - mouse.y) / size;
        const d2 = px * px + py * py;
        if (d2 < 0.012) {
          const f = (0.012 - d2) * 1.6;
          p.vx += px * f;
          p.vy += py * f;
        }
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;
      } else {
        p.x = p.tx;
        p.y = p.ty;
      }
      ctx.fillStyle = p.mix > 0.7 ? ink : accent;
      ctx.globalAlpha = 0.55 + p.mix * 0.45;
      ctx.fillRect(p.x * size + W / 2, p.y * size + H / 2, r, r);
    }
    ctx.globalAlpha = 1;
  };

  let teardown: (() => void) | null = null;
  const start = async () => {
    shapes = await Promise.all(options.targets.map((t) => sample(t, count))).catch(() => []);
    if (dead || !shapes.length || !shapes[0]?.length) return;
    resize();
    ps = Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 1.6, y: (Math.random() - 0.5) * 1.6, vx: 0, vy: 0, tx: 0, ty: 0, seed: Math.random(), mix: Math.random() }));
    aim(0);
    fallback?.setAttribute('hidden', '');
    teardown = motionSwitch({
      full: () => {
        let slow = 0;
        const loop = createLoop((dt, now) => {
          if (dt > 0.033 && ++slow > 30 && ps.length > 600) {
            ps = ps.slice(0, Math.floor(ps.length * 0.7)); // degradar si el frame rate cae
            count = ps.length;
            slow = 0;
          }
          draw(now);
        });
        const onMove = (e: PointerEvent) => {
          const r = canvas.getBoundingClientRect();
          const dpr = canvas.width / Math.max(1, r.width);
          mouse.x = (e.clientX - r.left) * dpr;
          mouse.y = (e.clientY - r.top) * dpr;
        };
        const onLeave = () => (mouse.x = mouse.y = -9999);
        if (finePointer()) {
          root.addEventListener('pointermove', onMove);
          root.addEventListener('pointerleave', onLeave);
        }
        const timer = options.cycle ? window.setInterval(() => aim((current + 1) % shapes.length), options.cycle) : 0;
        const offVisible = onVisibility(root, (v) => (v ? loop.wake() : loop.stop()));
        return () => {
          offVisible();
          loop.stop();
          clearInterval(timer);
          root.removeEventListener('pointermove', onMove);
          root.removeEventListener('pointerleave', onLeave);
        };
      },
      reduced: () => {
        aim(0);
        draw(0, true);
      },
    });
  };
  void start();
  const onResize = () => {
    resize();
    if (prefersReducedMotion()) draw(0, true);
  };
  addEventListener('resize', onResize, { passive: true });

  return {
    to(index) {
      aim(((index % shapes.length) + shapes.length) % shapes.length);
      if (prefersReducedMotion()) draw(0, true);
    },
    destroy() {
      dead = true;
      teardown?.();
      removeEventListener('resize', onResize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      restore();
    },
  };
}

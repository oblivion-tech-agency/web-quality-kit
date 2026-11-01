/**
 * liquid-glass — una superficie de vidrio que refracta lo que tiene detrás
 * (bordes que doblan el fondo como una lente) con un brillo que sigue al
 * puntero. Para una barra de navegación, un botón protagonista o una tarjeta
 * que flota sobre una foto o un video.
 * Familia: interacción / fondo · Intensidad 2 · 0 deps.
 *
 *   <nav data-fx-glass style="border-radius: 999px">…</nav>
 *
 * Mejora progresiva: en Chromium la refracción es real (`backdrop-filter` con
 * un filtro SVG de desplazamiento); en el resto queda un vidrio esmerilado
 * (desenfoque y saturación). El brillo se lee de `--fx-glass-x/y` en el CSS:
 *
 *   [data-fx-glass] { background: color-mix(in oklab, var(--fx-ink) 6%, transparent); }
 *   [data-fx-glass]::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
 *     background: radial-gradient(120px at var(--fx-glass-x, 30%) var(--fx-glass-y, 0%), color-mix(in oklab, var(--fx-ink) 18%, transparent), transparent); }
 *
 * Un vidrio sobre fondo liso no se nota: va encima de algo con imagen.
 * Reduced motion: el brillo queda quieto (la refracción no es movimiento).
 * destroy(): saca el filtro SVG, los estilos y los listeners.
 */

import { finePointer, motionSwitch, preserve, type FxHandle } from '../../core/index.ts';

export interface LiquidGlassOptions {
  /** Cuánto dobla el borde (px de desplazamiento). */
  refraction?: number;
  /** Desenfoque del fondo en px. */
  blur?: number;
}

let uid = 0;

/** Mapa de desplazamiento: un borde que empuja hacia afuera, el centro quieto. */
function displacementMap(w: number, h: number, radius: number): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(w, h);
  const band = Math.max(8, Math.min(w, h) * 0.22);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Distancia al borde del rectángulo redondeado.
      const qx = Math.max(Math.abs(x - w / 2) - (w / 2 - radius), 0);
      const qy = Math.max(Math.abs(y - h / 2) - (h / 2 - radius), 0);
      const inside = Math.min(Math.max(Math.abs(x - w / 2) - (w / 2 - radius), Math.abs(y - h / 2) - (h / 2 - radius)), 0);
      const dist = radius - (Math.hypot(qx, qy) + inside);
      const k = Math.max(0, 1 - dist / band) ** 2;
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      const i = (y * w + x) * 4;
      img.data[i] = 128 - nx * k * 127;
      img.data[i + 1] = 128 - ny * k * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function createLiquidGlass(el: HTMLElement, { refraction = 28, blur = 2 }: LiquidGlassOptions = {}): FxHandle {
  const restore = preserve(el, { styles: ['backdrop-filter', '-webkit-backdrop-filter', '--fx-glass-x', '--fx-glass-y'] });
  const id = `fx-glass-${++uid}`;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';

  const supportsUrl = typeof CSS !== 'undefined' && CSS.supports?.('backdrop-filter', `url(#${id})`) && /Chrome|Chromium|Edg\//.test(navigator.userAgent);
  const apply = () => {
    const r = el.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width));
    const h = Math.max(2, Math.round(r.height));
    if (supportsUrl) {
      const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, Math.min(w, h) / 2);
      svg.innerHTML = `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feImage href="${displacementMap(w, h, radius)}" x="0" y="0" width="${w}" height="${h}" result="map"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="soft"/>
        <feDisplacementMap in="soft" in2="map" scale="${refraction}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>`;
      el.style.setProperty('backdrop-filter', `url(#${id}) saturate(1.4)`);
    } else {
      el.style.setProperty('backdrop-filter', `blur(${blur * 6}px) saturate(1.5)`);
      el.style.setProperty('-webkit-backdrop-filter', `blur(${blur * 6}px) saturate(1.5)`);
    }
  };
  document.body.append(svg);
  apply();
  const ro = new ResizeObserver(apply);
  ro.observe(el);

  const off = motionSwitch({
    full: () => {
      if (!finePointer()) return;
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--fx-glass-x', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty('--fx-glass-y', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      return () => window.removeEventListener('pointermove', onMove);
    },
  });

  return {
    destroy() {
      off();
      ro.disconnect();
      svg.remove();
      restore();
    },
  };
}

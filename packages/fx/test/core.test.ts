import { describe, expect, it } from 'vitest';
import { clamp01, damp, progress, preserve, bundle } from '../src/core/index.ts';
import { chapterAt } from '../src/effects/scroll-sequence/index.ts';
import { loadOrder } from '../src/lib/frame-player.ts';
import { segmentsFromStops } from '../src/effects/live-timeline/index.ts';

describe('math', () => {
  it('clamp01 y progress recortan', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(progress(0.5, 0.25, 0.75)).toBe(0.5);
    expect(progress(0.1, 0.25, 0.75)).toBe(0);
  });

  it('damp es independiente del frame rate', () => {
    let a = 0;
    for (let i = 0; i < 60; i++) a = damp(a, 1, 0.01, 1 / 60);
    let b = 0;
    for (let i = 0; i < 120; i++) b = damp(b, 1, 0.01, 1 / 120);
    expect(Math.abs(a - b)).toBeLessThan(1e-9);
    expect(a).toBeCloseTo(0.99, 5);
  });
});

describe('preserve', () => {
  it('repone atributos, estilos (incluida su ausencia) e hijos', () => {
    document.body.innerHTML = '<div id="x" style="color: red" data-a="1"><b>hola</b></div>';
    const el = document.getElementById('x') as HTMLElement;
    const before = el.outerHTML;
    const restore = bundle(preserve(el, { attributes: ['data-a', 'data-b'], styles: ['color', '--fx-p'], children: true }));
    el.setAttribute('data-a', '2');
    el.setAttribute('data-b', 'nuevo');
    el.style.color = 'blue';
    el.style.setProperty('--fx-p', '0.5');
    el.textContent = 'otro';
    restore();
    expect(el.outerHTML).toBe(before);
  });
});

describe('secuencias', () => {
  it('chapterAt elige el último stop alcanzado', () => {
    expect(chapterAt(0, [0, 0.25, 0.5])).toBe(0);
    expect(chapterAt(0.3, [0, 0.25, 0.5])).toBe(1);
    expect(chapterAt(1, [0, 0.25, 0.5])).toBe(2);
  });

  it('loadOrder empieza por el cuadro pedido, pasa por cada 8º y no repite', () => {
    const order = loadOrder(20, 5);
    expect(order[0]).toBe(5);
    expect(order.slice(1, 4)).toEqual([0, 8, 16]);
    expect(new Set(order).size).toBe(20);
  });

  it('segmentsFromStops alterna espera y viaje', () => {
    const s = segmentsFromStops([0, 100, 300], { travel: 3000 });
    expect(s.map((x) => x.moving)).toEqual([false, true, false, true, false]);
    expect(s[3]!.dur).toBeGreaterThan(s[1]!.dur);
  });
});

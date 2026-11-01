/**
 * El contrato del kit, efecto por efecto: `destroy()` deja el DOM como estaba
 * (incluido el remount de StrictMode) y reduced motion se respeta en vivo.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { mockMedia, mount } from './helpers.ts';
import { createClipReveal } from '../src/effects/clip-reveal/index.ts';
import { createCountUp } from '../src/effects/count-up/index.ts';
import { createScrollProgress } from '../src/effects/scroll-progress/index.ts';
import { createCursorLabel } from '../src/effects/cursor-label/index.ts';
import { createSplitFlap } from '../src/effects/split-flap/index.ts';
import { createLiveTimeline, segmentsFromStops } from '../src/effects/live-timeline/index.ts';
import { createPinnedHorizontal } from '../src/effects/pinned-horizontal/index.ts';
import { createScrollSequence } from '../src/effects/scroll-sequence/index.ts';
import { createTurntable } from '../src/effects/turntable/index.ts';
import { createModelTurntable } from '../src/effects/model-turntable/index.ts';
import type { FxHandle } from '../src/core/types.ts';

const cases: Array<[string, string, (root: HTMLElement) => FxHandle]> = [
  ['clip-reveal', '<figure data-fx-clip><img alt=""></figure>', (r) => createClipReveal(r)],
  ['count-up', '<p><span data-fx-count="3150">3.150</span> km</p>', (r) => createCountUp(r, { locale: 'es-AR' })],
  ['scroll-progress', '<section data-fx-progress="view" style="height:500px"></section>', (r) => createScrollProgress(r)],
  ['cursor-label', '<a href="#" data-fx-cursor="Ver caso">Caso</a>', (r) => createCursorLabel(r)],
  ['split-flap', '<span id="flap">USHUAIA</span>', (r) => createSplitFlap(r.querySelector('#flap') as HTMLElement, { values: ['USHUAIA', 'VIEDMA'] })],
  ['live-timeline', '<div id="track"></div>', (r) => createLiveTimeline(r.querySelector('#track') as HTMLElement, { segments: segmentsFromStops([0, 10]), onFrame() {} })],
  [
    'pinned-horizontal',
    '<section id="pin"><div data-fx-pin-viewport><ul data-fx-pin-track><li>1</li><li>2</li></ul></div></section>',
    (r) => createPinnedHorizontal(r.querySelector('#pin') as HTMLElement),
  ],
  [
    'scroll-sequence',
    '<section id="seq"><canvas data-fx-canvas></canvas><img data-fx-fallback alt="x"></section>',
    (r) => createScrollSequence(r.querySelector('#seq') as HTMLElement, { frames: ['a.webp', 'b.webp'], poses: [0, 1], stops: [0, 0.5] }),
  ],
  [
    'turntable',
    '<figure id="tt"><canvas data-fx-canvas></canvas><img data-fx-fallback alt="x"></figure>',
    (r) => createTurntable(r.querySelector('#tt') as HTMLElement, { frames: ['a.webp', 'b.webp'] }),
  ],
  [
    'model-turntable',
    '<figure id="m"><canvas data-fx-canvas></canvas><img data-fx-fallback alt="x"></figure>',
    (r) => createModelTurntable(r.querySelector('#m') as HTMLElement, { url: 'x.glb' }),
  ],
];

describe.each([false, true])('reduced motion = %s', (reduce) => {
  beforeEach(() => {
    mockMedia({ reduce });
  });

  it.each(cases)('%s: destroy() deja el DOM como estaba', (_name, html, create) => {
    const root = mount(html);
    const before = document.body.innerHTML;
    const handle = create(root);
    handle.destroy();
    expect(document.body.innerHTML).toBe(before);
  });

  it.each(cases)('%s: sobrevive el doble montaje de StrictMode', (_name, html, create) => {
    const root = mount(html);
    const before = document.body.innerHTML;
    create(root).destroy();
    create(root).destroy();
    expect(document.body.innerHTML).toBe(before);
  });
});

describe('reduced motion en vivo', () => {
  it('motionSwitch cambia de rama y suelta el listener al destruir', () => {
    const media = mockMedia({ reduce: false });
    const root = mount('<p><span data-fx-count="40">40</span> W</p>');
    const handle = createCountUp(root);
    expect(media.listenerCount()).toBe(1);
    media.setReduce(true);
    expect(root.textContent).toBe('40 W');
    handle.destroy();
    expect(media.listenerCount()).toBe(0);
  });

  it('clip-reveal revela todo al pasar a reduced motion', () => {
    const media = mockMedia({ reduce: false });
    const root = mount('<figure data-fx-clip><img alt=""></figure><figure data-fx-clip><img alt=""></figure>');
    const handle = createClipReveal(root);
    media.setReduce(true);
    expect(root.querySelectorAll('[data-fx-revealed]').length).toBe(2);
    handle.destroy();
    expect(root.querySelectorAll('[data-fx-revealed]').length).toBe(0);
  });
});

describe('split-flap', () => {
  it('mantiene el valor real accesible y no duplica texto', () => {
    mockMedia({ reduce: true });
    const root = mount('<span id="flap">USHUAIA</span>');
    const el = root.querySelector('#flap') as HTMLElement;
    const flap = createSplitFlap(el);
    flap.set('VIEDMA');
    expect(el.textContent).toBe('VIEDMAVIEDMA'); // real (oculto) + mostrado
    flap.destroy();
    expect(el.textContent).toBe('USHUAIA');
  });
});

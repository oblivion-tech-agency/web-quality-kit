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
import { createSmoothScroll } from '../src/effects/smooth-scroll/index.ts';
import { createSplitReveal } from '../src/effects/split-reveal/index.ts';
import { createScramble } from '../src/effects/scramble/index.ts';
import { createMarquee } from '../src/effects/marquee/index.ts';
import { createStackedCards } from '../src/effects/stacked-cards/index.ts';
import { createFlipLayout } from '../src/effects/flip-layout/index.ts';
import { createVideoScrub } from '../src/effects/video-scrub/index.ts';
import { createShaderBackdrop } from '../src/effects/shader-backdrop/index.ts';
import { createHoverDistort } from '../src/effects/hover-distort/index.ts';
import { createMagnetic } from '../src/effects/magnetic/index.ts';
import { createViewTransition } from '../src/effects/view-transition/index.ts';
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
  ['smooth-scroll', '<main>contenido</main>', () => createSmoothScroll(document.documentElement)],
  ['split-reveal', '<h2 id="t">Toda la sala en una mano</h2>', (r) => createSplitReveal(r.querySelector('#t') as HTMLElement)],
  ['split-reveal (load)', '<h1 id="t">Hola mundo</h1>', (r) => createSplitReveal(r.querySelector('#t') as HTMLElement, { trigger: 'load', by: 'words' })],
  ['scramble', '<span id="s">Agentes de IA</span>', (r) => createScramble(r.querySelector('#s') as HTMLElement)],
  [
    'marquee',
    '<div id="mq" style="overflow:hidden"><div data-fx-marquee-track style="display:flex"><span>Uno</span><span>Dos</span></div></div>',
    (r) => createMarquee(r.querySelector('#mq') as HTMLElement),
  ],
  [
    'stacked-cards',
    '<div id="st"><article data-fx-stack-card style="--i:0">A</article><article data-fx-stack-card style="--i:1">B</article><article data-fx-stack-card>C</article></div>',
    (r) => createStackedCards(r.querySelector('#st') as HTMLElement),
  ],
  ['flip-layout', '<ul id="g"><li data-fx-flip>1</li><li data-fx-flip>2</li></ul>', (r) => createFlipLayout(r.querySelector('#g') as HTMLElement)],
  [
    'video-scrub',
    '<section id="v"><video data-fx-video muted playsinline></video></section>',
    (r) => createVideoScrub(r.querySelector('#v') as HTMLElement),
  ],
  [
    'shader-backdrop',
    '<section id="b"><canvas data-fx-canvas></canvas></section>',
    (r) => createShaderBackdrop(r.querySelector('#b') as HTMLElement, { variant: 'dither' }),
  ],
  [
    'hover-distort',
    '<figure id="h"><img alt="" src="x.webp"><canvas data-fx-canvas></canvas></figure>',
    (r) => createHoverDistort(r.querySelector('#h') as HTMLElement),
  ],
  [
    'magnetic',
    '<a id="mg" href="#" data-fx-magnetic style="transform: rotate(1deg)"><span data-fx-magnetic-inner>Hablemos</span></a>',
    (r) => createMagnetic(r),
  ],
  [
    'view-transition',
    '<img alt="" data-fx-vt="caso-1" style="width:10px">',
    (r) => createViewTransition(r),
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

describe('flip-layout y view-transition', () => {
  it('flip-layout aplica el cambio también con reduced motion', () => {
    mockMedia({ reduce: true });
    const root = mount('<ul id="g"><li data-fx-flip>1</li><li data-fx-flip>2</li></ul>');
    const g = root.querySelector('#g') as HTMLElement;
    const flip = createFlipLayout(g);
    flip.change(() => g.append(g.firstElementChild as Element));
    expect(g.textContent).toBe('21');
    flip.destroy();
  });

  it('view-transition aplica el cambio sin soporte de la API', async () => {
    mockMedia({ reduce: false });
    const root = mount('<p id="p">antes</p>');
    const vt = createViewTransition(root);
    await vt.swap(() => {
      (root.querySelector('#p') as HTMLElement).textContent = 'después';
    });
    expect(root.textContent).toBe('después');
    vt.destroy();
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

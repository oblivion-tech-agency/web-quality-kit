'use client';

import { useRef } from 'react';
import { useText3D } from '@oblivion/fx/effects/text-3d/react.ts';
import { useCarousel3D } from '@oblivion/fx/effects/carousel-3d/react.ts';
import { useInfiniteGallery } from '@oblivion/fx/effects/infinite-gallery/react.ts';
import { useCursorLens } from '@oblivion/fx/effects/cursor-lens/react.ts';
import { useDepthRelight } from '@oblivion/fx/effects/depth-relight/react.ts';
import { useLiquidGlass } from '@oblivion/fx/effects/liquid-glass/react.ts';
import { useParticleMorph } from '@oblivion/fx/effects/particle-morph/react.ts';

const IMAGES = ['light', 'controls', 'fabric', 'stereo', 'hero-1200', 'relight'];

export function Type3D() {
  const ref = useRef<HTMLHeadingElement>(null);
  useText3D(ref);
  return (
    <section className="section">
      <h2 ref={ref} data-fx-3d className="type3d">
        <span data-fx-3d-line>Tipografía</span>
        <span data-fx-3d-line>que entra</span>
        <span data-fx-3d-line>en 3D</span>
      </h2>
      <p className="lead">text-3d: cada línea gira desde atrás y se asienta con el scroll.</p>
    </section>
  );
}

export function Carousel() {
  const ref = useRef<HTMLElement>(null);
  useCarousel3D(ref, { turns: 1 });
  return (
    <section ref={ref} className="ring-section">
      <div className="ring-stage">
        <h2>Un anillo que gira con el scroll</h2>
        <ul data-fx-ring className="ring">
          {IMAGES.concat(IMAGES.slice(0, 2)).map((id, i) => (
            <li key={`${id}-${i}`} data-fx-ring-item className="ring-item">
              <img src={`/fx/img/${id}.webp`} alt="" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  useInfiniteGallery(ref, { cell: [300, 380] });
  return (
    <section className="section">
      <h2>Una galería sin bordes</h2>
      <p className="lead">infinite-gallery: arrastrala en cualquier dirección, con la rueda o con las flechas.</p>
      <div ref={ref} className="gallery">
        {IMAGES.map((id) => (
          <figure key={id} data-fx-gallery-item className="gallery-item">
            <img src={`/fx/img/${id}.webp`} alt={`Parlante de ejemplo: ${id}`} draggable={false} />
          </figure>
        ))}
      </div>
    </section>
  );
}

export function LensAndRelight() {
  const lens = useRef<HTMLElement>(null);
  const relight = useRef<HTMLElement>(null);
  useCursorLens(lens, { zoom: 2.2, shape: 'square' });
  useDepthRelight(relight, { intensity: 1 });
  return (
    <section className="section">
      <h2>Mirar de cerca, volver a iluminar</h2>
      <p className="lead">cursor-lens amplía bajo el cursor; depth-relight mueve la luz sobre una foto con su mapa de profundidad.</p>
      <div className="pair">
        <figure ref={lens} className="tile lens">
          <img src="/fx/img/controls.webp" alt="Controles del parlante" />
          <canvas data-fx-canvas />
        </figure>
        <figure ref={relight} className="tile relight">
          <img data-fx-fallback src="/fx/img/relight.webp" data-fx-depth="/fx/img/relight-depth.webp" alt="Parlante iluminado por un haz de luz" />
          <canvas data-fx-canvas />
        </figure>
      </div>
    </section>
  );
}

export function Glass() {
  const ref = useRef<HTMLDivElement>(null);
  useLiquidGlass(ref, { refraction: 34 });
  return (
    <section className="section glass-section">
      <img className="glass-bg" src="/fx/img/stereo.webp" alt="" />
      <div ref={ref} data-fx-glass className="glass">
        <strong>liquid-glass</strong>
        <span>Refracción real en Chromium; vidrio esmerilado en el resto.</span>
      </div>
    </section>
  );
}

export function Particles() {
  const ref = useRef<HTMLDivElement>(null);
  const fx = useParticleMorph(ref, { targets: [{ text: 'FX' }, { text: 'KIT' }, { text: '∞' }], cycle: 2600 });
  return (
    <section className="section">
      <h2>Partículas que forman una marca</h2>
      <p className="lead">particle-morph: Canvas 2D, miles de partículas que pasan de una forma a otra. Pasá el mouse.</p>
      <div ref={ref} className="particles" onClick={() => fx.current?.to(Math.floor(Math.random() * 3))}>
        <canvas data-fx-canvas />
      </div>
    </section>
  );
}

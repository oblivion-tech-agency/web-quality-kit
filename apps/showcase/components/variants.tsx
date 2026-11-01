'use client';

import { useRef } from 'react';
import { useShaderBackdrop } from '@oblivion/fx/effects/shader-backdrop/react.ts';
import type { BackdropVariant } from '@oblivion/fx/effects/shader-backdrop/index.ts';

function Variant({ variant }: { variant: BackdropVariant }) {
  const ref = useRef<HTMLDivElement>(null);
  useShaderBackdrop(ref, { variant, pixel: 4 });
  return (
    <div ref={ref} className="variant">
      <canvas data-fx-canvas />
      <span>{variant}</span>
    </div>
  );
}

export function Variants() {
  return (
    <section className="section">
      <h2>Tres fondos, un shader</h2>
      <p className="lead">shader-backdrop en WebGL2 sin Three.js. Los colores salen de --fx-ground, --fx-accent y --fx-ink.</p>
      <div className="variants">
        <Variant variant="mesh" />
        <Variant variant="grain" />
        <Variant variant="dither" />
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import { useShaderBackdrop } from '@oblivion/fx/effects/shader-backdrop/react.ts';
import { useSplitReveal } from '@oblivion/fx/effects/split-reveal/react.ts';
import { useScramble } from '@oblivion/fx/effects/scramble/react.ts';
import { useMagnetic } from '@oblivion/fx/effects/magnetic/react.ts';

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  useShaderBackdrop(section, { variant: 'mesh', intensity: 0.9 });
  useSplitReveal(title, { trigger: 'load', by: 'lines', stagger: 0.09 });
  useScramble(label, { duration: 1100 });
  useMagnetic(actions);

  return (
    <section ref={section} className="hero">
      <canvas data-fx-canvas />
      <span ref={label} className="label">@oblivion/fx · showcase</span>
      <h1 ref={title} data-fx-split>Webs que se recuerdan</h1>
      <p className="muted">
        Fondo con shader, titular que sube por líneas, etiqueta que se decodifica y botones magnéticos. Todo con
        el contrato del kit: tokens, reduced motion en vivo y destroy limpio.
      </p>
      <div ref={actions} className="hero-actions">
        <a className="btn" data-fx-magnetic href="#servicios"><span data-fx-magnetic-inner>Ver los efectos</span></a>
        <a className="btn btn-ghost" data-fx-magnetic href="#trabajos"><span data-fx-magnetic-inner>Trabajos</span></a>
      </div>
    </section>
  );
}

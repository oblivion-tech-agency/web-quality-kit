'use client';

import { useRef } from 'react';
import { useMarquee } from '@oblivion/fx/effects/marquee/react.ts';

const ITEMS = ['Estrategia', 'Diseño', 'Desarrollo', 'Agentes de IA', 'Automatización', 'Producto'];

export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  useMarquee(ref, { speed: 70 });
  return (
    <div ref={ref} className="marquee" aria-label="Lo que hacemos">
      <div data-fx-marquee-track className="marquee-track">
        {ITEMS.map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

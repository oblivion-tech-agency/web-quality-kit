'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useViewTransition } from '@oblivion/fx/effects/view-transition/react.ts';

const ITEMS = ['light', 'controls', 'fabric', 'stereo'];

export function Detail() {
  const root = useRef<HTMLElement>(null);
  const vt = useViewTransition(root);
  const [open, setOpen] = useState<string | null>(null);
  const go = (next: string | null) => vt.current?.swap(() => flushSync(() => setOpen(next))) ?? setOpen(next);

  return (
    <section ref={root} className="section">
      <h2>Del índice al detalle</h2>
      <p className="lead">view-transition: la misma foto viaja de la grilla al detalle con la API nativa del navegador.</p>
      {open ? (
        <div className="vt-detail">
          <img src={`/fx/img/${open}.webp`} alt="" data-fx-vt={`foto-${open}`} />
          <div>
            <p className="muted">Detalle de {open}</p>
            <button className="btn" style={{ marginTop: 20 }} onClick={() => go(null)}>Volver</button>
          </div>
        </div>
      ) : (
        <div className="vt-list">
          {ITEMS.map((id) => (
            <button key={id} onClick={() => go(id)} aria-label={`Abrir ${id}`}>
              <img src={`/fx/img/${id}.webp`} alt="" data-fx-vt={`foto-${id}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

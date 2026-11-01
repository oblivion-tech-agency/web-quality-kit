'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useFlipLayout } from '@oblivion/fx/effects/flip-layout/react.ts';
import { useHoverDistort } from '@oblivion/fx/effects/hover-distort/react.ts';

const ITEMS = [
  { id: 'light', name: 'Radiador', kind: 'detalle' },
  { id: 'controls', name: 'Controles', kind: 'detalle' },
  { id: 'fabric', name: 'Tela', kind: 'material' },
  { id: 'stereo', name: 'Estéreo', kind: 'escena' },
  { id: 'hero-1200', name: 'Hero', kind: 'escena' },
];
const FILTERS = ['todo', 'detalle', 'material', 'escena'] as const;

function Tile({ id, name }: { id: string; name: string }) {
  const ref = useRef<HTMLElement>(null);
  useHoverDistort(ref);
  return (
    <figure ref={ref} className="tile">
      <img src={`/fx/img/${id}.webp`} alt={`${name} del parlante de ejemplo`} loading="lazy" />
      <canvas data-fx-canvas />
      <figcaption>{name}</figcaption>
    </figure>
  );
}

export function Work() {
  const grid = useRef<HTMLUListElement>(null);
  const flip = useFlipLayout(grid);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('todo');
  const [list, setList] = useState(false);
  const change = (fn: () => void) => flip.current?.change(() => flushSync(fn)) ?? fn();

  return (
    <section id="trabajos" className="section">
      <h2>Filtrar se anima solo</h2>
      <p className="lead">flip-layout mide el antes y el después; hover-distort deforma cada foto alrededor del cursor.</p>
      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f} className="btn btn-ghost" aria-pressed={filter === f} onClick={() => change(() => setFilter(f))}>{f}</button>
        ))}
        <button className="btn btn-ghost" aria-pressed={list} onClick={() => change(() => setList((v) => !v))}>{list ? 'grilla' : 'lista'}</button>
      </div>
      <ul ref={grid} className={`grid${list ? ' is-list' : ''}`}>
        {ITEMS.map((it) => (
          <li key={it.id} data-fx-flip hidden={filter !== 'todo' && filter !== it.kind}>
            <Tile id={it.id} name={it.name} />
          </li>
        ))}
      </ul>
    </section>
  );
}

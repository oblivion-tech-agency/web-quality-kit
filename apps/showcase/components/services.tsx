'use client';

import { useRef } from 'react';
import { useStackedCards } from '@oblivion/fx/effects/stacked-cards/react.ts';
import { useSplitReveal } from '@oblivion/fx/effects/split-reveal/react.ts';

const CARDS = [
  { tag: 'stacked-cards', title: 'Cada carta se queda', text: 'Queda fija mientras se lee y se achica cuando llega la siguiente.' },
  { tag: 'scroll + sticky', title: 'Y se acumulan', text: 'El sticky lo da el CSS: sin JS las cartas ya se apilan.' },
  { tag: '--fx-covered', title: 'El CSS decide el tono', text: 'El efecto escribe la escala y --fx-covered; el oscurecido lo pinta el CSS.' },
  { tag: 'reduced motion', title: 'Quietas si hace falta', text: 'Con reduced motion quedan en columna, sin escala ni sombra.' },
];

export function Services() {
  const stack = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useStackedCards(stack);
  useSplitReveal(title);
  return (
    <section id="servicios" className="section">
      <h2 ref={title} data-fx-split>Cartas que se apilan</h2>
      <div ref={stack} className="stack">
        {CARDS.map((c, i) => (
          <article key={c.title} data-fx-stack-card className="card" style={{ ['--i' as string]: i }}>
            <span className="scr">{c.tag}</span>
            <div><h3>{c.title}</h3><p className="muted" style={{ marginTop: 16, maxWidth: '40ch' }}>{c.text}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

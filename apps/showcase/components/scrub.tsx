'use client';

import { useRef } from 'react';
import { useVideoScrub } from '@oblivion/fx/effects/video-scrub/react.ts';

export function Scrub() {
  const section = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useVideoScrub(section, {
    range: [0.05, 0.95],
    onProgress: (p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
  });
  return (
    <section ref={section} className="scrub">
      <div className="scrub-stage">
        <div>
          <h2>El video sigue al scroll</h2>
          <p className="muted" style={{ marginTop: 20, maxWidth: '42ch' }}>
            video-scrub: un clip exportado con un keyframe por cuadro avanza mientras la sección está fijada.
          </p>
          <div className="scrub-bar"><div ref={bar} style={{ transform: 'scaleX(0)' }} /></div>
        </div>
        <video data-fx-video muted playsInline preload="auto" poster="/fx/speaker-scrub-poster.jpg" src="/fx/speaker-scrub.mp4" />
      </div>
    </section>
  );
}

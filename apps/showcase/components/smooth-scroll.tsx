'use client';

import { useEffect } from 'react';
import { createSmoothScroll } from '@oblivion/fx/effects/smooth-scroll/index.ts';

/** Lenis + ScrollTrigger para todo el sitio. Se monta una vez en el layout. */
export function SmoothScroll() {
  useEffect(() => createSmoothScroll(document.documentElement).destroy, []);
  return null;
}

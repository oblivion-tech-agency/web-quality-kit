/**
 * video-scrub — un video que avanza con el scroll mientras la sección está
 * fijada: el clip del producto, la obra que se arma, el recorrido de cámara.
 * Es la variante del reel "imagen de IA → video de IA": el clip se exporta con
 * un keyframe en cada cuadro para que saltar a cualquier tiempo sea instantáneo:
 *
 *   ffmpeg -i clip.mp4 -an -c:v libx264 -crf 24 -g 1 -pix_fmt yuv420p -movflags +faststart scrub.mp4
 *
 * Familia: scroll / 3D · Intensidad 3 · 0 deps · Firma posible.
 *
 *   <section data-fx-video-scrub class="h-[260svh]">
 *     <div class="sticky top-0 h-svh">
 *       <video data-fx-video muted playsinline preload="auto" poster="poster.webp" src="scrub.mp4"></video>
 *
 * Con muchos cuadros y poco peso conviene `scroll-sequence`; con un clip largo o
 * de cámara en movimiento, este.
 * Reduced motion: queda el cuadro de `stillAt` (en vivo).
 * destroy(): saca listeners y pausa el video en su primer cuadro.
 */

import { clamp01, createLoop, damp, motionSwitch, part, progress, type FxHandle } from '../../core/index.ts';

export interface VideoScrubOptions {
  video?: HTMLVideoElement | null;
  range?: [number, number];
  /** Fracción del clip que queda quieta con reduced motion. */
  stillAt?: number;
  onProgress?: (p: number) => void;
}

export function createVideoScrub(section: HTMLElement, options: VideoScrubOptions = {}): FxHandle {
  const video = options.video ?? part<HTMLVideoElement>(section, 'video');
  if (!video) return { destroy() {} };
  const [r0, r1] = options.range ?? [0, 1];
  const stillAt = options.stillAt ?? 0.5;
  video.pause();

  const seek = (p: number) => {
    if (!video.duration || Number.isNaN(video.duration)) return;
    video.currentTime = clamp01(p) * Math.max(0, video.duration - 0.05);
  };
  const whenReady = (cb: () => void) => {
    if (video.readyState >= 1) cb();
    else video.addEventListener('loadedmetadata', cb, { once: true });
  };

  const off = motionSwitch({
    full: () => {
      let target = 0;
      let value = 0;
      const read = () => {
        const r = section.getBoundingClientRect();
        target = progress(clamp01(-r.top / Math.max(1, r.height - window.innerHeight)), r0, r1);
      };
      const loop = createLoop((dt) => {
        value = damp(value, target, 0.002, dt);
        if (Math.abs(target - value) < 0.0005) value = target;
        seek(value);
        options.onProgress?.(value);
        return value !== target;
      });
      const kick = () => {
        read();
        loop.wake();
      };
      whenReady(() => {
        read();
        value = target;
        seek(value);
      });
      addEventListener('scroll', kick, { passive: true });
      addEventListener('resize', kick, { passive: true });
      return () => {
        removeEventListener('scroll', kick);
        removeEventListener('resize', kick);
        loop.stop();
      };
    },
    reduced: () => whenReady(() => seek(stillAt)),
  });

  return {
    destroy() {
      off();
      video.pause();
      if (video.readyState >= 1) video.currentTime = 0;
    },
  };
}

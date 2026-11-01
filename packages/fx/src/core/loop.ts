/**
 * Un loop de rAF que se puede prender y apagar, con `dt` en segundos (con tope
 * para que una pestaña que vuelve de segundo plano no dé un salto).
 * `tick` devuelve `false` para dormirse; `wake()` lo vuelve a prender.
 */
export interface Loop {
  wake(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop(tick: (dt: number, now: number) => boolean | void, maxDt = 0.1): Loop {
  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    const dt = last ? Math.min(maxDt, (now - last) / 1000) : 1 / 60;
    last = now;
    const keep = tick(dt, now);
    raf = keep === false ? 0 : requestAnimationFrame(frame);
  };
  return {
    wake() {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    get running() {
      return raf !== 0;
    },
  };
}

/**
 * Control de giro para un objeto en 360°: gira solo despacio, se arrastra con
 * el mouse o el dedo, sigue con inercia al soltar, retoma el giro solo después
 * de un rato quieto y responde a las flechas. No dibuja nada: llama a
 * `onTurn(vuelta)` y el host pinta (cuadros en `turntable.js`, Three.js en
 * `model-turntable.js`). Se copia junto con ellos.
 *
 * Contrato del catálogo:
 * - `destroy()` saca listeners, observer y el frame pendiente, y devuelve el
 *   elemento con sus atributos de antes.
 * - Con `prefers-reduced-motion` no gira solo ni tiene inercia.
 * - El elemento es un slider enfocable; ← → giran de a 15°.
 * - En touch el arrastre vertical sigue scrolleando la página (pan-y).
 * - Fuera de pantalla no hay rAF.
 */

/**
 * @param {{
 *   el: HTMLElement,
 *   input?: 'drag' | 'hover',
 *   auto?: boolean,
 *   turnSeconds?: number,
 *   start?: number,
 *   label?: string,
 *   onTurn: (turn: number) => void,
 * }} options
 *   `turnSeconds`: cuánto tarda una vuelta sola. `start`: fracción de vuelta
 *   inicial. `onTurn` recibe la fracción de vuelta (0–1) en cada frame en que
 *   cambia.
 * @returns {{ destroy(): void, readonly turn: number }}
 */
export function createSpinControl({
  el,
  input = 'drag',
  auto = true,
  turnSeconds = 14,
  start = 0,
  label = 'Producto en 360°: arrastrá o usá las flechas para girarlo',
  onTurn,
}) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoVel = auto && !reduce ? 1 / turnSeconds : 0; // vueltas por segundo

  let angle = start;
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let idleUntil = 0;
  let visible = false;
  let raf = 0;
  let last = 0;
  let deg = -1;

  const turn = () => ((angle % 1) + 1) % 1;
  const emit = () => {
    const t = turn();
    onTurn(t);
    const d = Math.round(t * 360) % 360;
    if (d !== deg) {
      deg = d;
      el.setAttribute('aria-valuenow', String(d));
    }
  };
  const moving = () => dragging || Math.abs(vel) > 1e-4 || autoVel > 0;
  const tick = (now) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
    last = now;
    if (!dragging) {
      // La inercia decae hacia el giro automático (o hacia quieto).
      const want = now > idleUntil ? autoVel : 0;
      vel += (want - vel) * (1 - Math.pow(0.05, dt));
      angle += vel * dt;
    }
    emit();
    raf = visible && moving() ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => {
    if (!raf && visible) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };

  // Un ancho del elemento arrastrado ≈ media vuelta.
  const perPx = () => 0.5 / Math.max(1, el.clientWidth);
  const onDown = (e) => {
    dragging = true;
    vel = 0;
    lastX = e.clientX;
    lastT = e.timeStamp;
    el.setPointerCapture?.(e.pointerId);
    kick();
  };
  const onMove = (e) => {
    const hover = input === 'hover' && e.pointerType === 'mouse';
    if (!dragging && !hover) return;
    if (hover && !dragging && !lastT) [lastX, lastT] = [e.clientX, e.timeStamp];
    const dx = e.clientX - lastX;
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    angle -= dx * perPx();
    vel = reduce ? 0 : vel * 0.6 + ((-dx * perPx()) / dt) * 0.4;
    lastX = e.clientX;
    lastT = e.timeStamp;
    idleUntil = performance.now() + 2500;
    emit();
    kick();
  };
  const onUp = () => {
    dragging = false;
    if (reduce) vel = 0;
    idleUntil = performance.now() + 2500;
  };
  const onLeave = (e) => {
    if (e.pointerType === 'mouse' && !dragging) lastT = 0;
  };
  const onKey = (e) => {
    const dir = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    angle += dir / 24;
    vel = 0;
    idleUntil = performance.now() + 4000;
    emit();
    kick();
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  });

  const prev = ['tabindex', 'role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow'].map((a) => [a, el.getAttribute(a)]);
  const prevTouch = el.style.touchAction;
  el.tabIndex = 0;
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-label', label);
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '359');
  el.style.touchAction = 'pan-y';

  emit();
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('keydown', onKey);
  io.observe(el);

  return {
    get turn() {
      return turn();
    },
    destroy() {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('keydown', onKey);
      io.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      for (const [a, v] of prev) v === null ? el.removeAttribute(a) : el.setAttribute(a, v);
      el.style.touchAction = prevTouch;
    },
  };
}

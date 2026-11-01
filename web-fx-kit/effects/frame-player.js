/**
 * Reproductor de secuencias de imágenes sobre un <canvas>: carga progresiva,
 * dibujo con devicePixelRatio y "el cuadro cargado más cercano" mientras falta
 * el pedido. No decide qué cuadro mostrar: eso lo hacen `scroll-sequence.js`
 * (con el scroll) y `turntable.js` (con el puntero o solo). Se copia junto con
 * ellos al proyecto.
 *
 * Contrato del catálogo:
 * - Sin literales de color: el canvas es transparente donde los cuadros lo son.
 * - Nada se descarga hasta que el elemento observado está a ~1 pantalla.
 * - La carga es progresiva (el primer cuadro, cada 8º, cada 4º, el resto).
 * - `destroy()` corta las cargas en vuelo, suelta las imágenes y saca el
 *   observer. El host saca sus propios listeners.
 */

/**
 * Orden de carga: primero el cuadro que se va a ver, después una pasada gruesa
 * para cubrir toda la secuencia y recién después el detalle.
 * @param {number} n @param {number} first
 */
export function loadOrder(n, first) {
  const seen = new Set([first]);
  const out = [first];
  for (const step of [8, 4, 1]) {
    for (let i = 0; i < n; i += step) if (!seen.has(i)) { seen.add(i); out.push(i); }
  }
  return out;
}

/** @param {string[] | { count: number, src: (i: number) => string }} frames */
export const frameUrls = (frames) =>
  Array.isArray(frames) ? frames.slice() : Array.from({ length: frames.count }, (_, i) => frames.src(i));

/**
 * @param {{ canvas: HTMLCanvasElement, urls: string[], fit?: 'contain' | 'cover', concurrency?: number }} options
 */
export function createFramePlayer({ canvas, urls, fit = 'contain', concurrency = 6 }) {
  const n = urls.length;
  const ctx = canvas.getContext('2d');
  /** @type {(HTMLImageElement | null)[]} */
  let imgs = new Array(n).fill(null);
  /** @type {Set<HTMLImageElement>} */
  const inFlight = new Set();
  /** @type {number[]} */
  let queue = [];
  /** @type {IntersectionObserver | null} */
  let io = null;
  let active = 0;
  let dead = false;
  let want = 0; // cuadro pedido
  let mix = 0; // fracción hacia el cuadro siguiente (fundido)
  let loop = false; // el siguiente del último es el primero
  let drawn = ''; // clave de lo pintado: cuadro + fundido

  const nearest = (i) => {
    if (imgs[i]) return i;
    for (let d = 1; d < n; d++) {
      if (i - d >= 0 && imgs[i - d]) return i - d;
      if (i + d < n && imgs[i + d]) return i + d;
    }
    return -1;
  };
  const paintImg = (img, alpha) => {
    const { width: W, height: H } = canvas;
    const s = (fit === 'cover' ? Math.max : Math.min)(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  };
  const draw = () => {
    if (!ctx) return;
    const i = nearest(want);
    // Sin ningún cuadro todavía no se limpia: queda lo que hubiera.
    if (i < 0) return;
    // Fundido solo si el pedido y su siguiente están cargados de verdad.
    const next = loop ? (i + 1) % n : i + 1;
    const f = i === want && mix > 0.02 && next < n && imgs[next] ? Math.round(mix * 32) / 32 : 0;
    const key = `${i}:${f}`;
    if (key === drawn) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // El cuadro base va opaco y el siguiente encima con alfa: el objeto nunca
    // se vuelve translúcido a mitad del fundido.
    paintImg(imgs[i], 1);
    if (f) paintImg(imgs[next], f);
    drawn = key;
  };
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w; // cambiar el tamaño limpia el canvas: hay que repintar
      canvas.height = h;
      drawn = '';
    }
    draw();
  };
  const pump = () => {
    while (!dead && active < concurrency && queue.length) {
      const i = /** @type {number} */ (queue.shift());
      const img = new Image();
      img.decoding = 'async';
      img.src = urls[i];
      inFlight.add(img);
      active++;
      img
        .decode()
        .then(() => {
          if (dead) return;
          imgs[i] = img;
          draw(); // si el nuevo queda más cerca del pedido, lo reemplaza
        })
        .catch(() => {}) // un cuadro roto no corta nada: se usa el vecino
        .finally(() => {
          inFlight.delete(img);
          active--;
          pump();
        });
    }
  };

  return {
    count: n,
    /**
     * Muestra una posición de la secuencia. Con decimales (`12.4`) funde el
     * cuadro 12 con el 13 al 40%: el giro se ve continuo aunque haya pocos
     * cuadros. `wrap`: la secuencia es un bucle (el siguiente del último es el 0).
     * @param {number} pos @param {boolean} [wrap]
     */
    show(pos, wrap = false) {
      loop = wrap;
      const p = wrap ? ((pos % n) + n) % n : Math.min(n - 1, Math.max(0, pos));
      want = Math.floor(p);
      mix = p - want;
      draw();
    },
    resize,
    /**
     * Empieza a cargar cuando `el` queda a ~1 pantalla de distancia.
     * @param {Element} el @param {() => number[]} order se evalúa al disparar
     */
    loadWhenNear(el, order) {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          queue = order();
          pump();
        },
        { rootMargin: '100% 0px' },
      );
      io.observe(el);
    },
    destroy() {
      dead = true;
      io?.disconnect();
      queue = [];
      // Vaciar el src corta la descarga en vuelo y libera el bitmap decodificado.
      for (const img of inFlight) img.src = '';
      for (const img of imgs) if (img) img.src = '';
      inFlight.clear();
      imgs = [];
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

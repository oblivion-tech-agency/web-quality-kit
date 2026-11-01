# Contrato de efectos de `@oblivion/fx`

Todo efecto del kit cumple esto. Lo verifican `packages/fx/test/contract.test.ts` y el review de cada PR.
Un efecto que no lo cumple no entra al catálogo, por más lindo que se vea.

## 1. Forma

```ts
// effects/<nombre>/index.ts — vanilla, sin React
export function createX(target: HTMLElement, options?: XOptions): XHandle; // XHandle extends FxHandle

// effects/<nombre>/react.ts — 'use client'
export function useX(ref: RefObject<HTMLElement | null>, options?: XOptions, deps?: DependencyList): RefObject<XHandle | null>;
```

- **Un elemento raíz y opciones.** Las partes internas se encuentran por atributo `data-fx-<parte>` dentro del
  raíz (`data-fx-canvas`, `data-fx-path`, `data-fx-pin-track`…) o se pasan en las opciones.
- **El handle siempre tiene `destroy()`**, y la API propia del efecto si la necesita (`set`, `setLight`, `refresh`,
  `observe`).
- **Nombres:** carpeta en kebab-case, `createX` y `useX` en PascalCase del nombre, atributos `data-fx-*`, clases
  `fx-*`, variables CSS `--fx-*`.
- **`meta.json`** con título, familia, intensidad (1 a 4), dependencias, rubros, `pairsWith`, `avoidWith` y si es firma
  posible. De ahí salen el registry y `docs/CATALOG.md`.

## 2. `destroy()` deja el DOM como estaba

Atributos, estilos inline, texto e hijos vuelven a su estado previo (`core/dom.ts → preserve()`); listeners,
observers, rAF, timers, imágenes y contextos WebGL se sueltan. Por eso los efectos sobreviven el doble montaje
de React StrictMode y los cambios de ruta. El test monta, destruye y compara `innerHTML` (dos veces seguidas).

## 3. Reduced motion, en vivo

Cada efecto declara sus dos ramas con `core/motion.ts → motionSwitch({ full, reduced })` (o `gsap.matchMedia()` en
los efectos con GSAP). Si la persona cambia la preferencia con la página abierta, el efecto cambia de rama.

La rama `reduced` no es "apagado": es **el estado final legible** (el recorrido dibujado, las fotos reveladas, un
cuadro quieto del producto). El contenido nunca depende del movimiento para leerse.

## 4. Tokens, nunca literales

Los efectos no traen colores, curvas ni duraciones propias. Leen `--fx-*` (`core/tokens.ts`), que el proyecto
mapea una vez a sus tokens:

```css
:root {
  --fx-ground: var(--color-ground);
  --fx-ink: var(--color-ink);
  --fx-muted: var(--color-ink-dim);
  --fx-accent: var(--color-accent);
  --fx-on-accent: var(--color-on-accent);
  --fx-rim: var(--color-accent);          /* contraluces del 3D */
  --fx-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --fx-duration: 900ms;
}
```

## 5. Primera pintura y carga

- **Sin JS el contenido se ve.** Lo que arranca oculto para animar su entrada se oculta solo bajo `.js` (clase que
  pone un script inline en `<head>`) y tiene una salida si el script falla.
- **El LCP es HTML o una imagen**, nunca un canvas. El canvas se monta encima, y la foto `data-fx-fallback` se ve
  hasta el primer render y vuelve si falla (sin WebGL, sin red).
- **Dependencias pesadas con carga diferida:** Three.js se importa con `import()` recién cuando el efecto está a una
  pantalla (`core/motion.ts → whenNear`). GSAP y Lenis entran en el bundle solo si el efecto los usa.
- **Fuera de pantalla no hay rAF** (`onVisibility`), y los loops se duermen cuando no hay nada que mover
  (`core/loop.ts → createLoop`).

## 6. Accesibilidad

- Lo que se controla con el puntero también se controla con el teclado (el turntable es un slider con ← →).
- El texto animado conserva su valor real para lectores de pantalla (split-flap, SplitText con `aria`).
- En touch, nada secuestra el scroll vertical (`touch-action: pan-y` en lo que se arrastra).

## 7. Presupuesto

- Código propio de un efecto: idealmente menos de 6 KB gz (el catálogo muestra el peso real).
- La pasada completa sobre una landing: LCP no empeora más de 10 %, INP < 200 ms, sin errores de consola, sin
  scroll horizontal a 375 px.

## 8. Cómo se suma un efecto

1. `packages/fx/src/effects/<nombre>/index.ts`, `react.ts` y `meta.json`.
2. Un caso en `test/contract.test.ts` (destroy dos veces, con y sin reduced motion).
3. Una sección en el showcase.
4. `pnpm test && pnpm build && pnpm registry` (regenera `registry/r/` y `docs/CATALOG.md`).

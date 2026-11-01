# Efectos de scroll resueltos en CSS

`effects/scroll-progress.js` mide y escribe `--p` (0 → 1). Todo lo de acá es CSS que lee esa variable:
sin JS extra por efecto, sin re-render, y el estado quieto de `prefers-reduced-motion` se define en el
mismo archivo con el valor por defecto de `var(--p, …)`.

Regla de uso: estos son efectos **secundarios**. Uno o dos por página, elegidos para que acompañen al
efecto firma del proyecto (ver `SIGNATURES.md`), nunca los cinco juntos.

## 1. Foto que se abre de recuadro a pantalla completa

Para un anuncio o un momento grande ("Incorporamos bitren", un lanzamiento, una obra terminada). La
sección es alta y fija su escenario; la foto arranca recortada y se abre en la primera mitad del pin.
Después entra el texto.

```html
<section data-progress="sticky" class="frame-expand">
  <div class="frame-expand-sticky">
    <div class="frame-expand-frame"><img …></div>
    <div class="frame-expand-copy">…</div>
  </div>
</section>
```

```css
.frame-expand { height: 230vh; }
.frame-expand-sticky { position: sticky; top: 0; height: 100svh; overflow: hidden; }
.frame-expand-frame {
  --e: min(1, calc(var(--p, 1) * 1.7));           /* se abre del todo al 59% del pin */
  position: absolute; inset: 0;
  clip-path: inset(calc((1 - var(--e)) * 14%) calc((1 - var(--e)) * 9%));
}
.frame-expand-frame img { scale: calc(1.15 - var(--e) * 0.15); }
.frame-expand-copy {
  --c: clamp(0, calc((var(--p, 1) - 0.38) * 3.2), 1);
  opacity: var(--c); translate: 0 calc((1 - var(--c)) * 40px);
}
@media (prefers-reduced-motion: reduce) {
  .frame-expand { height: auto; }
  .frame-expand-sticky { position: relative; }
}
```

## 2. Columnas que se mueven a distinta velocidad

Para una galería de fotos del sujeto (flota, platos, obras). Cada columna declara cuánto viaja con
`--k`; positivo baja, negativo sube. Con `data-progress="view"` el punto quieto es la mitad del cruce.

```html
<div data-progress="view" class="grid grid-cols-3">
  <ul class="parallax-col" style="--k: 60px">…</ul>
  <ul class="parallax-col" style="--k: -160px">…</ul>
  <ul class="parallax-col" style="--k: 20px">…</ul>
</div>
```

```css
.parallax-col { translate: 0 calc((var(--p, 0.5) - 0.5) * var(--k, 0px)); }
```

Más de ~200px de diferencia entre columnas se lee como roto, no como profundidad. En mobile dejá una
o dos columnas y bajá los `--k` a la mitad.

## 3. Tipografía que cambia de ancho o peso con el scroll

Necesita una familia **variable** con eje `wdth` o `wght` (si el proyecto no tiene una, este efecto no
va). El titular se estira o se comprime mientras cruza la pantalla: queda bien en una sola palabra
grande, mal en un párrafo.

```css
.axis-title {
  font-variation-settings: "wdth" calc(75 + var(--p, 1) * 50), "wght" calc(500 + var(--p, 1) * 300);
}
```

Reservá el ancho máximo (el título no puede empujar el layout mientras crece): `min-height` en el
contenedor y `white-space: nowrap` si es una palabra.

## 4. Scroll nativo con `animation-timeline`

Para reveals simples que no necesitan JS. Chrome y Safari lo soportan; Firefox todavía no. Se envuelve
en `@supports` y en el resto de los navegadores `scroll-progress.js` hace lo mismo.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .rise {
      animation: rise linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 35%;
    }
  }
}
@keyframes rise { from { opacity: 0; translate: 0 48px; } }
```

No mezcles los dos sistemas en el mismo elemento: o lo maneja `animation-timeline` o lo maneja `--p`.

## 5. Transiciones entre estados con View Transitions

Para un cambio de estado dentro de la página (filtrar la flota, cambiar de pestaña, abrir un caso)
donde hoy el contenido salta. El navegador anima el antes y el después.

```js
function swap(update) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  document.startViewTransition(update);
}
```

```css
.case-photo { view-transition-name: case-photo; }   /* un nombre único por elemento en pantalla */
::view-transition-group(case-photo) { animation-duration: 520ms; animation-timing-function: var(--ease-out-expo); }
```

Entre páginas de un sitio multipágina alcanza con `@view-transition { navigation: auto; }` en las dos.

## 6. Trazos que se dibujan solos

Tildes, subrayados, flechas, firmas. Con `pathLength="1"` el largo real no importa.

```html
<path class="draw" pathLength="1" d="…" />
```

```css
.draw { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 600ms var(--ease-out-expo) var(--d, 0ms); }
.revealed .draw, html:not(.js) .draw { stroke-dashoffset: 0; }
```

## 7. Ilustración propia del rubro, con estados

El ícono de librería no tiene identidad. Un SVG dibujado para el proyecto (el camión de la flota real,
la máquina del taller, el producto) sí, y se puede animar por partes. En Lehman, el camión gira las
ruedas y se mueve con la suspensión solo mientras viaja.

- El estado va en un atributo de un ancestro (`data-moving`) y el CSS anima las partes. El JS no
  toca los keyframes.
- Para rotar una pieza sobre su centro: un `<g transform="translate(cx cy)">` de afuera ubica y uno de
  adentro rota con `transform-origin: 0 0`. Sin eso la rueda gira alrededor de la esquina del SVG.
- Los colores del dibujo pueden ser propios del objeto (la lona azul, la cabina blanca), pero todo lo
  que es interfaz alrededor sale de tokens.

```css
.wheel { transform-origin: 0 0; }
[data-moving] .wheel { animation: spin 0.5s linear infinite; }
[data-moving] .body { animation: ride 0.42s ease-in-out infinite alternate; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ride { to { transform: translateY(-0.5px); } }
```

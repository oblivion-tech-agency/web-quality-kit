# Producto que gira

Tres módulos para mostrar un objeto desde todos lados:

- `effects/scroll-sequence.js`: una secuencia de imágenes en un `<canvas>` mientras la sección está fijada.
  El producto se muestra desde otro ángulo en cada capítulo, mientras cambian los titulares.
- `effects/turntable.js`: una vuelta de 360° hecha con cuadros, que gira sola y se arrastra.
- `effects/model-turntable.js`: el producto en 3D en vivo con Three.js desde un `.glb`. Es fluido a
  cualquier velocidad.

Los dos primeros usan `effects/frame-player.js` (carga y dibujo de cuadros). Los dos turntables usan
`effects/spin-control.js` (arrastre, inercia, teclado, giro automático). Se copian juntos al proyecto.

Ejemplos funcionando: `demo/index.html` (catálogo) y `demo/parlante/` (landing completa). El producto de
los dos sale de `demo/speaker/render.py` (Blender).

## Capítulos, no scrub

Con el cuadro atado al scroll (`scrub`), el giro avanza a la velocidad de cada persona. 72 cuadros en
400vh es un cuadro cada ~45 px: al scrollear despacio se ve a saltos, aunque el lerp suavice el tiempo.

El modo **capítulos** (`poses`) desacopla las dos cosas:
- el scroll solo elige el capítulo;
- el giro hasta la pose se reproduce a velocidad constante, con fundido entre cuadros vecinos;
- un scroll rápido que cruza dos capítulos encadena los dos giros sin saltar.

Renderizá sin pausas, con las poses en cuadros equidistantes y el ease en los keyframes de Blender: el
módulo reproduce lineal y se detiene en cada pose.

## Cuándo sí, cuándo no

**Sí**, cuando hay **un** objeto protagonista y verlo desde otro ángulo cuenta algo: un producto (parlante,
auricular, zapatilla, botella), una máquina, un vehículo, una pieza de hardware.

**No** cuando:
- No hay un objeto: un servicio, un equipo de gente, un software. Girar un ícono o un mockup es relleno.
- Hay muchos productos. Para un catálogo va `pinned-horizontal`; el giro es para uno solo.
- No hay cuadros buenos. Un giro con el fondo distinto al del sitio, luz que salta o cuadros borrosos se
  ve peor que una buena foto fija.
- El proyecto anterior del registro ya lo usó con la misma composición (ver `SIGNATURES.md`).

## Cómo obtener los cuadros

Fondo igual al `--color-ground` del sitio, o transparente (`.webp` con alfa). Sin sombra proyectada que se
corte en el borde del cuadro.

- **Render de Blender o Spline.** Cámara que orbita el modelo, o modelo que gira con la cámara quieta:
  60–120 cuadros en el recorrido. Es lo más limpio y la única forma de controlar la luz. Salida PNG con
  `Film > Transparent`. `demo/speaker/render.py` es un ejemplo completo, por línea de comandos.
- **Video de IA del producto girando** (Veo, Kling, Runway). Pedí "turntable, cámara fija, fondo liso, sin
  cortes" y revisá que la forma no cambie entre cuadros.
- **Mesa giratoria filmada.** El producto real sobre una base que gira, cámara en trípode y luz continua.

## Cuadros: PNG → WebP

El ffmpeg de Homebrew no trae `libwebp`. ffmpeg solo extrae los PNG y `cwebp` (`brew install webp`) los
convierte, con alfa.

```sh
# 1. Desde un video: extraer a fps fijo (ajustá fps para quedar en 60–120 cuadros).
#    Desde Blender no hace falta: renderizá PNG RGBA.
ffmpeg -i giro.mp4 -vf "fps=24" png/frame-%03d.png

# 2a. Desktop: ~1000 px de ancho, todos los cuadros
for f in png/frame-*.png; do cwebp -quiet -q 76 -alpha_q 80 -resize 960 0 "$f" -o "desktop/$(basename "$f" .png).webp"; done

# 2b. Mobile: 560 px y uno de cada dos cuadros, renumerados
i=0; for f in png/frame-*.png; do
  [ $((i % 2)) -eq 0 ] && cwebp -quiet -q 72 -alpha_q 75 -resize 560 0 "$f" -o "mobile/$(printf 'frame-%03d' $((i / 2 + 1))).webp"
  i=$((i + 1))
done
```

## Presupuesto

| Set | Desktop | Mobile |
|---|---|---|
| Tope de la receta | ≤ 4 MB | ≤ 2 MB |
| Capítulos del demo (`--mode chapters`) | 2,7 MB (72 × 960 px) | 0,6 MB (36 × 560 px) |
| Vuelta con cuadros (`--mode spin --turn 120`, no se publica en el demo) | 2,3 MB (120 × 720 px) | 1,1 MB (120 × 480 px) |
| `.glb` para `model-turntable` (`--mode glb`) | 1,5 MB | 1,5 MB |

Si te pasás, sacá cuadros antes que calidad: el fundido cubre los saltos. El set se elige una vez al montar:

```js
const mobile = window.matchMedia('(max-width: 767px)').matches;
const frames = mobile ? list('mobile', 36) : list('desktop', 72);
```

Ningún módulo descarga nada hasta que su sección está a una pantalla de distancia.

## Capítulos: marcado y uso

```html
<section id="giro" class="seq">
  <div class="seq-sticky">
    <canvas></canvas>
    <img data-seq-fallback src="/giro/desktop/frame-001.webp" alt="El parlante, de frente, en tela negra">
    <h2 data-chapter data-active>Un sonido que llena la sala</h2>
    <h2 data-chapter>Una luz que sigue los graves</h2>
    <h2 data-chapter>Tela de punta a punta</h2>
    <h2 data-chapter>Todo a mano, sin mirar</h2>
  </div>
</section>
```

```css
.seq { height: 220svh; }                              /* dos o tres pantallas de pin, no más */
.seq-sticky { position: sticky; top: 0; height: 100svh; overflow: hidden; }
html:not(.js) .seq canvas { display: none; }          /* sin JS se ve el <img> */
[data-seq-fallback][hidden] { display: none; }
[data-chapter] { opacity: 0; transition: opacity 500ms; }
[data-chapter][data-active] { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .seq { height: auto; }
  .seq-sticky { position: relative; }
}
```

```js
import { createScrollSequence } from './scroll-sequence.js'; // + frame-player.js al lado

const section = document.getElementById('giro');
const heads = [...section.querySelectorAll('[data-chapter]')];
createScrollSequence({
  section,
  canvas: section.querySelector('canvas'),
  frames,
  range: [0.02, 0.98],
  stops: [0, 0.25, 0.5, 0.75],   // dónde empieza cada capítulo en el pin
  poses: [0, 1 / 3, 2 / 3, 1],   // dónde queda la secuencia en cada uno
  duration: 2.4,                 // segundos para la secuencia entera
  onChapter: (ch) => heads.forEach((h, k) => h.toggleAttribute('data-active', k === ch)),
});
```

El `<img>` de fallback es el cuadro principal y lleva el texto alternativo del producto. El módulo lo oculta
con `hidden` al montar y pone `aria-hidden` en el canvas. Con reduced motion queda un solo cuadro
(`stillFrame`, por defecto el del medio).

## Girarlo a mano con cuadros: `turntable`

Una vuelta completa: cámara quieta, giro a velocidad constante y el último cuadro justo antes del primero.
Gira solo, se arrastra con el mouse o el dedo, sigue con inercia y retoma el giro solo a los 2,5 s. El
arrastre vertical en touch sigue scrolleando la página.

```js
import { createTurntable } from './turntable.js'; // + frame-player.js y spin-control.js
createTurntable({ canvas, frames: spinUrls, turnSeconds: 14 }); // input: 'hover' para girar al pasar el mouse
```

Entre cuadro y cuadro funde el siguiente, pero con giro automático lento se nota igual el pulso: 120
cuadros en 16 s son 7,5 ángulos por segundo. Sirve para arrastrar. Si el giro automático es protagonista,
usá `model-turntable`.

## Fluido de verdad: `model-turntable`

Un `.glb` dibujado con Three.js renderiza cada frame: fluido a cualquier velocidad, con arrastre e inercia.
Además pesa menos que los cuadros.

`render.py --mode glb` exporta el modelo. glTF no entiende nodos procedurales, así que antes de exportar:
- la tela se hornea como mapa de normales;
- las luces se hornean como texturas emisivas (Cycles), en WebP dentro del `.glb`;
- el logo se hornea en blanco, para que la página le ponga el color en vivo.

```js
const THREE = await import('three');                     // versión fija con un import map
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
const fx = createModelTurntable({ canvas, THREE, GLTFLoader, RoomEnvironment, url: '/speaker.glb', rim: css('--rim'), tilt: 24 });
fx.setLight(css('--accent'));                            // recolorea el aro y el logo desde un token
```

- `three` entra por parámetro, como en todo el kit: el proyecto elige la versión.
- Cargá Three.js recién cuando la sección está a una pantalla (IntersectionObserver).
- Dejá al lado una foto del producto con `data-model-fallback`: se ve hasta el primer render y vuelve si
  no hay WebGL o el `.glb` no carga.
- `tilt` vuelca el producto hacia la cámara: subilo si lo que importa está arriba (como el aro de luz).

## Escena y fotos

`render.py --mode scene-hero | scene-light | scene-controls | scene-fabric | scene-stereo` renderiza fotos
opacas en escena: piso negro que refleja, bruma, haz cenital y dos contraluces fríos.

- En una escena oscura no uses luces de área grandes: iluminan la bruma y se reflejan en el piso como
  cuadros blancos. Spots chicos con `volume_factor` en 0, salvo el haz.
- Con la vista "Standard", el borde de la imagen sale del color exacto del fondo del sitio. Medilo y pasalo
  al CSS: así la foto a sangre no deja un recuadro.

## Composición

- **Producto de un lado, titulares del otro.** Entre capítulos pueden alternar de lado. En mobile, producto
  arriba y titular abajo, sin alternar.
- **Cada capítulo es un ángulo con motivo.** De frente para presentar, girado para la forma, de costado para
  el perfil, primer plano para el material. Menos de una vuelta entera, y quieto mientras se lee el titular:
  en modo capítulos eso sale solo.
- **Un titular por capítulo, corto.** El objeto es el protagonista; el texto lo acompaña.
- **Nada más se mueve en la sección.** Sin parallax de fondo ni partículas alrededor: compiten con el giro.
- **Nada tapa un titular.** Si el producto va delante de tipografía grande (como en `demo/parlante/`), que
  no la cubra en tablet ni en celular: ahí van en filas separadas.

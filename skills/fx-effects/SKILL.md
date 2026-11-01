---
name: fx-effects
description: Catálogo de efectos visuales de alto impacto (WebGL, scroll, partículas, tipografía) y prompts por tipo de sitio. Es el puente entre el diagnóstico/tokens del quality-kit y la construcción visual real. Se activa automáticamente cuando rebuild-section necesita un efecto, o cuando el usuario pide un tratamiento visual específico.
---

# FX EFFECTS SKILL

Esta skill conecta los módulos de `web-fx-kit/` con el flujo de calidad del quality-kit.
No reimplementa nada — apunta a los archivos reales y explica cuándo usar cada uno.

## Efectos disponibles

Los módulos viven en `web-fx-kit/effects/`. Son ES modules sin build, sin framework,
sin dependencias obligatorias. Todos exponen `destroy()` y respetan `prefers-reduced-motion`.

| Módulo | Deps | Cuándo usarlo |
|---|---|---|
| `particles-morph.js` | three | Hero 3D con identidad. 8 geometrías interpoladas en GPU. Para landing de producto tech, estudio creativo. |
| `post-fx.js` | three | Bloom, aberración cromática, viñeta y grano sobre una escena Three.js existente. Complemento de `particles-morph`, no se usa solo. |
| `gradient-backdrop.js` | — | Fondo animado por shader, barato. Cuando el héroe necesita vida pero no justifica Three.js completo. |
| `smooth-scroll.js` | — | Scroll con lerp exponencial + parallax por atributo. El "peso cinematográfico" del scroll. |
| `text-reveal.js` | — | Split de texto y revelado escalonado al entrar en vista. Para títulos de sección y hero copy. |
| `magnetic.js` | — | Botones y cursor magnéticos. Micro-interacción de detalle, no el plato principal. |
| `image-displacement.js` | — | Transición entre dos imágenes con mapa de desplazamiento. Para portfolio, casos, galerías. |
| `scroll-narrative.js` | — | Escenografía fija + pasos con estado interpolados. Para storytelling largo, timelines, casos de estudio. |

### Scroll, estado y detalle (sin dependencias)

Salieron de Transporte Lehman o se sumaron para que no todos los sitios terminen con el mismo
hero de partículas. Mismo contrato: `createX(…)` devuelve `{ destroy() }`, respeta
`prefers-reduced-motion` y la primera pintura se lee sin JS.

| Módulo | Cuándo usarlo |
|---|---|
| `scroll-progress.js` | Motor: escribe `--p` (modos `exit`, `view`, `sticky`). Los efectos de `recipes/scroll-css.md` (foto que se abre, columnas con parallax, tipografía variable) lo usan y se resuelven en CSS. |
| `clip-reveal.js` | Fotos que suben con máscara mientras se asienta el zoom. El clip va en los hijos: un observer no dispara sobre un target recortado al 100%. |
| `count-up.js` | Cifras reales que suben al entrar en vista. No toca lo que ya está en pantalla al montar. |
| `route-draw.js` | **Firma posible.** Un trazo SVG que se dibuja con el scroll, con marcador orientado y paradas que se encienden. Rutas, ríos, cables, líneas de tiempo. |
| `scroll-sequence.js` | **Firma posible.** Producto que gira con el scroll: secuencia de imágenes en un canvas, titulares por capítulo. Usá el modo `chapters` (`poses`): el scroll elige el capítulo y el giro se reproduce solo; el modo `scrub` se ve a saltos con pocos cuadros. Solo cuando hay un objeto protagonista (producto, máquina, vehículo). Necesita `frame-player.js`. |
| `turntable.js` | Producto en 360° con cuadros (fundido entre vecinos): gira solo, se arrastra con inercia y responde a las flechas. Con giro automático lento se nota el pulso: si el giro es protagonista, usá `model-turntable`. Necesita `frame-player.js` y `spin-control.js`. |
| `model-turntable.js` | **Live thing posible.** Depende de `three` (por parámetro). El producto en 3D en vivo desde un `.glb` exportado de Blender: fluido a cualquier velocidad, con `setLight()` para recolorear su luz desde un token. Necesita `spin-control.js`. |
| `live-timeline.js` | **Firma posible.** Un proceso del sujeto simulado en bucle (viaje, pedido, etapa), pausado fuera de pantalla. Lo simulado se etiqueta como simulación. |
| `split-flap.js` | Valores cortos que cambian como un cartel de aeropuerto: destinos, estados, horarios. |
| `pinned-horizontal.js` | Galería horizontal que avanza con el scroll vertical. En mobile queda un carrusel nativo. |
| `cursor-label.js` | Etiqueta junto al puntero sobre lo que se abre ("Ver caso"). Solo puntero fino. |

En React/Next se montan con `react/use-fx.js` desde un único componente cliente de efectos.

### Elegí con la regla de firma

Antes de elegir módulos, leé `web-fx-kit/SIGNATURES.md`: **un** efecto firma derivado del sujeto,
como mucho **dos** secundarios, y una combinación que no repita la de otro proyecto del registro.
Al publicar, sumá la fila del proyecto. Sin esto, cada sitio nuevo se parece al anterior.

### Conflicto conocido

`scroll-narrative` y `smooth-scroll` juntos: el modo `transform` del segundo rompe
`position: sticky`. Si usás los dos, la escenografía va fuera del contenedor de scroll
y `scroll-narrative` se configura con `pin: 'external'`.

## Wrappers React

En `web-fx-kit/react/`. Envuelven los módulos de `effects/` sin reimplementar.
Si el proyecto usa React/Next.js, usá estos en vez de los módulos crudos.

- `ParticlesMorph.jsx` — recibe `three` por prop, no lo importa
- `GradientBackdrop.jsx`
- `ImageDisplacement.jsx`
- `NarrativeSection.jsx`
- `hooks.js` / `use-fx.js` — hooks compartidos para manejo de ciclo de vida

**Regla clave:** `three` se pasa por prop para no fijar versión ni duplicar en el bundle.
Todo archivo empieza con `'use client'`. Los canvas se crean internamente con
`mountOnFreshCanvas` para sobrevivir StrictMode.

## Prompts por tipo de sitio

En `web-fx-kit/prompts/`. Son plantillas de prompt completas con estructura, referencias,
anti-referencias y restricciones técnicas. **Siempre** requieren `DESIGN.md` en contexto primero.

| Prompt | Tipo de sitio |
|---|---|
| `01-hero-particulas.md` | Landing tech con hero 3D (usa `particles-morph` + `post-fx`) |
| `02-editorial-cinematografico.md` | Revista/editorial, scroll largo, multimedia |
| `03-portfolio-estudio.md` | Portfolio de estudio creativo o agencia |
| `04-scroll-narrativo.md` | Storytelling secuencial (usa `scroll-narrative`) |
| `05-auditoria-visual.md` | Upgrade visual de algo existente (no genera, critica) |
| `06-integrar-componente.md` | Meter un componente de catálogo (21st.dev, ThreeUI, Aceternity) |
| `07-dashboard-instrumento.md` | Panel oscuro, denso en datos, con viz en vivo |

## Recipes (referencia, no se invocan)

En `web-fx-kit/recipes/`. Consultá cuando necesites resolver un problema de integración:

- `scroll-css.md` — foto que se abre, parallax por columnas, tipografía variable, `animation-timeline`, View Transitions, trazos e ilustraciones propias con estados
- `producto-que-gira.md` — `scroll-sequence`, `turntable` y `model-turntable`: de dónde salen los cuadros y el `.glb` (Blender, Spline, video de IA, mesa giratoria), PNG → WebP, presupuesto y composición
- `performance.md` — cómo no matar el sitio con el fondo WebGL
- `stack-y-deploy.md` — HTML vs Astro vs Next+R3F, y dónde publicar
- `react.md` — StrictMode, SSR, presupuesto real de un efecto en React/Next
- `librerias-de-componentes.md` — Motion, 21st.dev y la skill UI UX Pro Max: instalación, peso y dónde entra cada una en el flujo del kit
- `flujo-con-ia.md` — orden completo de la idea al deploy

## Assets pipeline (referencia)

En `web-fx-kit/assets-pipeline/`. Guías para generar assets con IA:

- `imagen.md` — Midjourney, Flux, Higgsfield, Nano Banana → `.avif`
- `video.md` — Veo, Sora, Kling, Runway → `.webm` < 3 MB
- `modelos-3d.md` — Meshy, Tripo, Rodin → `.glb` con Draco

## Cómo integrar un efecto en una sección

1. Leé `DESIGN.md` del proyecto — los colores y la curva de easing salen de ahí.
2. Elegí el módulo que corresponde de la tabla de arriba.
3. Si es React/Next, usá el wrapper de `react/`. Si es HTML/Astro, el módulo crudo de `effects/`.
4. Copiá el módulo al proyecto (no lo importes desde el kit — son autocontenidos por diseño).
5. Pasá los tokens del proyecto como opciones: `colors`, `speed`, `easing`.
6. Verificá con el checklist de `DESIGN.md` sección 9 y el presupuesto de performance (sección 5).

## Reglas duras (heredadas de web-fx-kit)

- **Cero literales de color en los componentes.** Todo sale de una variable CSS.
- **Un archivo por efecto.** Si crece más de ~250 líneas, se parte.
- **Todo efecto expone `destroy()`.** Sin eso hay fugas de memoria en cualquier SPA.
- **Todo efecto respeta `prefers-reduced-motion`.**
- **Ningún efecto es obligatorio para leer el contenido.** Si WebGL falla, la página sigue.
- **No agregues dependencia sin decirlo.** Three.js ya está; GSAP, Lenis, Framer Motion se discuten antes, con el peso en KB sobre la mesa.

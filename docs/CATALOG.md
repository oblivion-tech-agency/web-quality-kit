# Catálogo de efectos

> Generado por `scripts/build-registry.mjs` desde los `meta.json` de cada efecto. No editar a mano.

Instalar en un proyecto Next.js: `npx shadcn add https://raw.githubusercontent.com/oblivion-tech-agency/web-quality-kit/main/registry/r/<efecto>.json` (se copia a `components/fx/`).
Intensidad: ● sutil · ●● editorial · ●●● alto impacto · ●●●● show. El peso es del código propio, gzip.

## Texto

| Efecto | Qué es | Intensidad | Peso | Rubros | Combina con | Evitar con |
|---|---|---|---|---|---|---|
| `count-up` | Cifras que suben | ●○○○ | 3.9 KB | industria, logística, saas, institucional | route-draw, live-timeline | – |
| `split-flap` | Cartel de aeropuerto | ●●○○ | 4.2 KB | logística, transporte, eventos, turismo | live-timeline, count-up | scramble |

## Imagen

| Efecto | Qué es | Intensidad | Peso | Rubros | Combina con | Evitar con |
|---|---|---|---|---|---|---|
| `clip-reveal` | Revelado con máscara | ●○○○ | 3.6 KB | portfolio, editorial, inmobiliaria, gastronomía | split-reveal, smooth-scroll | – |

## Scroll

| Efecto | Qué es | Intensidad | Peso | Rubros | Combina con | Evitar con |
|---|---|---|---|---|---|---|
| `pinned-horizontal` | Galería horizontal fijada | ●●○○ | 4.4 KB | portfolio, flota, colección, menú | cursor-label, clip-reveal | stacked-cards |
| `route-draw` | Recorrido que se dibuja · **firma posible** | ●●●○ | 4.5 KB | logística, turismo, energía, historia de marca | count-up, live-timeline | scroll-sequence |
| `scroll-progress` | Avance de scroll en CSS | ●○○○ | 3.9 KB | todos | * | – |

## 3d

| Efecto | Qué es | Intensidad | Peso | Rubros | Combina con | Evitar con |
|---|---|---|---|---|---|---|
| `model-turntable` | Producto en 3D en vivo · **firma posible** | ●●●○ | 6.5 KB + three ≈ 160 KB gz (carga diferida) | producto físico, hardware, ecommerce | scroll-sequence, count-up | turntable |
| `scroll-sequence` | Producto que gira con el scroll · **firma posible** | ●●●● | 5.9 KB | producto físico, hardware, vehículos, maquinaria | model-turntable, count-up | route-draw, video-scrub |
| `turntable` | 360° con cuadros | ●●○○ | 6.4 KB | producto físico, ecommerce | scroll-sequence | model-turntable |

## Interacción

| Efecto | Qué es | Intensidad | Peso | Rubros | Combina con | Evitar con |
|---|---|---|---|---|---|---|
| `cursor-label` | Etiqueta junto al puntero | ●●○○ | 4 KB | portfolio, estudio, catálogo | pinned-horizontal, clip-reveal | magnetic |
| `live-timeline` | Proceso en vivo (simulado) · **firma posible** | ●●○○ | 4 KB | logística, industria, saas | split-flap, route-draw | – |


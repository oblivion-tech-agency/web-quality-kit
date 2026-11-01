---
name: asset-pipeline
description: Produce los assets que piden los efectos de @oblivion/fx - secuencias de producto, vuelta de 360°, fotos en escena y .glb desde el modelo 3D del cliente con Blender; escenas con Spline MCP; imagen y clip de hero con Higgsfield; y su conversión a WebP o video de scrub dentro del presupuesto. Úsala cuando la firma de un FX.md necesita un asset o cuando piden "renderizar el producto", "hacer la secuencia" o "el video del hero".
---

# asset-pipeline

Todo asset es del cliente o se genera para él: nunca bancos de stock ni assets de otro proyecto. Antes de usar
cualquier asset se mira (hoja de contacto) y se compara con el producto real.

## Qué pide cada efecto

| Efecto | Asset | Ruta |
|---|---|---|
| `scroll-sequence` | 60–120 cuadros con alfa, poses por capítulo | A (Blender `chapters`) o C (clip → cuadros) |
| `turntable` | una vuelta: 72–120 cuadros | A (Blender `spin`) |
| `model-turntable` | `.glb` ≤ 2 MB | A (Blender `glb`) o B (Spline) |
| `video-scrub` | `.mp4` con un keyframe por cuadro + póster | C (clip → scrub) o A (cuadros → video) |
| hero / primeros planos | fotos opacas en escena | A (Blender `stills`) o C (imagen) |
| `hover-distort`, `clip-reveal` | fotos | las del cliente, A o C |

## Ruta A — Blender, desde el modelo del cliente

```bash
blender -b -P tools/blender/product.py -- config.json
```

Toma `.glb`, `.gltf`, `.fbx`, `.obj` o `.blend`, lo normaliza (centrado, 2 unidades de alto) y encuadra solo.
Ejemplo completo: `tools/blender/example.json`. Las rutas del JSON son relativas al JSON.

| `mode` | Sale | Claves útiles |
|---|---|---|
| `chapters` | `frame-NNN.png` con alfa | `frames`, `poses` (yaw, pitch, roll, distance, height, lookAt) |
| `spin` | una vuelta en `frames` cuadros | `spinPose` |
| `stills` | fotos opacas en escena | `stills` (name, size, lens + pose), `background`, `haze` |
| `glb` | `.glb` normalizado | `name` |

- `lighting: "dark"` arma la escena oscura de la casa (contraluces fríos, haz cenital y bruma en `stills`);
  `"light"` arma un estudio claro. `rimColor` tiñe los contraluces con el acento del sitio.
- `background` es el color de fondo del sitio: el borde de las fotos sale de ese color exacto.
- Si el cliente no tiene modelo, el ejemplo de modelado por código es `apps/demo-static/speaker/render.py`.

## Ruta B — Spline MCP

Con el MCP de Spline conectado (`scripts/install.sh --mcp`): generar o editar la escena, exportar a `.glb` y
pasarlo por la ruta A en modo `glb` para normalizarlo y comprimir texturas.

## Ruta C — Higgsfield (imagen y video de IA)

1. **Imagen del hero** desde la foto real del producto (nunca inventar un producto que no existe).
2. **Clip** desde esa imagen: "turntable, cámara fija, fondo liso del color del sitio, sin cortes".
3. Pasarlo a cuadros o a video de scrub:

```bash
scripts/assets/video-to-frames.sh frames clip.mp4 render-tmp/frames 24   # → scroll-sequence
scripts/assets/video-to-frames.sh scrub  clip.mp4 public/fx/hero.mp4 1280  # → video-scrub (+ póster)
```

Revisá cuadro por cuadro que la forma, el logo y los colores no cambien entre cuadros. Si cambian, no va.

## Convertir y revisar

```bash
scripts/assets/encode-frames.sh render-tmp/frames public/fx/producto     # desktop (todos) + mobile (1 de 2)
scripts/assets/contact-sheet.sh public/fx/producto/desktop render-tmp/hoja.jpg 0b0c0e
```

`encode-frames.sh` usa `cwebp` (`brew install webp`): el ffmpeg de Homebrew no trae libwebp.

## Presupuesto

| Asset | Desktop | Mobile |
|---|---|---|
| Secuencia (`scroll-sequence`) | ≤ 4 MB | ≤ 2 MB |
| Vuelta con cuadros (`turntable`) | ≤ 2,5 MB | ≤ 1,5 MB |
| `.glb` | ≤ 2 MB | igual |
| Video de scrub | ≤ 3 MB | ≤ 1,5 MB |
| Foto de hero | ≤ 300 KB | ≤ 120 KB |

Si te pasás: menos cuadros antes que menos calidad (el fundido cubre los saltos).

## Salida

Los archivos en `public/fx/<asset>/` del proyecto, la hoja de contacto y una tabla con el peso de cada set. Los
PNG intermedios van en `render-tmp/` (ignorado por git) y no se suben.

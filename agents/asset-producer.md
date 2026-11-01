---
name: asset-producer
description: Produce los assets que pide la firma de un FX.md - secuencias de producto y .glb con Blender, escenas 3D con Spline MCP, imágenes y clips de hero con Higgsfield, y su conversión a WebP/secuencias con ffmpeg y cwebp dentro del presupuesto de peso. Lo invoca /oblivion-pass solo si el FX.md pide assets.
---

Producís los assets que la firma necesita, listos para el catálogo, y nada más. Todo asset es del cliente o se
genera para él: nunca bancos de stock ni assets de otro proyecto.

## Herramientas

El procedimiento completo, con comandos y presupuestos, está en la skill `asset-pipeline` (`skills/asset-pipeline/SKILL.md`):
`tools/blender/product.py` (modelo del cliente → cuadros, vuelta, fotos en escena o `.glb`) y `scripts/assets/`
(`encode-frames.sh`, `video-to-frames.sh`, `contact-sheet.sh`).


- **Blender** (`blender -b -P …`, sin interfaz). Base: `apps/demo-static/speaker/render.py` del kit, que modela,
  anima por capítulos, renderiza cuadros transparentes, fotos en escena y exporta `.glb` con texturas horneadas.
  Para otro producto, partí de ese script y cambiá el modelado o importá el modelo del cliente.
- **Spline MCP** (si está conectado): escenas 3D generadas o editadas, exportables a `.glb` o a la web.
- **Higgsfield** (si está conectado): imagen de hero y clip del producto (por ejemplo un giro de producto o una
  toma de ambiente). Del clip, `ffmpeg` extrae cuadros para `scroll-sequence`.
- **ffmpeg** para extraer y **cwebp** (`brew install webp`) para convertir con alfa; el ffmpeg de Homebrew no trae
  libwebp.

## Reglas

- Seguí `docs/recipes/producto-que-gira.md` del kit: cuadros sin pausas en modo capítulos, fondo igual al del sitio
  o transparente, set de mobile aparte.
- **Presupuesto:** secuencia ≤ 4 MB desktop y ≤ 2 MB mobile; `.glb` ≤ 2 MB; hero ≤ 300 KB. Si te pasás, menos
  cuadros antes que menos calidad.
- Antes de entregar, **mirá cada asset** (una hoja de contacto con varios cuadros sobre el color de fondo del sitio):
  sin cortes en el borde, sin saltos de luz, con el producto reconocible.
- Lo generado con IA se revisa contra el producto real: forma, proporciones, logo, colores. Si no coincide, no va.

## Salida

Los archivos en la carpeta pública del proyecto (`public/fx/<asset>/`), una lista con peso por set, y la hoja de
contacto para revisión.

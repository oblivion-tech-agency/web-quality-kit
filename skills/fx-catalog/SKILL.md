---
name: fx-catalog
description: Catálogo de efectos de alto impacto de Oblivion (@oblivion/fx): cómo elegir una firma y sus secundarios sin repetir otros proyectos, e instalarlos en un proyecto Next.js con su contrato (reduced motion, tokens, destroy). Se usa desde /oblivion-pass y /rebuild-section, o cuando alguien pide un efecto de scroll, 3D, tipografía animada o interacción.
---

# fx-catalog

El catálogo vive en el repo `web-quality-kit`:

| Qué | Dónde |
|---|---|
| Lista de efectos (generada) | `docs/CATALOG.md` |
| Contrato que cumple todo efecto | `docs/CONTRACT.md` |
| Registro de firmas por proyecto | `docs/SIGNATURES.md` |
| Código fuente (TypeScript) | `packages/fx/src/effects/<efecto>/` (`index.ts` vanilla, `react.ts` hook, `meta.json`) |
| Registry para `npx shadcn add` | `registry/r/<efecto>.json` |
| Recetas | `docs/recipes/` |
| Demos funcionando | `apps/demo-static/` (sin build) |

## 1. Elegir: una firma, hasta dos secundarios, una base

1. **La idea primero.** Antes de mirar el catálogo, escribí: "en esta página, **[algo propio del cliente]** se vuelve
   **[un recurso]**". La firma sale de ahí: lo que el cliente hace, mueve, fabrica o recorre. Si el efecto se podría
   usar igual en el sitio de un competidor, no es firma.
2. **Intensidad**, acordada con el cliente: ● sutil · ●● editorial · ●●● alto impacto · ●●●● show. La firma puede
   estar un punto arriba del resto; nada más.
3. **Firma:** un efecto marcado "firma posible" en `docs/CATALOG.md` (o una combinación de módulos que funcione como
   uno). Ocupa una sección entera y es lo que alguien recordaría del sitio.
4. **Secundarios (0 a 2):** de otra familia que la firma, respetando `pairsWith` / `avoidWith`.
5. **Base (no cuenta como secundario):** entradas por sección (reveals), microinteracciones de botones y links, y, si la
   intensidad lo pide, smooth scroll.
6. **Chequeo contra `docs/SIGNATURES.md`:** la firma y el par de secundarios no se repiten con otro proyecto. Si se
   reusa un módulo que fue firma de otro, cambian el sujeto, la composición y la personalidad del movimiento.

Variedad: mirá las familias (texto, imagen, scroll, 3D, interacción, transiciones, fondo). Dos proyectos seguidos no
abren con la misma familia de firma.

## 2. Instalar en un proyecto Next.js

```bash
npx shadcn add https://raw.githubusercontent.com/oblivion-tech-agency/web-quality-kit/main/registry/r/<efecto>.json
```

Copia el efecto y su núcleo (`fx-core`) a `components/fx/` e instala sus dependencias (por ejemplo `three`). El código
queda en el proyecto: se puede ajustar, pero si el cambio sirve para todos, va de vuelta al kit.

1. **Tokens una sola vez** en el CSS global (ver `docs/CONTRACT.md` §4): `--fx-ground`, `--fx-ink`, `--fx-muted`,
   `--fx-accent`, `--fx-on-accent`, `--fx-rim`, `--fx-ease`, `--fx-duration`, mapeados a los tokens del proyecto.
2. **Las secciones siguen siendo Server Components.** Solo declaran atributos `data-fx-*` y su marcado. Los hooks
   (`useX(ref, options)`) viven en componentes cliente chicos, uno por sección que lo necesite.
3. **Script `.js` en `<head>`** para que lo que arranca oculto se oculte solo con JS:
   `<script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />`.
4. **Fallbacks:** todo canvas lleva una imagen `data-fx-fallback` con su `alt`; el LCP es esa imagen o HTML.

## 3. Verificar

- `prefers-reduced-motion: reduce` emulado: el contenido se lee completo y quieto.
- Sin errores de consola, sin scroll horizontal a 375 px, nada tapa un titular.
- Montar y desmontar la página (cambio de ruta) no deja restos.
- Peso: el catálogo muestra el de cada efecto; Three.js se carga diferido.

## Reglas duras

- **Cero literales de color** en efectos: todo sale de `--fx-*`.
- **Un efecto, una carpeta**, con `index.ts`, `react.ts` y `meta.json`. Si crece más de ~250 líneas, se parte.
- **Todo efecto cumple `docs/CONTRACT.md`** y tiene su caso en `packages/fx/test/contract.test.ts`.
- **Nada es obligatorio para leer el contenido.** Si WebGL o el CDN fallan, la página sigue.
- **No se suma una dependencia sin decirlo**, con su peso en KB. Las del kit: GSAP + Lenis (movimiento) y Three.js (3D).
- **Un efecto nuevo** se agrega al kit, no a un proyecto suelto: `pnpm test && pnpm build && pnpm registry`.

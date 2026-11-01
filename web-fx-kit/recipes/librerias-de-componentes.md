# Librerías y componentes: Motion, 21st.dev y UI UX Pro Max

El flujo que circula en redes para "armar sitios profesionales con Claude" es: instalar Claude Code, sumar
**Motion** para animación, la skill **UI UX Pro Max** para decisiones de diseño, y copiar componentes de
**21st.dev**. Las tres piezas sirven, pero ninguna reemplaza al kit: aportan material, y el kit decide
qué entra (idea y firma en `DESIGN.md` y `SIGNATURES.md`, tokens, gates de calidad).

Datos verificados en las fuentes oficiales el 2026-11-01. Antes de instalar, revisá que sigan vigentes.

## Dónde entra cada una en el flujo del kit

```
1. DESIGN.md (idea, live thing, firma)  ← UI UX Pro Max propone estilo, paleta y tipografía si no hay marca
2. /audit-landing, /design-tokens       ← los tokens del kit mandan; lo de UI UX Pro Max se vuelca acá
3. /rebuild-section                     ← 21st.dev aporta la estructura de un componente; fx-effects la firma
4. Motion                               ← Motion o los módulos de web-fx-kit/effects, no los dos para lo mismo
5. Gates (taste lint/inspect, impeccable critique)  ← todo lo copiado pasa por acá igual que lo propio
```

## UI UX Pro Max (skill)

Base de datos de diseño con un buscador en Python: 79 estilos de UI (50 activos), 192 paletas por tipo de
producto, 74 pares tipográficos con imports de Google Fonts, 25 tipos de gráfico, 22 stacks y 119 guías de
UX. MIT. Repo: <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>.

```sh
# Opción A: dentro de Claude Code
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill

# Opción B: CLI (el paquete viejo `uipro-cli` está desactualizado, no lo uses)
npm install -g ui-ux-pro-max-cli
uipro init --ai claude            # en el proyecto actual
uipro init --ai claude --global   # en ~/.claude/skills/
```

Necesita Python 3 (solo biblioteca estándar, sin red). Se activa sola cuando pedís trabajo de UI.

**Cómo usarla con el kit:** para el *punto de partida* de un proyecto sin marca (rubro → estilo, paleta,
fuentes). Lo que propone se copia como tokens al front matter de `DESIGN.md` y desde ahí sigue el flujo
normal. No la uses para pisar una marca existente ni para saltear la idea: un estilo de catálogo
("glassmorphism", "bento grid") no es una idea, y sin idea `taste-skill` lo marca como plantilla.

## Motion (librería de animación)

La ex Framer Motion. Tiene API para React (`motion/react`) y para JavaScript sin framework (`motion`).

```sh
npm install motion
```

```js
import { motion } from 'motion/react';            // React 18.2+
import { animate, inView, scroll } from 'motion'; // vanilla
```

Sin build (HTML, Astro sin islas), por ESM desde jsDelivr con **versión fija**:

```js
const { animate, inView, stagger } = await import('https://cdn.jsdelivr.net/npm/motion@14.3.0/+esm');
```

Peso según la documentación (Rollup; Webpack da un poco más):

| Qué | Peso |
|---|---|
| `animate()` vanilla mini | 3,2 KB |
| `inView` | 0,5 KB |
| `scroll()` | 3,8 KB |
| `<motion.div>` en React, completo | 43 KB (no se reduce con tree-shaking) |
| `m` + `LazyMotion` | ~5 KB inicial, + 24 KB `domAnimation` o + 38 KB `domMax` |

**Reglas del kit para Motion:**
- Es una dependencia: se anota en el `DESIGN.md` con su peso. En React, `m` + `LazyMotion` antes que
  `motion` completo.
- Reduced motion: en React, `<MotionConfig reducedMotion="user">` en la raíz (desactiva transforms y layout,
  deja opacidad). En vanilla no es automático: chequeá `matchMedia('(prefers-reduced-motion: reduce)')`.
- Si algo arranca oculto para animar su entrada, que se vea igual si Motion no carga (CDN caído, bloqueador):
  ocultá solo con `.js` y destrabá con un failsafe. Ejemplo en `demo/parlante/index.html`.
- Motion para entradas, reveals y gestos. Para efectos firma con estado (`scroll-sequence`, `route-draw`,
  `turntable`…) van los módulos de `effects/`: no mezcles los dos sobre el mismo elemento.
- Easing y duración salen del `DESIGN.md` (`--ease-out-expo` del kit = `[0.16, 1, 0.3, 1]`).

## 21st.dev (componentes)

Registro de componentes React + TypeScript + Tailwind, compatibles con shadcn/ui. El código se copia al
repo (no queda dependencia de ellos). Tres formas de traerlos:

1. **Copy prompt** en la página del componente y pegarlo en Claude Code: el agente lo reconstruye en tu stack.
2. **shadcn CLI** con la URL de registro que muestra cada componente (`npx shadcn@latest add "<url>"`).
3. **MCP de 21st** (ex "Magic MCP"): `npx @21st-dev/cli@latest init --client claude` imprime la config
   (con `--write` la escribe); la API key se crea en <https://21st.dev/mcp>.

Plan gratis: 2 copias por día. **Licencia:** el sitio no declara una licencia general; mirá la página del
componente o del autor antes de usarlo en un trabajo de cliente.

**Reglas del kit para lo que venga de 21st.dev:**
- Es **estructura**, no diseño: al pegarlo, cambiá colores, radios, sombras y fuentes por los tokens del
  proyecto. Cero literales de color también en lo copiado.
- Muchos traen Motion o efectos propios (gradientes animados, partículas, "spotlight"). Contalos contra la
  regla de firma: si el componente ya trae un efecto llamativo, ese efecto ocupa un lugar de secundario.
- Sacá lo que no se usa (variantes, props, dependencias). Un componente de catálogo pegado tal cual es la
  forma más rápida de que el sitio tenga cara de plantilla.
- Solo React. En HTML puro, Astro sin islas o el demo de este kit, no aplica: usá `effects/`.

## Ejemplo completo

`web-fx-kit/demo/parlante/` es una landing armada con este criterio: firma `scroll-sequence` (el parlante
girando por capítulos), secundarios `turntable` y `count-up`, Motion vanilla para la entrada del hero y
los reveals, y un failsafe para cuando el CDN no responde. El producto sale de `demo/speaker/render.py`.

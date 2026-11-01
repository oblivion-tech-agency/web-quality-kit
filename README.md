# Oblivion FX Kit

El kit con el que Oblivion lleva un sitio de "funcional" a "deslumbra en el primer scroll". Tiene dos mitades:

1. **Calidad:** skills de Claude Code para auditar, consolidar tokens y reconstruir secciones con verificación visual.
2. **Alto impacto:** `@oblivion/fx`, un catálogo de efectos (scroll, 3D, tipografía, interacción) con un contrato
   común, instalable en cualquier proyecto Next.js con `npx shadcn add`, y las reglas para elegirlos sin que
   todos los sitios terminen pareciéndose.

Nace de aplicarlo en serio sobre proyectos reales (Oblivion Tech, Transporte Lehman), no de teoría.

## Instalación

Este repo es la fuente de verdad. Las skills propias se symlinkean a `~/.claude/skills/`:

```bash
for skill in audit-landing design-tokens rebuild-section motion-design fx-catalog; do
  ln -sfn "$(pwd)/skills/$skill" "$HOME/.claude/skills/$skill"
done
```

Para trabajar en el catálogo:

```bash
pnpm install
pnpm test        # contrato de cada efecto (destroy, reduced motion, StrictMode)
pnpm build       # compila packages/fx a dist/ (lo usan los demos sin build)
pnpm registry    # regenera registry/r/ y docs/CATALOG.md desde los meta.json
pnpm check:docs  # toda ruta citada en la documentación existe
```

Demos: `python3 -m http.server 4877` en la raíz y abrir `/apps/demo-static/` (catálogo) y
`/apps/demo-static/parlante/` (landing completa de ejemplo). Necesitan `pnpm build` antes.

Copiá también `templates/DESIGN.md.template` a la raíz de cada proyecto nuevo como `DESIGN.md`.

## El catálogo: `@oblivion/fx`

| Qué | Dónde |
|---|---|
| Efectos disponibles, por familia e intensidad (generado) | `docs/CATALOG.md` |
| Contrato de todo efecto | `docs/CONTRACT.md` |
| Firmas usadas por proyecto (leer antes de elegir) | `docs/SIGNATURES.md` |
| Código fuente en TypeScript | `packages/fx/src/` (`core/`, `lib/`, `effects/<efecto>/`) |
| Tests del contrato | `packages/fx/test/` |
| Registry para shadcn | `registry/r/` |
| Recetas | `docs/recipes/` |
| Demos sin build y pipeline de Blender | `apps/demo-static/` |

Cada efecto es `createX(elemento, opciones)` en vanilla y `useX(ref, opciones)` en React. Todos:
- dejan el DOM como estaba al destruirse (sobreviven StrictMode);
- respetan reduced motion en vivo, con un estado final legible;
- leen colores y curvas de tokens `--fx-*`;
- cargan lo pesado (Three.js) recién cuando hace falta.

En un proyecto Next.js:

```bash
npx shadcn add https://raw.githubusercontent.com/oblivion-tech-agency/web-quality-kit/main/registry/r/scroll-sequence.json
```

Motor: **GSAP + Lenis** para el movimiento y **Three.js** para el 3D (ver `docs/recipes/librerias-de-componentes.md`
para Motion, 21st.dev y UI UX Pro Max).

## El flujo de calidad

```
/audit-landing            →  qué está roto, con archivo y línea
/design-tokens            →  sistema de tokens consolidado y aplicado al CSS real
/rebuild-section [x]      →  reconstruye una sección, verificada con Playwright
```

Corré `/audit-landing` primero siempre: sin diagnóstico, `/rebuild-section` reconstruye a ciegas. Saltearse
`/design-tokens` es la forma más común de terminar con una sección linda que no combina con el resto del sitio.

`motion-design` (skill de LottieFiles, MIT, ver `skills/motion-design/LICENSE`) se activa sola cuando se arma una
animación y aporta timing, easing y coreografía. `fx-catalog` se usa cuando una sección necesita un efecto del catálogo.

### Flujo completo de un proyecto nuevo

```
1. templates/DESIGN.md.template → DESIGN.md. Completar Overview: idea, live thing, modo y escena.
   Elegir la firma de motion con docs/SIGNATURES.md (una firma + hasta dos secundarios, sin repetir).
2. /audit-landing                  (si ya hay algo armado)
3. /design-tokens                  → los tokens del front matter, aplicados al CSS real
4. /rebuild-section [sección]      → con fx-catalog y las reglas de craft-floor de Impeccable
5. Motion: /animate (Emil) o /impeccable animate, una orquestación por región
6. Gates:  taste lint.mjs (0 FAIL) → taste inspect.mjs (1440/768/390) → /impeccable critique → polish
7. Lighthouse desktop y mobile; checklist del DESIGN.md; sumar la fila a docs/SIGNATURES.md
```

## Skills compañeras (de terceros, se instalan aparte)

Tienen su propia licencia y se actualizan desde su repo original.

| Skill | Para qué | Licencia |
|---|---|---|
| [Impeccable](https://github.com/pbakaus/impeccable) | Vocabulario de diseño, `critique` / `audit` / `polish` / `bolder` / `animate`, y reglas que detectan UI con cara de IA (`reference/craft-floor.md`) | Apache-2.0 |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Dirección de arte, la "idea" y el "live thing", más `lint.mjs` e `inspect.mjs` para medir el render real a 1440, 768 y 390 | MIT |
| [Emil Kowalski skills](https://github.com/emilkowalski/skills) | Animación e interacción de detalle: `animate`, `improve-animations`, `review-animations`, `animation-performance` | MIT |
| [GSAP skills](https://github.com/greensock/gsap-skills) | Uso correcto de GSAP: timelines, ScrollTrigger, SplitText, Flip, React | MIT |
| [Three.js skills](https://github.com/cloudai-x/threejs-skills) | Three.js: materiales, shaders, post-procesado | MIT |
| [Humanizer](https://github.com/blader/humanizer) | Saca el tono "IA" del copy | MIT |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Solo como consulta: paletas por rubro y pares tipográficos para un `DESIGN.md` sin marca | MIT |

El launcher de Impeccable (`scripts/impeccable`) descarga un binario la primera vez que corre. Si no querés eso,
leé directo `reference/craft-floor.md` y `reference/new-work.md` dentro de la skill.

**Formato de DESIGN.md:** el template sigue la [especificación de Google](https://github.com/google-labs-code/design.md)
(tokens en YAML arriba y prosa por sección abajo).

## Lecciones que quedaron adentro de las skills (no las repitas)

- **Un mockup visual real gana siempre sobre un `DESIGN.md` en prosa.** Si alguien aprobó un diseño visual
  (Figma, un artifact, una captura), esos son los tokens reales: la prosa se desactualiza.
- **Detectá la arquitectura CSS antes de tocar nada.** Tailwind v4 con `@theme` inline no tiene
  `tailwind.config.js`: no lo inventes.
- **Nunca borres o renombres un token sin grepear todos sus usos primero.** Un `var()` colgante rompe layout
  en silencio.
- **`'use client'` es el último recurso, no el default.** Aislá el estado o la animación en un componente
  chico en vez de convertir toda una sección.
- **Un `IntersectionObserver` de reveal que solo escanea una vez al montar se pierde el contenido que
  aparece después de un fetch client-side.**
- **Nunca corras `next build` con `next dev` vivo sobre el mismo `.next`.** Se corrompe la caché.
- **Verificá visual, no solo build verde.** Capturas de estados reales (mobile, reduced motion) antes de dar algo
  por terminado.
- **Un `IntersectionObserver` no dispara sobre un elemento recortado al 100% con `clip-path`.** El revelado con
  máscara recorta a los hijos y observa al padre.
- **Un efecto de otro proyecto no es identidad.** La identidad sale de la idea del sujeto, y los efectos se
  derivan de ahí.
- **Con cuadros, un giro automático lento se ve a saltos aunque haya fundido.** Si el giro es protagonista, 3D en vivo.
- **Las paletas se eligen viéndolas sobre el sitio real.**
- **No copies assets de bancos de stock a un sitio comercial.** Sirven como referencia, nunca como archivo final.

## Estructura

```
skills/            skills propias (audit-landing, design-tokens, rebuild-section, motion-design, fx-catalog)
packages/fx/       @oblivion/fx: core/, lib/, effects/<efecto>/{index.ts, react.ts, meta.json}, test/
registry/          registry de shadcn (generado)
docs/              CONTRACT.md, CATALOG.md (generado), SIGNATURES.md, recipes/
apps/demo-static/  demos sin build + speaker/ (pipeline de Blender: render.py, cuadros, .glb)
scripts/           build-registry.mjs, check-docs.mjs
templates/         DESIGN.md.template
reference/         awesome-design-md (submódulo)
```

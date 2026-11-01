# Web Quality Kit

Skills de Claude Code para llevar un sitio web de "funcional" a "alta gama" — auditoría técnica, sistema de
tokens de diseño, reconstrucción de secciones con verificación visual real, y principios de motion design.
Nace de aplicar este flujo en serio sobre un proyecto real (Oblivion Tech), no de teoría.

## Instalación

Este repo es la fuente de verdad. Las skills se activan symlinkeándolas a `~/.claude/skills/` (disponibles
en todo proyecto) o copiándolas a `.claude/skills/` dentro de un repo puntual.

```bash
# Global (recomendado) — un symlink por skill, así los cambios en este repo se reflejan solos
for skill in audit-landing design-tokens rebuild-section motion-design fx-effects; do
  ln -s "$(pwd)/skills/$skill" "$HOME/.claude/skills/$skill"
done

# Por proyecto (si preferís copiarlas sueltas a un repo puntual)
cp -r skills/{audit-landing,design-tokens,rebuild-section,motion-design,fx-effects} /ruta/al/proyecto/.claude/skills/
```

Copiá también `templates/DESIGN.md.template` a la raíz de cada proyecto nuevo como `DESIGN.md`. Completá
los tokens del front matter y el Overview con los datos reales de esa marca. Do's and Don'ts y el
Checklist no se tocan: son las reglas que evitan el "look de IA genérica".

Submódulos — inicializalos después de clonar:

```bash
git submodule update --init --recursive
```

## Skills compañeras (no vendoreadas acá, se instalan aparte)

Son de terceros y tienen su propia licencia. No se forkean dentro de este repo: se instalan en
`~/.claude/skills/` y se actualizan desde su repo original.

| Skill | Para qué | Licencia |
|---|---|---|
| [Impeccable](https://github.com/pbakaus/impeccable) | Vocabulario de diseño, `critique` / `audit` / `polish` / `bolder` / `animate`, y reglas que detectan UI con cara de IA (`reference/craft-floor.md`) | Apache-2.0 |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Dirección de arte, la "idea" y el "live thing", más `lint.mjs` e `inspect.mjs` para medir el render real a 1440, 768 y 390 | MIT |
| [Emil Kowalski skills](https://github.com/emilkowalski/skills) | Animación e interacción de detalle: `animate`, `improve-animations`, `review-animations`, `animation-performance`, `animate-expo` para React Native | MIT |
| [Humanizer](https://github.com/blader/humanizer) | Saca el tono "IA" del copy | MIT |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Punto de partida sin marca: estilos, paletas por rubro y pares tipográficos que se vuelcan al `DESIGN.md`. Ver `web-fx-kit/recipes/librerias-de-componentes.md` | MIT |

```bash
git clone --depth 1 https://github.com/pbakaus/impeccable /tmp/impeccable
cp -R /tmp/impeccable/.claude/skills/impeccable ~/.claude/skills/
cp /tmp/impeccable/.claude/agents/*.md ~/.claude/agents/

git clone --depth 1 https://github.com/Leonxlnx/taste-skill /tmp/taste-skill
cp -R /tmp/taste-skill/skills/taste-skill ~/.claude/skills/

git clone --depth 1 https://github.com/emilkowalski/skills /tmp/emil-skills
for s in animate improve-animations review-animations animation-performance animation-vocabulary \
         find-animation-opportunities emil-design-eng apple-design mobile-native animate-expo; do
  cp -R /tmp/emil-skills/skills/$s ~/.claude/skills/
done
```

UI UX Pro Max se instala aparte, con el marketplace de plugins o con su CLI (necesita Python 3):

```bash
# dentro de Claude Code
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
# o por CLI
npm install -g ui-ux-pro-max-cli && uipro init --ai claude --global
```

Motion (animación) y 21st.dev (componentes React) no son skills: cuándo usarlos, cuánto pesan y cómo pasan
por los tokens y los gates del kit está en `web-fx-kit/recipes/librerias-de-componentes.md`. La landing de
ejemplo `web-fx-kit/demo/parlante/` los combina con los módulos del kit.

El launcher de Impeccable (`scripts/impeccable`) descarga un binario la primera vez que corre. Si no
querés eso, leé directo `reference/craft-floor.md` y `reference/new-work.md`: ahí están las reglas.

**Formato de DESIGN.md:** el template sigue la [especificación de Google](https://github.com/google-labs-code/design.md)
(tokens en YAML arriba y prosa por sección abajo), así cualquier agente lo lee igual.
`reference/awesome-design-md/` sigue sirviendo como catálogo de sistemas de marcas reales.

## El flujo

```
/audit-landing            →  qué está roto, con archivo y línea
/design-tokens            →  sistema de tokens consolidado y aplicado al CSS real
/rebuild-section [x]      →  reconstruye una sección, verificada con Playwright
```

Corré `/audit-landing` primero siempre — sin diagnóstico, `/rebuild-section` reconstruye a ciegas. El orden
importa: saltearse `/design-tokens` es la forma más común de terminar con una sección linda que no combina
con el resto del sitio.

`motion-design` (skill de LottieFiles, MIT, ver `skills/motion-design/LICENSE`) no se invoca por comando —
se activa sola cuando se está armando cualquier animación, transición o reveal, y aporta timing/easing/
choreography basados en principios de animación de Disney adaptados a UI.

### Efectos visuales y prompts (`fx-effects`)

La skill `fx-effects` es el puente entre el diagnóstico/tokens y la construcción visual de alto impacto.
Se activa automáticamente desde `/rebuild-section` cuando una sección necesita un efecto WebGL, scroll
narrativo, partículas, o cualquier tratamiento que va más allá de CSS puro.

Incluye:
- **Módulos ES** en `web-fx-kit/effects/` — partículas, gradientes, text-reveal, magnetic, y los de scroll y estado
  (`scroll-progress`, `clip-reveal`, `count-up`, `route-draw`, `live-timeline`, `split-flap`, `pinned-horizontal`,
  `cursor-label`, `scroll-sequence`, `turntable`, `model-turntable`, con `frame-player` y `spin-control` compartidos)
- **Registro de firmas** en `web-fx-kit/SIGNATURES.md` — un efecto firma por proyecto y la combinación que usó cada
  uno, para que los sitios del kit no se parezcan entre sí
- **Wrappers React** en `web-fx-kit/react/` — para proyectos React/Next.js
- **7 prompts** en `web-fx-kit/prompts/` — plantillas por tipo de sitio (hero 3D, editorial, portfolio, etc.)
- **Recipes** en `web-fx-kit/recipes/` — guías de performance, stack, integración React y efectos de scroll en CSS
- **Assets pipeline** en `web-fx-kit/assets-pipeline/` — generar imagen/video/3D con IA

### Flujo completo

```
1. Copiar templates/DESIGN.md.template → DESIGN.md (formato Google). Completar Overview:
   idea, live thing, modo y escena. Sin idea no se construye. Elegí la firma de motion con
   web-fx-kit/SIGNATURES.md (una firma del sujeto + hasta dos secundarios, sin repetir otro proyecto).
2. /audit-landing                  (si ya hay algo armado)
3. /design-tokens                  → los tokens del front matter, aplicados al CSS real
4. /rebuild-section [sección]      → con fx-effects y las reglas de craft-floor de Impeccable
5. Motion: /animate (Emil) o /impeccable animate, una orquestación por región
6. Gates:  taste lint.mjs (0 FAIL) → taste inspect.mjs (1440/768/390) → /impeccable critique → polish
7. Lighthouse desktop y mobile; checklist del DESIGN.md; sumar la fila a SIGNATURES.md
```

## Lecciones que quedaron adentro de las skills (no las repitas)

- **Un mockup visual real gana siempre sobre un `DESIGN.md` en prosa.** Si alguien aprobó un diseño visual
  (Figma, un artifact, una captura), esos son los tokens reales — la prosa se desactualiza.
- **Detectá la arquitectura CSS antes de tocar nada.** Tailwind v4 con `@theme` inline no tiene
  `tailwind.config.js` — no lo inventes.
- **Nunca borres/renombres un token sin grepear todos sus usos primero.** Un `var()` colgante rompe layout
  en silencio.
- **`'use client'` es el último recurso, no el default.** Aislá el estado/la animación en un componente
  chico en vez de convertir toda una sección.
- **Un `IntersectionObserver` de reveal que solo escanea una vez al montar se pierde el contenido que
  aparece después de un fetch client-side.** Si una sección depende de datos asíncronos, el observer necesita
  reaccionar a nodos nuevos (`MutationObserver` o equivalente), o esa sección queda invisible para siempre.
- **Nunca corras `next build` con `next dev` vivo sobre el mismo `.next`.** Se corrompe la caché
  (`MODULE_NOT_FOUND` típico en `webpack-runtime.js`). Matá el dev, `rm -rf .next`, build, recién ahí
  volvé a levantar dev.
- **Verificá visual, no solo build verde.** Playwright + screenshot de estados reales (modal abierto,
  mobile, `prefers-reduced-motion`) antes de dar algo por terminado.
- **Un `IntersectionObserver` no dispara sobre un elemento recortado al 100% con `clip-path`.** El
  revelado con máscara recorta a los hijos y observa al padre, o la foto no aparece nunca.
- **Un efecto de otro proyecto no es identidad.** Reusar el shader, las partículas o la serif de un
  sitio anterior hace que el nuevo "parezca de ellos". La identidad sale de la idea del sujeto (su output,
  su objeto, su ritual), y los efectos se derivan de ahí.
- **Las paletas se eligen viéndolas sobre el sitio real.** Un panel `?lab` que cambia tokens en vivo
  (y que solo se activa con un query param) decide en minutos lo que en mockups lleva días.
- **Los fragmentos de interfaz son imagen legítima en software**, pero marcalos con `data-ui` y
  etiquetalos como ilustrativos cuando no sean capturas reales.
- **No copies assets de bancos de stock (Etsy, Shutterstock, etc.) a un sitio comercial.** Sirven como
  referencia de estilo para dibujar algo original, nunca como archivo final.

## Estructura

```
skills/
  audit-landing/SKILL.md
  design-tokens/SKILL.md
  rebuild-section/SKILL.md
  motion-design/              (upstream: github.com/LottieFiles/motion-design-skill, MIT)
  fx-effects/SKILL.md         ← puente a web-fx-kit
templates/
  DESIGN.md.template           (formato google-labs-code/design.md: tokens YAML + secciones + checklist)
reference/
  awesome-design-md/          (submódulo git — github.com/VoltAgent/awesome-design-md, MIT)
web-fx-kit/                    módulos de efectos, prompts, recipes y assets pipeline
  effects/                     módulos ES sin build
  react/                       wrappers React de effects/ y use-fx.js
  SIGNATURES.md                firma de motion de cada proyecto (leer antes de elegir efectos)
  demo/                        página para probar los módulos de scroll y estado
  prompts/                     7 prompts por tipo de sitio
  recipes/                     guías de combinación y performance
  assets-pipeline/             generar imagen/video/3D con IA
```

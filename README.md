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

Copiá también `templates/DESIGN.md.template` a la raíz de cada proyecto nuevo como `DESIGN.md`, y completalo
con los datos reales de esa marca (secciones 0-5). Las secciones 6-9 no se tocan — son las reglas que evitan
el "look de IA genérica".

Submódulos — inicializalos después de clonar:

```bash
git submodule update --init --recursive
```

## Herramientas compañeras (no vendoreadas acá, se instalan aparte)

Son plugins completos de Claude Code (marketplace propio), no un `SKILL.md` suelto — no tiene sentido
forkearlos adentro de este repo, se instalan directo y quedan actualizables solos:

```bash
# Taste Skill — anti-slop de diseño frontend (88k★, github.com/Leonxlnx/taste-skill)
/plugin marketplace add Leonxlnx/taste-skill
/plugin install taste-skill@taste-skill

# Humanizer — saca el tono "IA" de cualquier texto (50k★, github.com/blader/humanizer)
/plugin marketplace add blader/humanizer
/plugin install humanizer@humanizer
```

Usalos así: `taste-skill` antes/junto con `/rebuild-section` para que el resultado no caiga en los defaults
típicos de IA (gradientes morados, Inter para todo, shadcn sin tocar); `humanizer` al final, sobre cualquier
copy que haya escrito un agente (hero, casos, contacto) para que no suene a IA.

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
- **8 módulos ES** en `web-fx-kit/effects/` — partículas, gradientes, scroll, text-reveal, magnetic, etc.
- **Wrappers React** en `web-fx-kit/react/` — para proyectos React/Next.js
- **7 prompts** en `web-fx-kit/prompts/` — plantillas por tipo de sitio (hero 3D, editorial, portfolio, etc.)
- **Recipes** en `web-fx-kit/recipes/` — guías de performance, stack, integración React
- **Assets pipeline** en `web-fx-kit/assets-pipeline/` — generar imagen/video/3D con IA

### Flujo con efectos

```
1. Copiar DESIGN.md.template al proyecto, llenar secciones 0-5
2. /audit-landing  (si ya hay algo armado)
3. /design-tokens
4. Elegir un prompt de web-fx-kit/prompts/ que matchee el tipo de sitio
5. /rebuild-section [sección]  →  lee el prompt + usa efectos del fx-kit
6. Verificar con checklist de DESIGN.md sección 9
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
  DESIGN.md.template           (secciones 0-9, con tokens, anti-slop y checklist)
reference/
  awesome-design-md/          (submódulo git — github.com/VoltAgent/awesome-design-md, MIT)
web-fx-kit/                    módulos de efectos, prompts, recipes y assets pipeline
  effects/                     8 módulos ES sin build
  react/                       wrappers React de effects/
  prompts/                     7 prompts por tipo de sitio
  recipes/                     guías de combinación y performance
  assets-pipeline/             generar imagen/video/3D con IA
```

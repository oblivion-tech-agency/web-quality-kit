# Web Quality Kit

Skills de Claude Code para llevar un sitio web de "funcional" a "alta gama" — auditoría técnica, sistema de
tokens de diseño, reconstrucción de secciones con verificación visual real, y principios de motion design.
Nace de aplicar este flujo en serio sobre un proyecto real (Oblivion Tech), no de teoría.

## Instalación

Este repo es la fuente de verdad. Las skills se activan symlinkeándolas a `~/.claude/skills/` (disponibles
en todo proyecto) o copiándolas a `.claude/skills/` dentro de un repo puntual.

```bash
# Global (recomendado) — un symlink por skill, así los cambios en este repo se reflejan solos
for skill in audit-landing design-tokens rebuild-section motion-design; do
  ln -s "$(pwd)/skills/$skill" "$HOME/.claude/skills/$skill"
done

# Por proyecto (si preferís copiarlas sueltas a un repo puntual)
cp -r skills/{audit-landing,design-tokens,rebuild-section,motion-design} /ruta/al/proyecto/.claude/skills/
```

Copiá también `templates/DESIGN.md.template` a la raíz de cada proyecto nuevo como `DESIGN.md`, y completalo
con los datos reales de esa marca — es la fuente de verdad que leen `design-tokens` y `rebuild-section`.

## El flujo

```
/audit-landing          →  qué está roto, con archivo y línea
/design-tokens           →  sistema de tokens consolidado y aplicado al CSS real
/rebuild-section [x]      →  reconstruye una sección, verificada con Playwright, no solo con el build
```

Corré `/audit-landing` primero siempre — sin diagnóstico, `/rebuild-section` reconstruye a ciegas. El orden
importa: saltearse `/design-tokens` es la forma más común de terminar con una sección linda que no combina
con el resto del sitio.

`motion-design` (skill de LottieFiles, MIT, ver `skills/motion-design/LICENSE`) no se invoca por comando —
se activa sola cuando se está armando cualquier animación, transición o reveal, y aporta timing/easing/
choreography basados en principios de animación de Disney adaptados a UI.

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
  motion-design/            (upstream: github.com/LottieFiles/motion-design-skill, MIT)
templates/
  DESIGN.md.template
```

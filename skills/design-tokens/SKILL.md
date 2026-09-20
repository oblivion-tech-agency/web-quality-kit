---
name: design-tokens
description: Extrae, consolida y aplica un sistema de tokens de diseño (color, tipografía, espaciado, bordes) al CSS/Tailwind real del proyecto. Úsala después de /audit-landing y antes de /rebuild-section.
---

# DESIGN TOKENS SKILL

Al ejecutar `/design-tokens`:

## 1. Encontrá la fuente de verdad real
Buscá, en este orden de prioridad:
1. Un mockup visual real ya aprobado (export de Figma, artifact HTML, screenshot con paleta definida). **Si existe, tiene prioridad sobre cualquier spec escrita** — un `DESIGN.md` en prosa se desactualiza, un mockup real es lo que el cliente/usuario efectivamente vio y aceptó. Si hay divergencia entre el `DESIGN.md` del repo y un mockup real más reciente, priorizá el mockup y dejalo anotado en tu reporte para que alguien actualice el documento.
2. Si no hay mockup, `DESIGN.md` (u otro doc de marca) en la raíz del proyecto.
3. Si no hay ninguno de los dos, extraé y consolidá lo que YA está hardcodeado en el código (es probablemente inconsistente — ese es el problema a resolver).

Si ninguna de las tres existe o el proyecto arranca de cero, mirá `reference/awesome-design-md/` (submódulo de este repo, colección real de +100 `DESIGN.md` de marcas conocidas) para tomar un punto de partida creíble en vez de inventar valores al azar.

## 2. Detectá la arquitectura CSS real antes de tocar nada
No asumas Tailwind v3 con `tailwind.config.js`. Revisá si el proyecto usa Tailwind v4 con bloque `@theme` inline en el CSS global (sin archivo de config), CSS Modules, o variables CSS planas. Trabajá DENTRO del patrón que ya existe — no inventes un `tailwind.config.js` en un proyecto que usa `@theme`.

## 3. Mapeá y consolidá
- Variables principales: background, surface/card, border, foreground, texto secundario, accent (y variantes si el mockup las tiene, ej. accent-foreground para texto sobre fondo oscuro).
- Tipografía: familia sans y mono, pesos.
- Radios de borde y sombras.
- Sistema de espaciado (idealmente una sola escala reutilizable, ej. una clase `.section-py` en vez de padding ad hoc por sección).

## 4. Aplicá sin romper nada
- **Antes de eliminar o renombrar una variable vieja, buscá TODOS sus usos en el código** (componentes, no solo el CSS global) y remapeá cada uno al token nuevo equivalente. Un `var()` que queda apuntando a una variable borrada rompe silenciosamente el layout.
- Si vas a cambiar la fuente (ej. de Google Fonts vía `next/font`), verificá que el nombre exacto exista en el proveedor antes de asumirlo — alternativas de marca (ej. "Geist") a veces son paquetes npm separados y no están en Google Fonts.

## 5. Reportá
Resumen de los tokens finales (con sus valores), qué variables viejas se eliminaron y a qué se mapearon, y qué archivos se tocaron.

---
name: rebuild-section
description: Reconstruye una sección específica del sitio aplicando los tokens de diseño ya migrados y verificando el resultado visualmente, no solo con el build. Úsala después de /design-tokens.
---

# REBUILD SECTION SKILL

Al ejecutar `/rebuild-section [nombre-sección]`:

## 1. Leé antes de escribir
- Los tokens de diseño ya migrados (variables CSS/clases reales del proyecto — nunca reinventes un sistema paralelo de colores/espaciado).
- El componente actual de la sección, si existe, y CUALQUIER `data-testid`, `aria-label` o `id` que ya use un test existente — preservalos al reescribir, o vas a romper la suite de tests sin darte cuenta.
- Si la sección tiene datos reales (proyectos, casos, contenido), reusalos — un rebuild es de layout/visual, no de contenido, salvo que se pida explícitamente.

## 2. Reconstruí con criterio
- Semántica clara: `<section>`, `<article>` por ítem repetido, JSON-LD si corresponde al tipo de contenido.
- **Server Component por defecto.** Usá `'use client'` solo en el componente específico que necesita estado/efectos/una librería de animación — si solo una parte de la sección lo necesita (ej. un canvas generativo o un contador), aislala en su propio componente cliente chico en vez de convertir toda la sección.
- Animaciones: CSS puro o reveals de scroll livianos por defecto. Si hay una skill de motion design instalada, invocala antes de animar.
- Si la sección monta contenido de forma asíncrona (ej. detrás de un fetch client-side), y el proyecto usa un observer compartido de scroll-reveal, verificá que ese observer también capture elementos que aparecen DESPUÉS del mount inicial (un `IntersectionObserver` que solo escanea una vez al montar se pierde todo lo que llega después vía fetch — esos elementos quedan con `opacity:0` para siempre si el CSS los esconde por defecto).

## 3. Verificá de verdad, no solo con el build
Un build verde no prueba que se vea bien. Levantá el dev server, y con Playwright:
- Screenshot de la sección completa y de estados interactivos (modal abierto, hover, etc.).
- Revisá que no haya overlap, texto cortado, ni contenido vacío inesperado.
- Si agregaste animación, probá también con `prefers-reduced-motion: reduce` emulado.

## 4. Gotcha conocido de Next.js
**Nunca corras `next build` mientras `next dev` sigue corriendo sobre el mismo `.next`** — se corrompe la caché (típico error: `MODULE_NOT_FOUND` en `webpack-runtime.js`, rutas API devolviendo 500). Si pasa: matá el proceso dev, `rm -rf .next`, corré el build o typecheck, y recién ahí volvé a levantar el dev server.

## 5. Cerrá limpio
Typecheck y build limpios. Dev server sano al finalizar (mismo puerto que tenía antes de empezar, si es posible). No dejes procesos de servidor huérfanos.

---
name: oblivion-pass
description: La pasada de alto impacto de Oblivion sobre una landing Next.js ya diseñada y construida. Releva, decide una firma de motion que sale del cliente (sin repetir otros proyectos), produce assets si hace falta, implementa con @oblivion/fx y verifica contra la huella Oblivion. No rediseña ni cambia copy. Usala cuando una landing está "terminada" y hay que hacerla deslumbrar, o cuando piden "darle la pasada" o "hacerla de alto impacto".
---

# /oblivion-pass

Una landing llega diseñada y funcionando. Sale con una capa de motion que la hace memorable, propia del cliente y
con la huella de la casa. **No se toca el diseño, el copy ni la estructura**: si algo de eso está mal, se avisa y se
corre `/audit-landing` aparte.

Kit: la ruta de `web-quality-kit` en `OBLIVION_FX_KIT` (si no está, preguntala). Agentes: `visual-qa`,
`fx-director`, `asset-producer`, `fx-implementer`, `motion-reviewer` (los instala `scripts/install.sh`).

## 0. Precondiciones

- El proyecto es Next.js, compila y tiene el dev server levantado (anotá el puerto).
- Rama nueva `fx/oblivion-pass` desde la rama principal.
- Si existe `DESIGN.md`, se lee; si no, la idea se escribe igual en el `FX.md`.

## 1. Relevamiento → `visual-qa` (modo relevamiento)

Capturas a 1440/768/390, inventario de secciones con su archivo, métricas base (LCP, INP, CLS, JS), consola y
scroll horizontal. Guardá el reporte: es el "antes".

## 2. Concepto → `fx-director`

Escribe `FX.md` en la raíz del proyecto (forma: `templates/FX.md.template`): inventario del sujeto, la idea, la
intensidad propuesta, firma + hasta dos secundarios + base, chequeo contra `docs/SIGNATURES.md`, plan por sección,
assets y presupuesto.

**Puerta: una persona aprueba el `FX.md`** (idea, intensidad y selección). Presentá el resumen y preguntá. Sin
aprobación no se sigue. Si piden cambios, vuelve a `fx-director`.

## 3. Assets → `asset-producer` (solo si el `FX.md` los pide)

Secuencias o `.glb` con Blender, escena con Spline MCP, hero o clip con Higgsfield, todo dentro del presupuesto y
con hoja de contacto para revisar antes de usarlo.

## 4. Implementación → `fx-implementer`

Instala los efectos desde el registry, mapea los tokens `--fx-*`, monta los hooks en componentes cliente chicos y
aplica la base de la casa. Typecheck y build limpios.

## 5. Controles → `motion-reviewer` + `visual-qa` (modo control)

En paralelo:
- `motion-reviewer`: código contra `docs/SIGNATURE-OBLIVION.md`, `docs/CONTRACT.md` y el `FX.md`.
- `visual-qa`: capturas y tira del scroll en desktop y mobile, reduced motion, nada tapa un titular, métricas contra
  la base, consola.
- Si `taste-skill` está instalado: `inspect.mjs` sobre la página, 0 FAIL.

Los hallazgos **Bloqueante** y **Alta** vuelven a `fx-implementer`. Repetí el paso 5 hasta que no quede ninguno
(como mucho tres rondas; si en la tercera sigue habiendo bloqueantes, pará y explicá por qué).

## 6. Cierre

1. Fila nueva en `docs/SIGNATURES.md` del kit con lo que quedó publicado (proyecto, idea, firma, secundarios,
   personalidad del movimiento).
2. Si hizo falta un efecto que el catálogo no tenía, se suma al kit (no se deja suelto en el proyecto): abrí la
   tarea en el kit con lo aprendido.
3. Reporte final, corto: la idea en una frase, la selección, capturas antes y después, la tabla de métricas, lo que
   quedó pendiente y las decisiones que tomó una persona. Sin commit ni deploy salvo que lo pidan.

## Reglas

- **Una persona decide** la idea, la intensidad y la selección. Los agentes proponen.
- **Lo que no está en el `FX.md` no se hace.** Ideas nuevas en el camino van como propuesta al final.
- **El cliente es el sujeto.** Si la idea no sale de su mundo, no hay firma: hay decoración.
- **La huella no se negocia:** curva, tiempos, reduced motion, rendimiento y "lo que nunca hacemos"
  (`docs/SIGNATURE-OBLIVION.md`).

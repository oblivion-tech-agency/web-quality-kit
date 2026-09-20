---
name: audit-landing
description: Diagnóstico técnico y estructural de una landing o sitio de marketing frente a estándares de ingeniería y diseño de alta gama. Úsala antes de rediseñar nada, para saber qué está realmente roto.
---

# AUDIT LANDING SKILL

Al ejecutar `/audit-landing`, leé el código fuente del proyecto (páginas, componentes de landing, layout) y verificá estos puntos. No generalices — cada hallazgo necesita archivo y línea exacta.

## 1. Casos de uso / portfolio
¿La sección de casos, trabajos o clientes está vacía, usa placeholders, o promete una estructura (ej. Problema/Decisión/Resultado) que en la práctica no cumple? Ojo con datos parcialmente vacíos: un array de métricas vacío puede estar ocultando silenciosamente una sección entera en el componente que lo consume (`{items.length > 0 && ...}`) sin que se note mirando solo el código de datos.

## 2. Copywriting & H1
¿El H1 del hero es genérico/abstracto o comunica el diferencial real y específico del negocio? Si es genérico, proponé 2-3 alternativas concretas basadas en lo que el negocio realmente hace distinto — no frases de relleno tipo "soluciones innovadoras".

## 3. Jerarquía de CTAs
¿El hero tiene más de 2 CTAs primarios/secundarios compitiendo? Contá también enlaces "casi-CTA" (email, WhatsApp, redes) que compiten visualmente aunque no sean botones.

## 4. Dominio e higiene de contacto
¿Se usa un email de dominio propio o un dominio público (Gmail, Hotmail, etc.) en el sitio? Buscá TODAS las ocurrencias — hero, footer, formulario de contacto, páginas legales — no asumas que corregir una alcanza. Si hay un formulario de contacto con backend, revisá también el dominio de envío (`from:`) del proveedor de email: un dominio de prueba tipo `onboarding@resend.dev` es señal de que el dominio propio no está verificado.

## 5. Densidad técnica / señales de confianza
¿Existe una sección de criterio técnico (stack, qué se elige y qué NO se hace) o de equipo real (nombres, no "nuestro equipo de expertos")? La ausencia de estas secciones es habitual y es fácil de arreglar con alto impacto de credibilidad.

## 6. CSS, layout y arquitectura
- Consistencia de escalas tipográficas entre secciones (¿cada `<h2>` usa una clase distinta al azar?).
- Consistencia de espaciado (¿cada sección tiene su propio padding ad hoc en vez de una escala compartida?).
- Uso de `'use client'`: ¿está limitado a componentes que realmente necesitan estado/efectos/animación, o se aplicó por inercia a secciones estáticas?
- Duplicación de constantes (emails, links de WhatsApp, textos) copiadas en 3+ archivos en vez de centralizadas.

## Salida
Reporte agrupado por los 6 puntos, con archivo:línea y severidad (CRÍTICO, ALTO, MEDIO). Si un punto no tiene hallazgos, decilo explícitamente — no lo omitas. Priorizá precisión sobre volumen: mejor 8 hallazgos verificados que 20 genéricos.

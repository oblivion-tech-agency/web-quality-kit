# Firmas de motion por proyecto

Todo sitio que sale del kit usa el mismo catálogo, así que sin una regla terminan pareciéndose entre sí.
Este registro es esa regla, y se completa en cada proyecto nuevo **antes** de construir.

## La regla

1. **Un efecto firma por proyecto, derivado del sujeto.** Sale de la idea del `DESIGN.md` ("en esta
   página, X se vuelve Y"): lo que el cliente hace, mueve, fabrica o recorre. Es el único efecto que
   ocupa una sección entera y el que alguien recordaría al describir el sitio. Si se puede usar igual en
   el sitio de un competidor, no es firma.
2. **Como mucho dos efectos secundarios del catálogo**, elegidos para acompañar a la firma. Los
   reveals de texto y foto no cuentan: son el piso.
3. **La combinación no se repite.** Antes de elegir, leé la tabla de abajo. Dos proyectos pueden
   compartir un secundario, nunca la firma ni el par de secundarios.
4. **La firma se adapta, no se copia.** Si un proyecto nuevo reusa un módulo que fue firma de otro
   (`route-draw`, por ejemplo), cambia el sujeto, la composición y la personalidad del movimiento:
   la línea de un río no se dibuja como una ruta de camiones.
5. **Registrá al terminar**, con lo que quedó publicado y no con lo que se planeó.

> **Nota sobre `scroll-sequence`** (producto que gira con el scroll): es un efecto de moda. Va como
> firma solo cuando el producto es el protagonista del sitio, y nunca en dos proyectos seguidos con la
> misma composición.

## Registro

| Proyecto | Idea | Firma | Secundarios | Personalidad del movimiento |
|---|---|---|---|---|
| Transporte Lehman | La Ruta 3 de noche, bajo control | `route-draw` (corredor Buenos Aires → Ushuaia con el scroll, marcador GPS) + `live-timeline` en el hero (camión propio animado) | `frame-expand` (bitren), `parallax-col` (flota) | Rígida, sin rebote, como un instrumento |
| Oblivion Ecommerce | sin registrar | sin registrar | `gradient-backdrop`, `text-reveal`, `magnetic`, glow de puntero | sin registrar |

## Ideas de firma por rubro (para arrancar, no para copiar)

| Rubro | Lo que el sujeto tiene | Posible firma |
|---|---|---|
| Logística, transporte | Rutas, unidades en viaje | Recorrido que se dibuja, panel de rastreo, cartel de destinos (`split-flap`) |
| Gastronomía | Una carta, un servicio que se arma | Pinned horizontal de platos con la comanda como estado |
| Construcción, industria | Una obra que avanza por etapas | Foto que se abre a la obra terminada, `live-timeline` de etapas |
| Software, SaaS | El producto trabajando | El output real del producto armándose con el scroll |
| Salud, estudios profesionales | Un proceso que tranquiliza | Trazos que se dibujan sobre los pasos, movimiento lento y suave |
| Producto físico (ecommerce de producto, hardware, maquinaria, vehículos) | Un objeto que se mira por todos lados | Producto que gira con el scroll (`scroll-sequence` en modo capítulos), un ángulo y un titular por capítulo; `turntable` para mirarlo a mano |
| Estudio creativo, portfolio | Los trabajos | Cursor con etiqueta y transiciones entre casos (View Transitions) |

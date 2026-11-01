# La huella Oblivion

Los efectos cambian de proyecto a proyecto; la huella no. Es lo que alguien nota sin poder nombrarlo: que todo se
mueve con la misma calma segura, que nada tarda, que nada estorba, que cada detalle responde. Son reglas medibles:
`motion-reviewer` y `visual-qa` las chequean en cada pasada.

## 1. Una curva, tres tiempos

- **Curva de la casa:** `--fx-ease: cubic-bezier(0.16, 1, 0.3, 1)` para todo lo que entra. Las salidas usan la misma
  curva al 60% del tiempo. `linear` solo en lo que va atado al scroll (scrub). Rebote solo si la personalidad del
  proyecto lo pide por escrito en el `FX.md`.
- **Tiempos:**

| Qué | Duración |
|---|---|
| Microinteracción (hover, press, focus) | 120–200 ms |
| Entrada de una parte de sección | 600–900 ms |
| Momento firma | 900–1400 ms |
| Escalonado entre partes | 60–90 ms |
| Desplazamiento de una entrada | 16–32 px |

## 2. Entradas que se leen

- Cada sección entra **por partes** (título, texto, imagen), una sola vez, al entrar en vista. Nunca un fade del
  bloque entero.
- **Nada queda oculto si el JS falla:** lo que arranca oculto se oculta solo bajo `.js` y tiene salida.
- El primer titular **está pintado en el primer frame** y termina de llegar antes de 1,2 s. Sin preloaders, sin
  pantallas de carga, sin esperar al evento `load`.

## 3. Todo responde

- Todo botón y link tiene hover, press (desplazamiento de 1–2 px o escala 0,98) y `:focus-visible` con el acento.
- Lo que se arrastra también funciona con el teclado; lo que se hace con el cursor solo existe con puntero fino.
- El cursor del sistema nunca se esconde.

## 4. Scroll honesto

- **Nunca scroll-jacking.** El smooth scroll (Lenis) conserva el scroll nativo y solo se usa en intensidad ●●● o más.
- Un pin dura **dos o tres pantallas como máximo**, y algo cambia en cada una.
- Nada pasa por encima de un titular o un texto mientras se lee.

## 5. Rápido de verdad

- LCP no empeora más de 10% respecto de la landing sin pasada; INP < 200 ms; CLS 0 por efectos.
- El LCP es HTML o una imagen. Lo pesado (Three.js, secuencias) se carga a una pantalla de distancia.
- Fuera de pantalla no hay rAF. Como mucho **dos contextos WebGL** por página.
- Sin errores de consola. Sin scroll horizontal a 375 px.

## 6. Reduced motion es una versión, no un apagado

Con `prefers-reduced-motion` la página se lee completa y quieta: el recorrido dibujado, las fotos reveladas, el
producto en su mejor ángulo. Se prueba en cada pasada, no se supone.

## 7. Una firma por sitio

Una firma derivada del sujeto, como mucho dos secundarios y la base. Registrada en `docs/SIGNATURES.md`, sin
repetir la combinación de otro proyecto. Si la idea no sale del cliente, no hay firma: hay decoración.

## 8. El cierre

El footer es un cierre diseñado (una invitación, el nombre a sangre), no un mapa del sitio. La última pantalla
deja la misma impresión que la primera.

## Lo que nunca hacemos

- Preloaders, pantallas de carga o intros que hay que esperar.
- Partículas, gradientes o glows por decoración, sin idea detrás.
- Texto que tiembla, parpadea o se escribe letra por letra en párrafos.
- Efectos que tapan un titular o que solo funcionan con mouse.
- Copiar la firma de otro proyecto del registro, o de un sitio premiado, tal cual.
- Etiquetas de "hecho con IA" o "powered by" en el sitio del cliente.

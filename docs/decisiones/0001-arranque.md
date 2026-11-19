# 0001. Arranque: qué se reutiliza, qué se practica y cómo

19 de noviembre de 2026. Decidido por Claude con el visto bueno del dueño del repositorio al plan de una app para pasar de A2/B1 a B2 hablando.

## El problema que resuelve

Quien la usa entiende bastante neerlandés, pero al hablar pone las palabras en el orden del inglés («Morgen ik ga…») y conjuga a medias («ik werkt»). Se le entiende, pero no mejora solo con hablar. La app no enseña neerlandés desde cero: entrena justo eso, producir frases con el verbo en su sitio y bien conjugado.

## Qué se decidió

1. **Repositorio nuevo con el motor de Michi.** De Michi (la app de japonés del mismo autor) se copia solo lo que no sabe de idiomas: rondas, repaso FSRS, historial, rachas, guardado y copias, y las ayudas para probar pantallas. Las pantallas de Michi están hechas para el japonés (kana, kanji, trazos) y se rehacen.
2. **Tres partes**: orden de la frase (8 estructuras, de la inversión a la subordinada delante), verbos (presente, perfectum con hebben o zijn, separables, pasado) y vocabulario con de o het.
3. **Producir, no reconocer.** El ejercicio central es escribir la frase entera desde el español. El corrector compara palabra a palabra con todas las formas buenas, perdona mayúsculas, puntuación y tildes, no perdona una letra en el verbo y dice si el fallo es de orden o de palabras. Como ninguna lista de formas buenas es completa, el alumno puede dar la suya por buena («Mi respuesta también vale»).
4. **Intentar antes de ver.** Lo que sale de una regla (el orden de cada frase, el presente regular, el participio regular) no se enseña antes de preguntarlo: la regla se presenta una vez, al abrir su grupo, con un ejemplo que no es la frase que se pregunta, y se repite al corregir. Si cada frase se enseñara antes, el primer ejercicio sería copiar lo que se acaba de leer. Lo irregular, los separables, el pasado y las palabras sí se presentan, porque no se deducen.
5. **Escalera de formas por frase**: la primera vez, fichas; desde el primer repaso, escribirla; después también decirla en voz alta y el dictado.
6. **Voz del dispositivo** (síntesis del navegador, voz neerlandesa local). Sin claves ni red. Sin voz neerlandesa, no hay dictado.
7. **Web primero.** Se usa en el navegador del móvil; sin Capacitor ni tiendas mientras sea para uso personal.
8. **Nombre provisional «Stap»** (paso). Solo aparece en `index.html`, `src/estado/app.ts` y las pantallas.

## Qué se descartó

- Meterla dentro de Michi como otro idioma: el motor ya está separado, pero el contenido, la interfaz y las decisiones de cada app van por caminos distintos.
- Audio grabado o generado en la nube: obliga a gestionar claves y a cuidar cada archivo. Para empezar basta la voz del dispositivo.
- Reconocimiento de voz para el ejercicio de decir: depende del navegador y manda el audio a un servidor en la mayoría. El alumno compara él mismo.

## Qué queda abierto

- Revisión de todo el contenido por una persona nativa (`docs/revision.md`). Hasta entonces, la app lo avisa en Hoy.
- Comprobar la ortografía de cada palabra contra una lista de palabras libre, revisando antes su licencia.
- Más frases por estructura y temas de conversación para B1 y B2.
- Publicarla para usarla desde el móvil sin ordenador: de momento no (ver 0002).
- El nombre y el icono definitivos.

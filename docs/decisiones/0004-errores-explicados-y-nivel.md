# 0004. Errores explicados y nivel por regla

Fecha: 2026-11-20

## Qué se pedía

La app se quedaba corta: al fallar enseñaba la regla general del grupo y no qué había fallado en esa respuesta, y no decía en ningún sitio qué nivel hay. Se eligió, antes que añadir ejercicios nuevos, explicar cada error y medir el nivel por regla con el contenido que ya hay.

## Qué se ha hecho

- **Diagnóstico sin IA** (`src/neerlandes/diagnostico/`). Cada frase tiene papeles (sujeto, verbo conjugado, lo que va al final, la subordinada) que salen de la posición de sus fichas según el grupo. La respuesta se compara con esos papeles y se dice la regla rota con las palabras de la frase: inversión, verbo en segunda posición, infinitivo o participio al final, partícula separable, niet y geen, preguntas, verbo al final en la subordinada, subordinada delante, conjugación (la -t), participio (’t kofschip, ge-, irregulares), hebben o zijn y de o het. Si una forma de la respuesta sale en alguna respuesta buena, no se señala; si no hay nada seguro, no se dice nada.
  - Sin IA porque la app no habla con servidores ni guarda claves (CLAUDE.md) y porque una explicación inventada es peor que ninguna.
- **Destrezas** (`src/neerlandes/destrezas.ts`): 15 reglas con su nivel orientativo (A2 o B1). Cada ejercicio dice cuáles entrena y cada fallo con diagnóstico cuál se ha roto; las dos cosas se guardan en el historial (`d` y `x`, opcionales, así que lo guardado antes sigue valiendo).
- **Nivel** (`src/motor/nivel.ts`): media de aciertos por destreza, con más peso para escribir que para ordenar fichas, más peso para lo reciente y una prudencia inicial para que dos aciertos no den el 100 %. Un fallo con diagnóstico solo cuenta contra la regla fallada. Un nivel se da por alcanzado cuando todas sus reglas están dominadas. B2 no se puede alcanzar: lo que le falta no está en la app y se dice en Progreso.
- **Práctica en caliente**: tras un fallo con diagnóstico, justo después sale otra frase con la misma regla (una vez por regla y ronda).
- **Dificultad**: si una regla de orden está dominada, sus frases ya no se ordenan con fichas, ni las nuevas; si está floja, vuelven más las fichas. En verbos, el presente dominado deja de elegirse entre opciones y el participio dominado se practica más en la frase entera.

## Pendiente

- Las explicaciones salen en `docs/revision.md` (E1 en adelante) para la revisión nativa.
- Ejercicios nuevos (transformar, encontrar el error, huecos en contexto), guiados por lo que más se falla.

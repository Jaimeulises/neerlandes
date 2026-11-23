# 0003. Revisión del contenido y del código antes de fusionar

19 de noviembre de 2026. Decidido por Claude con el dueño del repositorio ausente, como pide CLAUDE.md.

## Qué se hizo

Antes de fusionar la primera versión, nueve revisiones independientes repasaron las frases de orden, los verbos, los separables y las reglas, el vocabulario, el corrector y las rondas. Cada hallazgo pasó por dos revisores escépticos. De 115 hallazgos, 90 se confirmaron, 14 quedaron discutidos y 11 se descartaron. Se aplicaron los confirmados y se decidieron los discutidos (abajo).

Una revisión hecha por IA no sustituye a la nativa: todo el contenido sigue en `docs/revision.md`, pendiente.

## Decisiones

1. **Al traducir valen las formas tónicas sin apuntarlas** (`conFormasTonicas`): wij por we y mij por me en cualquier sitio, y zij por ze solo cuando abre la frase. En esas posiciones siempre son correctas, y apuntarlas a mano en cada frase se olvidaría. jij por je no se añade sola, porque je también es objeto y posesivo («ik bel je op», «je zus»): va en los datos, y una prueba exige que cada je de una frase que se traduce tenga apuntada su forma tónica (jij, jou o jouw). Otra prueba avisa si poner un pronombre en su forma tónica sale como fallo de orden, que es la señal de que falta apuntar una forma.
2. **Al dictar solo vale lo que suena.** Las otras formas valen al ordenar y al traducir, no al escribir lo que se oye.
3. **El perfectum y el pasado tienen otras formas buenas** (`perfOtras`, `pasadoOtras`), sobre todo con el complemento de tiempo delante, que es justo lo que se practica.
4. **Los ejemplos de las reglas no son frases que la app pregunta.** La regla se presenta al abrir el grupo y no debe dar la respuesta del ejercicio que viene detrás. Una prueba lo vigila en las reglas del orden y en las de los verbos. Por lo mismo, la regla del presente y la del perfectum regular se enseñan con spelen, un verbo de la mitad del grupo, y no con el que abre el grupo, que se pregunta justo después (`EJEMPLO_DE_REGLA`).
5. **Solo voces del propio dispositivo.** Las de red mandan cada frase a un servidor, y la decisión 0001 dice que la app no habla con servidores.
6. **Restaurar una copia pide confirmación**, con la fecha de la copia y lo que trae frente a lo que hay, igual que borrar el progreso.
7. **Zeggen pasa a regular en el perfectum**: gezegd sigue la regla (ge + zeg + d); lo irregular es el pasado (zei, zeiden), y así lo dice su nota.
8. **«Hoelang» en una palabra** cuando pregunta por el tiempo, como pide la ortografía oficial; «hoe lang» sigue valiendo al traducir.

## Los discutidos

- **Aplicados:** O6 (el complemento de tiempo también al final: «we drinken koffie na het eten»), O34 (hem y «dat heb ik niet gezien»), P25 (badkamer es el baño con ducha o bañera, y el váter suele ser la wc), P58 (avond empieza hacia las seis), P15 (kind también es hijo o hija, en una nota), P89 (detrás de volgens mij va el verbo, sin dat), P66 (zojuist, zonet y daarnet también valen), la regla de los participios irregulares (los grupos en -en y en -cht) y la nota de zullen (el futuro se dice más con el presente o con gaan, y zou es también el condicional).
- **No aplicados:** V24 (staan: «estar de pie» es su significado básico y cada frase trae su traducción), cifras y m'n por mijn (la app entrena las palabras, y «Mi respuesta también vale» lo salva) y varias pestañas a la vez (en el uso previsto hay una sola ventana).
- **De los descartados** se aprovecharon tres notas: en, maar y want no invierten (regla de inversión), «Hoe laat is het?» para preguntar la hora (P55) y «te laat» para llegar tarde (P115).

## La segunda revisión

Después, cuatro revisores repasaron estos mismos cambios (rondas y guardado, pantallas, corrector y contenido) y un escéptico intentó refutar cada hallazgo. De 17 se confirmaron 13, y se arreglaron todos:

- Lo nuevo se repartía empezando cada día por una pista, pero al recortar la ronda se quedaban siempre lo de orden y lo de verbos. Ahora lo nuevo también se intercala empezando por la pista del día.
- Si con una confirmación de restaurar abierta se elegía otro archivo y ese no valía, seguía a mano el «Restaurar» del anterior.
- Ajustes decía que, si no sirve ninguna forma elegida, el vocabulario sale con opciones, y sale escribiendo. Hoy decía «Quedan 1».
- Faltaban formas buenas: jij, jou y jouw en frases de verbos y de orden, la pregunta de la sal con jij, «in juni zijn zij getrouwd», «ze wou naar huis» y el complemento con preposición detrás de la partícula («de trein komt aan om vijf uur»), que dos frases ya aceptaban y la regla no decía. La pista de O24 dice ya que él es «hij».
- La regla de los separables decía que en el infinitivo la partícula va pegada, y con te va separada («om je op te bellen»).
- La regla del presente y la del perfectum regular se enseñaban con el mismo verbo que se pregunta justo después (ver la decisión 4).
- `docs/revision.md` no traía las reglas de los verbos ni las pistas de las frases, y las dos llevan neerlandés.

Se refutaron 4: que la previsión de Hoy pueda ir hasta un minuto por detrás (solo puede faltar un repaso que acaba de vencer), que el dictado quede como única forma elegida al quitar la voz (sale lo de siempre, como dice la pantalla), gezellig y lekker como opciones la una de la otra (sus significados no se solapan) y la nota de volgens mij (no dice todo, pero no enseña nada falso).

Una última pasada sobre esos arreglos, también con un escéptico por hallazgo, confirmó 3 más, ya arreglados: faltaban «elke dag sta ik op om zeven uur» y las formas de opstaan con «om zeven uur» delante, faltaba «hij kwam thuis om negen uur», y la prueba de las formas tónicas podía fallar sin motivo cuando un pronombre sale dos veces con papeles distintos («heb je je sleutels?»). Una prueba vigila ya que, en los separables, el complemento con preposición valga delante y detrás de la partícula.

## Lo que queda abierto: los ids salen del texto

Los ids de las frases y las palabras salen de su texto (las seis primeras palabras). Corregir una frase cambia su id: su tarjeta de repaso queda huérfana, la frase vuelve como nueva y, hasta que se vea otra vez, su grupo puede contar como no empezado. De momento se deja así, porque hoy no hay progreso que perder. Cuando llegue la revisión nativa, antes de aplicarla hay que elegir entre ids fijos en los datos o una tabla de ids viejos a nuevos que se aplique al cargar el progreso.

*Resuelto en la decisión 0007: cada elemento lleva un código fijo y su id ya no sale del texto, sino de `src/neerlandes/ids-fijos.ts` (el de antes, congelado) o, si es nuevo, de su código. Corregir una frase ya no cambia su id; pasar un verbo a otro grupo, sí.*

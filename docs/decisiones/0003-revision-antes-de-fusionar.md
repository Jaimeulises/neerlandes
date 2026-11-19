# 0003. Revisión del contenido y del código antes de fusionar

19 de noviembre de 2026. Decidido por Claude con el dueño del repositorio ausente, como pide CLAUDE.md.

## Qué se hizo

Antes de fusionar la primera versión, nueve revisiones independientes repasaron las frases de orden, los verbos, los separables y las reglas, el vocabulario, el corrector y las rondas. Cada hallazgo pasó por dos revisores escépticos. De 115 hallazgos, 90 se confirmaron, 14 quedaron discutidos y 11 se descartaron. Se aplicaron los confirmados y se decidieron los discutidos (abajo).

Una revisión hecha por IA no sustituye a la nativa: todo el contenido sigue en `docs/revision.md`, pendiente.

## Decisiones

1. **Al traducir valen las formas tónicas sin apuntarlas** (`conFormasTonicas`): wij por we y mij por me en cualquier sitio, y zij por ze solo cuando abre la frase. En esas posiciones siempre son correctas, y apuntarlas a mano en cada frase se olvidaría. jij por je no se añade sola, porque je también es objeto y posesivo («ik bel je op», «je zus»): va en los datos.
2. **Al dictar solo vale lo que suena.** Las otras formas valen al ordenar y al traducir, no al escribir lo que se oye.
3. **El perfectum y el pasado tienen otras formas buenas** (`perfOtras`, `pasadoOtras`), sobre todo con el complemento de tiempo delante, que es justo lo que se practica.
4. **Los ejemplos de las reglas no son frases que la app pregunta.** La regla se presenta al abrir el grupo y no debe dar la respuesta del ejercicio que viene detrás. Una prueba lo vigila en las reglas del orden.
5. **Solo voces del propio dispositivo.** Las de red mandan cada frase a un servidor, y la decisión 0001 dice que la app no habla con servidores.
6. **Restaurar una copia pide confirmación**, con la fecha de la copia y lo que trae frente a lo que hay, igual que borrar el progreso.
7. **Zeggen pasa a regular en el perfectum**: gezegd sigue la regla (ge + zeg + d); lo irregular es el pasado (zei, zeiden), y así lo dice su nota.
8. **«Hoelang» en una palabra** cuando pregunta por el tiempo, como pide la ortografía oficial; «hoe lang» sigue valiendo al traducir.

## Los discutidos

- **Aplicados:** O6 (el complemento de tiempo también al final: «we drinken koffie na het eten»), O34 (hem y «dat heb ik niet gezien»), P25 (badkamer es el baño con ducha o bañera, y el váter suele ser la wc), P58 (avond empieza hacia las seis), P15 (kind también es hijo o hija, en una nota), P89 (detrás de volgens mij va el verbo, sin dat), P66 (zojuist, zonet y daarnet también valen), la regla de los participios irregulares (los grupos en -en y en -cht) y la nota de zullen (el futuro se dice más con el presente o con gaan, y zou es también el condicional).
- **No aplicados:** V24 (staan: «estar de pie» es su significado básico y cada frase trae su traducción), cifras y m'n por mijn (la app entrena las palabras, y «Mi respuesta también vale» lo salva) y varias pestañas a la vez (en el uso previsto hay una sola ventana).
- **De los descartados** se aprovecharon tres notas: en, maar y want no invierten (regla de inversión), «Hoe laat is het?» para preguntar la hora (P55) y «te laat» para llegar tarde (P115).

## Lo que queda abierto: los ids salen del texto

Los ids de las frases y las palabras salen de su texto (las seis primeras palabras). Corregir una frase cambia su id: su tarjeta de repaso queda huérfana, la frase vuelve como nueva y, hasta que se vea otra vez, su grupo puede contar como no empezado. De momento se deja así, porque hoy no hay progreso que perder. Cuando llegue la revisión nativa, antes de aplicarla hay que elegir entre ids fijos en los datos o una tabla de ids viejos a nuevos que se aplique al cargar el progreso.

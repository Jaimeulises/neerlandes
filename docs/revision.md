# Revisión del neerlandés

Todo el neerlandés que enseña la app, para que una persona nativa lo revise. Lo ha escrito una IA y nadie del equipo es nativo: hasta que se revise, puede haber frases correctas que nadie diría así.

Este archivo se genera con `npm run revision`: no se edita a mano. Las correcciones van en los datos (`src/neerlandes/*/datos.ts`).

## Cómo revisarlo

- Lee cada frase en neerlandés y marca lo que no dirías así, aunque sea correcto.
- Comprueba que la traducción dice lo mismo que la frase.
- Apunta el número (O12, V3, S5, P40) y cómo lo dirías tú.

**Voor wie dit nakijkt:** hier staan alle Nederlandse zinnen en woorden uit de app. Klopt het en klinkt het natuurlijk? Schrijf het nummer op (bijvoorbeeld O12) en hoe jij het zou zeggen.

## Orden de la frase (O1 a O64)

### Inversión

> Si la frase empieza por algo que no es el sujeto (morgen, vandaag, in het weekend…), el verbo va en segunda posición y el sujeto justo detrás. En inglés se dice «Tomorrow I go»; en neerlandés, «Morgen ga ik».

| # | Neerlandés | Español |
|---|---|---|
| O1 | Morgen ga ik naar mijn schoonouders.<br>*También:* Ik ga morgen naar mijn schoonouders. | Mañana voy a casa de mis suegros. |
| O2 | Vandaag werk ik thuis.<br>*También:* Ik werk vandaag thuis. | Hoy trabajo en casa. |
| O3 | In het weekend fietsen we vaak naar het strand.<br>*También:* We fietsen in het weekend vaak naar het strand. | El fin de semana vamos a menudo en bici a la playa. |
| O4 | 's Avonds kijken we samen een serie.<br>*También:* We kijken 's avonds samen een serie. / 's Avonds kijken we samen naar een serie. | Por la noche vemos una serie juntos. |
| O5 | Gisteren was het heel koud.<br>*También:* Het was gisteren heel koud. / Gisteren was het erg koud. | Ayer hizo mucho frío. |
| O6 | Na het eten drinken we koffie.<br>*También:* We drinken na het eten koffie. | Después de comer tomamos café. |
| O7 | Volgende week heb ik een afspraak bij de tandarts.<br>*También:* Ik heb volgende week een afspraak bij de tandarts. | La semana que viene tengo cita con el dentista. |
| O8 | Meestal eten we om zes uur.<br>*También:* We eten meestal om zes uur. | Normalmente cenamos a las seis. |

### Verbos modales

> Con willen, kunnen, moeten, mogen, zullen o gaan + infinitivo, ese verbo va en segunda posición y el infinitivo se va al final.

| # | Neerlandés | Español |
|---|---|---|
| O9 | Ik wil morgen een nieuwe fiets kopen.<br>*También:* Morgen wil ik een nieuwe fiets kopen. | Mañana quiero comprar una bici nueva. |
| O10 | Kun je het zout even aangeven?<br>*También:* Kun je even het zout aangeven? / Kan je het zout even aangeven? / Kan je even het zout aangeven? / Kun jij het zout even aangeven? | ¿Puedes pasarme la sal? |
| O11 | We moeten om acht uur bij mijn ouders zijn.<br>*También:* Om acht uur moeten we bij mijn ouders zijn. | Tenemos que estar en casa de mis padres a las ocho. |
| O12 | Ik ga vanavond voor iedereen koken.<br>*También:* Vanavond ga ik voor iedereen koken. | Esta noche voy a cocinar para todos. |
| O13 | Mag ik je iets vragen? | ¿Puedo preguntarte una cosa? |
| O14 | Jullie kunnen bij ons blijven slapen. | Podéis quedaros a dormir en nuestra casa. |
| O15 | Ik wil elke dag Nederlands spreken.<br>*También:* Elke dag wil ik Nederlands spreken. | Quiero hablar neerlandés todos los días. |
| O16 | Zullen we morgen naar de markt gaan? | ¿Vamos mañana al mercado? |

### Perfectum

> En el perfectum, hebben o zijn van en segunda posición y el participio se va al final de la frase.

| # | Neerlandés | Español |
|---|---|---|
| O17 | Ik heb gisteren de hele dag gewerkt.<br>*También:* Gisteren heb ik de hele dag gewerkt. | Ayer trabajé todo el día. |
| O18 | We zijn in het weekend naar Utrecht gegaan.<br>*También:* In het weekend zijn we naar Utrecht gegaan. | El fin de semana fuimos a Utrecht. |
| O19 | Heb je goed geslapen?<br>*También:* Heb jij goed geslapen? | ¿Has dormido bien? |
| O20 | Ik heb mijn sleutels vergeten. | Me he olvidado las llaves. |
| O21 | Mijn schoonmoeder heeft een taart gebakken. | Mi suegra ha hecho una tarta. |
| O22 | Ze zijn vorig jaar naar Spanje verhuisd.<br>*También:* Vorig jaar zijn ze naar Spanje verhuisd. | Se mudaron a España el año pasado. |
| O23 | We hebben veel gelachen. | Nos hemos reído mucho. |
| O24 | Hij is om tien uur thuisgekomen.<br>*También:* Om tien uur is hij thuisgekomen. | Llegó a casa a las diez. |

### Verbos separables

> En los verbos separables (opbellen, opstaan, meenemen…), en presente la partícula se separa y se va al final.

| # | Neerlandés | Español |
|---|---|---|
| O25 | Ik bel je morgen op.<br>*También:* Morgen bel ik je op. | Te llamo mañana. |
| O26 | Hoe laat sta je op?<br>*También:* Hoe laat sta jij op? | ¿A qué hora te levantas? |
| O27 | Neem jij de wijn mee?<br>*También:* Neem je de wijn mee? | ¿Traes tú el vino? |
| O28 | De trein komt om vijf uur aan.<br>*También:* Om vijf uur komt de trein aan. | El tren llega a las cinco. |
| O29 | We ruimen na het eten de keuken op.<br>*También:* Na het eten ruimen we de keuken op. | Después de comer recogemos la cocina. |
| O30 | Ik nodig mijn vrienden voor zaterdag uit. | Invito a mis amigos para el sábado. |
| O31 | Wanneer kom je terug?<br>*También:* Wanneer kom jij terug? | ¿Cuándo vuelves? |
| O32 | Ze legt het nog een keer uit.<br>*También:* Zij legt het nog een keer uit. | Ella lo explica otra vez. |

### Niet y geen

> Niet va detrás del verbo y del objeto con artículo, pero delante del participio, del infinitivo, de la partícula, del adjetivo y del lugar. Con un sustantivo sin artículo o con een, se usa geen.

| # | Neerlandés | Español |
|---|---|---|
| O33 | Ik kom morgen niet.<br>*También:* Morgen kom ik niet. | Mañana no vengo. |
| O34 | Ik heb het niet gezien. | No lo he visto. |
| O35 | Dat is niet waar. | Eso no es verdad. |
| O36 | We gaan vanavond niet uit.<br>*También:* Vanavond gaan we niet uit. | Esta noche no salimos. |
| O37 | Ik begrijp het niet. | No lo entiendo. |
| O38 | Hij wil niet meekomen. | No quiere venir con nosotros. |
| O39 | Ik heb vandaag geen tijd.<br>*También:* Vandaag heb ik geen tijd. | Hoy no tengo tiempo. |
| O40 | Ik woon niet in het centrum. | No vivo en el centro. |

### Preguntas

> En las preguntas el verbo va primero, o justo detrás de la palabra interrogativa (wat, waar, hoe…). Si jij va detrás del verbo, el verbo pierde la -t: «Werk jij morgen?».

| # | Neerlandés | Español |
|---|---|---|
| O41 | Werk jij morgen?<br>*También:* Werk je morgen? | ¿Trabajas mañana? |
| O42 | Waar woont je zus?<br>*También:* Waar woont jouw zus? | ¿Dónde vive tu hermana? |
| O43 | Wat ga je dit weekend doen?<br>*También:* Wat ga jij dit weekend doen? | ¿Qué vas a hacer este fin de semana? |
| O44 | Heb je zin in koffie?<br>*También:* Heb jij zin in koffie? | ¿Te apetece un café? |
| O45 | Hoe gaat het met je moeder?<br>*También:* Hoe gaat het met jouw moeder? | ¿Qué tal está tu madre? |
| O46 | Kom jij ook naar het feest?<br>*También:* Kom je ook naar het feest? | ¿Tú también vienes a la fiesta? |
| O47 | Hoe lang woon je al in Nederland?<br>*También:* Hoe lang woon jij al in Nederland? | ¿Cuánto tiempo llevas viviendo en los Países Bajos? |
| O48 | Waarom lach je?<br>*También:* Waarom lach jij? | ¿Por qué te ríes? |

### Subordinadas

> Después de dat, omdat, als, of, waar… el verbo conjugado se va al final de esa parte de la frase.

| # | Neerlandés | Español |
|---|---|---|
| O49 | Ik blijf thuis omdat ik niet lekker ben. | Me quedo en casa porque no me encuentro bien. |
| O50 | Ik denk dat het morgen gaat regenen. | Creo que mañana va a llover. |
| O51 | Weet je of ze vanavond komt?<br>*También:* Weet jij of ze vanavond komt? / Weet je of zij vanavond komt? | ¿Sabes si viene esta noche? |
| O52 | Ze zegt dat ze geen tijd heeft.<br>*También:* Zij zegt dat ze geen tijd heeft. | Dice que no tiene tiempo. |
| O53 | Ik bel je als ik thuis ben.<br>*También:* Als ik thuis ben, bel ik je. | Te llamo cuando esté en casa. |
| O54 | Hij weet niet waar de sleutels liggen. | No sabe dónde están las llaves. |
| O55 | Ik ben blij dat jullie er zijn. | Me alegro de que estéis aquí. |
| O56 | We gaan naar binnen omdat het koud is. | Entramos porque hace frío. |

### Subordinada delante

> Si la frase empieza por la subordinada, esa subordinada ocupa la primera posición: la principal sigue con el verbo y después el sujeto («Als ik tijd heb, kom ik langs»).

| # | Neerlandés | Español |
|---|---|---|
| O57 | Als ik tijd heb, kom ik langs.<br>*También:* Ik kom langs als ik tijd heb. | Si tengo tiempo, me paso. |
| O58 | Toen ik in Spanje woonde, sprak ik geen Nederlands.<br>*También:* Ik sprak geen Nederlands toen ik in Spanje woonde. | Cuando vivía en España, no hablaba neerlandés. |
| O59 | Als het mooi weer is, gaan we naar het strand.<br>*También:* We gaan naar het strand als het mooi weer is. | Si hace buen tiempo, vamos a la playa. |
| O60 | Omdat het regent, blijven we binnen.<br>*También:* We blijven binnen omdat het regent. | Como llueve, nos quedamos dentro. |
| O61 | Als je wilt, kunnen we samen koken.<br>*También:* We kunnen samen koken als je wilt. | Si quieres, podemos cocinar juntos. |
| O62 | Nadat we gegeten hebben, gaan we wandelen.<br>*También:* We gaan wandelen nadat we gegeten hebben. / Nadat we hebben gegeten, gaan we wandelen. / We gaan wandelen nadat we hebben gegeten. | Después de comer, vamos a pasear. |
| O63 | Als ik slaap heb, spreek ik slechter Nederlands.<br>*También:* Ik spreek slechter Nederlands als ik slaap heb. | Cuando tengo sueño, hablo peor neerlandés. |
| O64 | Zodra ik thuis ben, stuur ik je een berichtje.<br>*También:* Ik stuur je een berichtje zodra ik thuis ben. | En cuanto esté en casa, te mando un mensaje. |

## Verbos (V1 a V58)

**V1. werken**: trabajar

- Presente: ik werk, jij werkt, hij werkt, wij, jullie, zij werken. «Ik werk thuis.» «Werk jij thuis?»
- Perfectum: heeft gewerkt. «Ik heb de hele dag gewerkt.» He trabajado todo el día.
- Pasado: werkte, werkten. «Vroeger werkte ik in een restaurant.» Antes trabajaba en un restaurante.

**V2. wonen**: vivir (en un sitio)

- Presente: ik woon, jij woont, hij woont, wij, jullie, zij wonen. «Ik woon in Amsterdam.» «Woon jij in Amsterdam?»
- Perfectum: heeft gewoond. «We hebben drie jaar in Utrecht gewoond.» Vivimos tres años en Utrecht.
- Pasado: woonde, woonden. «Toen woonden we in Madrid.» Entonces vivíamos en Madrid.

**V3. maken**: hacer, preparar

- Presente: ik maak, jij maakt, hij maakt, wij, jullie, zij maken. «Ik maak het ontbijt.» «Maak jij het ontbijt?»
- Perfectum: heeft gemaakt. «Ik heb een fout gemaakt.» He cometido un error.
- Pasado: maakte, maakten. «Mijn moeder maakte altijd paella.» Mi madre siempre hacía paella.

**V4. praten**: hablar, charlar

- Presente: ik praat, jij praat, hij praat, wij, jullie, zij praten. «Ik praat met de buren.» «Praat jij met de buren?»
- Perfectum: heeft gepraat. «Ik heb lang met mijn schoonvader gepraat.» He hablado mucho rato con mi suegro.

**V5. fietsen**: ir en bici

- Presente: ik fiets, jij fietst, hij fietst, wij, jullie, zij fietsen. «Ik fiets naar het werk.» «Fiets jij naar het werk?»
- Perfectum: is gefietst. «Ik ben naar mijn werk gefietst.» He ido al trabajo en bici.
- Nota: Con zijn si dices adónde (naar mijn werk); con hebben si solo cuentas la actividad (ik heb een uur gefietst).

**V6. koken**: cocinar

- Presente: ik kook, jij kookt, hij kookt, wij, jullie, zij koken. «Ik kook vanavond.» «Kook jij vanavond?»
- Perfectum: heeft gekookt. «Hij heeft voor iedereen gekookt.» Ha cocinado para todos.

**V7. leren**: aprender

- Presente: ik leer, jij leert, hij leert, wij, jullie, zij leren. «Ik leer Nederlands.» «Leer jij Nederlands?»
- Perfectum: heeft geleerd. «Ik heb veel nieuwe woorden geleerd.» He aprendido muchas palabras nuevas.

**V8. wachten**: esperar

- Presente: ik wacht, jij wacht, hij wacht, wij, jullie, zij wachten. «Ik wacht op de bus.» «Wacht jij op de bus?»
- Perfectum: heeft gewacht. «We hebben een half uur gewacht.» Hemos esperado media hora.

**V9. betalen**: pagar

- Presente: ik betaal, jij betaalt, hij betaalt, wij, jullie, zij betalen. «Ik betaal de rekening.» «Betaal jij de rekening?»
- Perfectum: heeft betaald. «Ik heb de rekening al betaald.» Ya he pagado la cuenta.
- Nota: Sin ge-: los verbos con be-, ver-, ge-, her-, ont- o er- no lo llevan.

**V10. spelen**: jugar

- Presente: ik speel, jij speelt, hij speelt, wij, jullie, zij spelen. «Ik speel met de kinderen.» «Speel jij met de kinderen?»
- Perfectum: heeft gespeeld. «De kinderen hebben de hele middag buiten gespeeld.» Los niños han jugado fuera toda la tarde.

**V11. bellen**: llamar por teléfono

- Presente: ik bel, jij belt, hij belt, wij, jullie, zij bellen. «Ik bel de huisarts.» «Bel jij de huisarts?»
- Perfectum: heeft gebeld. «Mijn moeder heeft gisteren gebeld.» Mi madre llamó ayer.

**V12. verhuizen**: mudarse

- Presente: ik verhuis, jij verhuist, hij verhuist, wij, jullie, zij verhuizen. «Ik verhuis volgende maand.» «Verhuis jij volgende maand?»
- Perfectum: is verhuisd. «We zijn vorig jaar verhuisd.» Nos mudamos el año pasado.
- Nota: La z de la raíz se escribe s (ik verhuis), pero el participio acaba en d porque el infinitivo tiene z.

**V13. reizen**: viajar

- Perfectum: heeft gereisd. «Ze hebben veel gereisd.» Han viajado mucho.

**V14. dansen**: bailar

- Perfectum: heeft gedanst. «We hebben de hele avond gedanst.» Hemos bailado toda la noche.

**V15. vragen**: preguntar, pedir

- Perfectum: heeft gevraagd. «Ik heb de weg gevraagd.» He preguntado el camino.

**V16. trouwen**: casarse

- Perfectum: is getrouwd. «Ze zijn in juni getrouwd.» Se casaron en junio.

**V17. stoppen**: parar, dejar de

- Perfectum: is gestopt. «Ik ben gestopt met roken.» He dejado de fumar.

**V18. zijn**: ser, estar

- Presente: ik ben, jij bent, hij is, wij, jullie, zij zijn. «Ik ben thuis.» «Ben jij thuis?»
- Perfectum: is geweest. «Ik ben nog nooit in Groningen geweest.» Nunca he estado en Groningen.
- Pasado: was, waren. «Gisteren was het erg druk in de stad.» Ayer había mucha gente en el centro.

**V19. hebben**: tener

- Presente: ik heb, jij hebt, hij heeft, wij, jullie, zij hebben. «Ik heb een fiets.» «Heb jij een fiets?»
- Perfectum: heeft gehad. «Ik heb vorige week griep gehad.» La semana pasada tuve gripe.
- Pasado: had, hadden. «Vroeger had ik een hond.» Antes tenía un perro.

**V20. gaan**: ir

- Presente: ik ga, jij gaat, hij gaat, wij, jullie, zij gaan. «Ik ga naar huis.» «Ga jij naar huis?»
- Perfectum: is gegaan. «Ik ben naar de dokter gegaan.» He ido al médico.
- Pasado: ging, gingen. «Vorige week gingen we naar Antwerpen.» La semana pasada fuimos a Amberes.

**V21. komen**: venir

- Presente: ik kom, jij komt, hij komt, wij, jullie, zij komen. «Ik kom morgen.» «Kom jij morgen?»
- Perfectum: is gekomen. «Ze zijn te laat gekomen.» Han llegado tarde.
- Pasado: kwam, kwamen. «Hij kwam om negen uur thuis.» Llegó a casa a las nueve.

**V22. doen**: hacer (una actividad)

- Presente: ik doe, jij doet, hij doet, wij, jullie, zij doen. «Ik doe de boodschappen.» «Doe jij de boodschappen?»
- Perfectum: heeft gedaan. «Ik heb de boodschappen gedaan.» He hecho la compra.
- Pasado: deed, deden. «Ze deed alles alleen.» Ella lo hacía todo sola.

**V23. zien**: ver

- Presente: ik zie, jij ziet, hij ziet, wij, jullie, zij zien. «Ik zie het probleem.» «Zie jij het probleem?»
- Perfectum: heeft gezien. «Ik heb die film al gezien.» Ya he visto esa película.
- Pasado: zag, zagen. «Ik zag je gisteren in de supermarkt.» Ayer te vi en el supermercado.

**V24. staan**: estar de pie

- Presente: ik sta, jij staat, hij staat, wij, jullie, zij staan. «Ik sta in de file.» «Sta jij in de file?»
- Perfectum: heeft gestaan. «Ik heb een uur in de file gestaan.» He estado una hora en un atasco.
- Pasado: stond, stonden. «Er stond een lange rij.» Había una cola larga.

**V25. weten**: saber

- Presente: ik weet, jij weet, hij weet, wij, jullie, zij weten. «Ik weet het antwoord.» «Weet jij het antwoord?»
- Perfectum: heeft geweten. «Ik heb het altijd geweten.» Siempre lo he sabido.
- Pasado: wist, wisten. «Dat wist ik niet.» No lo sabía.

**V26. willen**: querer

- Presente: ik wil, jij wilt/wil, hij wil, wij, jullie, zij willen. «Ik wil een kopje koffie.» «Wil jij een kopje koffie?»
- Pasado: wilde/wou, wilden/wouden. «Ze wilde naar huis.» Quería irse a casa.

**V27. kunnen**: poder (ser capaz)

- Presente: ik kan, jij kunt/kan, hij kan, wij, jullie, zij kunnen. «Ik kan goed koken.» «Kun jij goed koken?» (también «kan jij»)
- Pasado: kon, konden. «Ik kon niet slapen.» No podía dormir.

**V28. mogen**: poder (tener permiso)

- Presente: ik mag, jij mag, hij mag, wij, jullie, zij mogen. «Ik mag hier parkeren.» «Mag jij hier parkeren?»
- Pasado: mocht, mochten. «We mochten niet binnenkomen.» No nos dejaban entrar.

**V29. moeten**: tener que

- Presente: ik moet, jij moet, hij moet, wij, jullie, zij moeten. «Ik moet morgen vroeg werken.» «Moet jij morgen vroeg werken?»
- Pasado: moest, moesten. «We moesten lang wachten.» Tuvimos que esperar mucho.

**V30. zullen**: futuro y ofrecimientos (zal ik…?)

- Presente: ik zal, jij zult/zal, hij zal, wij, jullie, zij zullen. «Ik zal het morgen doen.»
- Pasado: zou, zouden. «Je zou me bellen.» Ibas a llamarme.

**V31. eten**: comer

- Presente: ik eet, jij eet, hij eet, wij, jullie, zij eten. «Ik eet om zes uur.» «Eet jij om zes uur?»
- Perfectum: heeft gegeten. «We hebben te veel gegeten.» Hemos comido demasiado.
- Pasado: at, aten. «We aten elke zondag bij mijn oma.» Comíamos todos los domingos en casa de mi abuela.

**V32. drinken**: beber

- Presente: ik drink, jij drinkt, hij drinkt, wij, jullie, zij drinken. «Ik drink thee.» «Drink jij thee?»
- Perfectum: heeft gedronken. «Ik heb te veel koffie gedronken.» He bebido demasiado café.
- Pasado: dronk, dronken. «Hij dronk geen alcohol.» No bebía alcohol.

**V33. slapen**: dormir

- Presente: ik slaap, jij slaapt, hij slaapt, wij, jullie, zij slapen. «Ik slaap slecht.» «Slaap jij slecht?»
- Perfectum: heeft geslapen. «Ik heb slecht geslapen.» He dormido mal.
- Pasado: sliep, sliepen. «De baby sliep de hele nacht.» El bebé durmió toda la noche.

**V34. lezen**: leer

- Presente: ik lees, jij leest, hij leest, wij, jullie, zij lezen. «Ik lees de krant.» «Lees jij de krant?»
- Perfectum: heeft gelezen. «Ik heb het boek in een week gelezen.» Me he leído el libro en una semana.
- Pasado: las, lazen. «Ik las elke avond een boek.» Leía un libro cada noche.

**V35. zitten**: estar sentado

- Presente: ik zit, jij zit, hij zit, wij, jullie, zij zitten. «Ik zit in de trein.» «Zit jij in de trein?»
- Perfectum: heeft gezeten. «We hebben de hele dag binnen gezeten.» Hemos estado dentro todo el día.
- Pasado: zat, zaten. «We zaten de hele avond te praten.» Estuvimos toda la noche hablando.

**V36. schrijven**: escribir

- Perfectum: heeft geschreven. «Ik heb een lange mail geschreven.» He escrito un correo largo.
- Pasado: schreef, schreven. «Ze schreef me een lange brief.» Me escribió una carta larga.

**V37. spreken**: hablar (un idioma, con alguien)

- Perfectum: heeft gesproken. «Ik heb vandaag alleen Nederlands gesproken.» Hoy solo he hablado neerlandés.
- Pasado: sprak, spraken. «Toen sprak ik nog geen Nederlands.» Entonces todavía no hablaba neerlandés.

**V38. nemen**: coger, tomar

- Perfectum: heeft genomen. «We hebben de trein genomen.» Hemos cogido el tren.
- Pasado: nam, namen. «We namen de laatste trein.» Cogimos el último tren.

**V39. geven**: dar

- Perfectum: heeft gegeven. «Ik heb haar een cadeau gegeven.» Le he dado un regalo.
- Pasado: gaf, gaven. «Mijn opa gaf me altijd snoep.» Mi abuelo siempre me daba caramelos.

**V40. vinden**: encontrar; opinar

- Perfectum: heeft gevonden. «Ik heb mijn sleutels gevonden.» He encontrado mis llaves.
- Pasado: vond, vonden. «Ik vond de film heel mooi.» La película me pareció muy bonita.

**V41. blijven**: quedarse

- Perfectum: is gebleven. «We zijn de hele dag thuis gebleven.» Nos hemos quedado en casa todo el día.
- Pasado: bleef, bleven. «We bleven tot middernacht.» Nos quedamos hasta medianoche.

**V42. beginnen**: empezar

- Perfectum: is begonnen. «Ik ben met een nieuwe cursus begonnen.» He empezado un curso nuevo.
- Pasado: begon, begonnen. «Het begon te regenen.» Empezó a llover.

**V43. krijgen**: recibir

- Perfectum: heeft gekregen. «Ik heb een berichtje van je zus gekregen.» He recibido un mensaje de tu hermana.
- Pasado: kreeg, kregen. «Ik kreeg een mooi cadeau.» Me dieron un regalo bonito.

**V44. denken**: pensar

- Perfectum: heeft gedacht. «Ik heb de hele dag aan je gedacht.» He pensado en ti todo el día.
- Pasado: dacht, dachten. «Ik dacht dat je thuis was.» Pensaba que estabas en casa.

**V45. brengen**: llevar (algo o a alguien)

- Perfectum: heeft gebracht. «Hij heeft de kinderen naar school gebracht.» Ha llevado a los niños al colegio.
- Pasado: bracht, brachten. «Hij bracht bloemen voor mijn schoonmoeder.» Trajo flores para mi suegra.

**V46. kopen**: comprar

- Perfectum: heeft gekocht. «Ik heb nieuwe schoenen gekocht.» Me he comprado zapatos nuevos.
- Pasado: kocht, kochten. «We kochten een oud huis.» Compramos una casa vieja.

**V47. zoeken**: buscar

- Perfectum: heeft gezocht. «Ik heb overal gezocht.» He buscado por todas partes.

**V48. worden**: ponerse, volverse

- Perfectum: is geworden. «Hij is ziek geworden.» Se ha puesto enfermo.
- Pasado: werd, werden. «Het werd steeds kouder.» Cada vez hacía más frío.

**V49. vergeten**: olvidar

- Perfectum: is vergeten. «Ik ben zijn naam vergeten.» He olvidado su nombre.
- Nota: Con zijn cuando algo se te va de la cabeza; con hebben cuando te dejas algo en un sitio (ik heb mijn sleutels vergeten).

**V50. begrijpen**: entender

- Perfectum: heeft begrepen. «Ik heb het niet begrepen.» No lo he entendido.

**V51. helpen**: ayudar

- Perfectum: heeft geholpen. «Mijn buurman heeft me geholpen.» Mi vecino me ha ayudado.

**V52. zeggen**: decir

- Perfectum: heeft gezegd. «Ze heeft niets gezegd.» No ha dicho nada.
- Pasado: zei, zeiden. «Hij zei dat hij moe was.» Dijo que estaba cansado.

**V53. liggen**: estar tumbado, estar (algo plano)

- Perfectum: heeft gelegen. «Ik heb de hele ochtend in bed gelegen.» He estado toda la mañana en la cama.
- Pasado: lag, lagen. «De sleutels lagen op tafel.» Las llaves estaban en la mesa.

**V54. vallen**: caerse

- Perfectum: is gevallen. «Ze is van de fiets gevallen.» Se ha caído de la bici.

**V55. lopen**: andar, caminar

- Perfectum: is gelopen. «We zijn naar huis gelopen.» Hemos vuelto a casa andando.
- Pasado: liep, liepen. «We liepen langs de gracht.» Paseábamos junto al canal.
- Nota: Con zijn si dices adónde (naar huis); con hebben si solo cuentas la actividad (ik heb een uur gelopen).

**V56. rijden**: conducir, ir en coche

- Perfectum: is gereden. «Ik ben naar Rotterdam gereden.» He ido en coche a Rotterdam.
- Nota: Con zijn si dices adónde (naar Rotterdam); con hebben si solo cuentas la actividad.

**V57. kiezen**: elegir

- Perfectum: heeft gekozen. «We hebben een restaurant gekozen.» Hemos elegido un restaurante.

**V58. winnen**: ganar

- Perfectum: heeft gewonnen. «Ajax heeft gisteren gewonnen.» El Ajax ganó ayer.

## Verbos separables (S1 a S15)

**S1. opbellen**: llamar por teléfono

- Presente: «Ik bel je vanavond op.» Te llamo esta noche. También: «Vanavond bel ik je op.»
- Perfectum: heeft opgebeld. «Ik heb je gisteren opgebeld.» Te llamé ayer.

**S2. opstaan**: levantarse

- Presente: «Ik sta elke dag om zeven uur op.» Me levanto todos los días a las siete. También: «Elke dag sta ik om zeven uur op.»
- Perfectum: is opgestaan. «Ik ben vandaag laat opgestaan.» Hoy me he levantado tarde.

**S3. meenemen**: llevar consigo, traer

- Presente: «Ik neem een fles wijn mee.» Llevo una botella de vino.
- Perfectum: heeft meegenomen. «Ik heb een paraplu meegenomen.» Me he traído un paraguas.

**S4. terugkomen**: volver

- Presente: «We komen zondag terug.» Volvemos el domingo. También: «Zondag komen we terug.»
- Perfectum: is teruggekomen. «Hij is gisteren teruggekomen.» Volvió ayer.

**S5. uitgaan**: salir (de fiesta)

- Presente: «We gaan zaterdag uit.» El sábado salimos. También: «Zaterdag gaan we uit.»
- Perfectum: is uitgegaan. «We zijn gisteren uitgegaan.» Ayer salimos.

**S6. aankomen**: llegar

- Presente: «De trein komt om drie uur aan.» El tren llega a las tres. También: «Om drie uur komt de trein aan.»
- Perfectum: is aangekomen. «We zijn net aangekomen.» Acabamos de llegar.

**S7. ophalen**: recoger (a alguien)

- Presente: «Ik haal je om acht uur op.» Te recojo a las ocho. También: «Om acht uur haal ik je op.»
- Perfectum: heeft opgehaald. «Ik heb de kinderen opgehaald.» He recogido a los niños.

**S8. afspreken**: quedar (con alguien)

- Presente: «We spreken morgen af.» Quedamos mañana. También: «Morgen spreken we af.»
- Perfectum: heeft afgesproken. «We hebben om zes uur afgesproken.» Hemos quedado a las seis.

**S9. opruimen**: ordenar, recoger

- Presente: «Ik ruim mijn kamer op.» Ordeno mi habitación.
- Perfectum: heeft opgeruimd. «Ik heb de keuken opgeruimd.» He recogido la cocina.

**S10. uitleggen**: explicar

- Presente: «Zij legt de regels uit.» Ella explica las reglas. También: «Ze legt de regels uit.»
- Perfectum: heeft uitgelegd. «Hij heeft het goed uitgelegd.» Lo ha explicado bien.

**S11. uitnodigen**: invitar

- Presente: «We nodigen de buren uit.» Invitamos a los vecinos.
- Perfectum: heeft uitgenodigd. «Ze hebben ons voor de bruiloft uitgenodigd.» Nos han invitado a la boda.

**S12. langskomen**: pasarse (a ver a alguien)

- Presente: «Mijn schoonouders komen vanavond langs.» Mis suegros se pasan esta noche. También: «Vanavond komen mijn schoonouders langs.»
- Perfectum: is langsgekomen. «Je zus is vanmiddag langsgekomen.» Tu hermana se ha pasado esta tarde.

**S13. schoonmaken**: limpiar

- Presente: «Ik maak de badkamer schoon.» Limpio el baño.
- Perfectum: heeft schoongemaakt. «We hebben het hele huis schoongemaakt.» Hemos limpiado toda la casa.

**S14. aantrekken**: ponerse (ropa)

- Presente: «Ik trek een jas aan.» Me pongo un abrigo.
- Perfectum: heeft aangetrokken. «Ik heb mijn nieuwe trui aangetrokken.» Me he puesto el jersey nuevo.

**S15. meedoen**: participar, apuntarse

- Presente: «Ik doe ook mee.» Yo también me apunto.
- Perfectum: heeft meegedaan. «Ze heeft aan de marathon meegedaan.» Ha participado en el maratón.

## Vocabulario (P1 a P128)

### Familia y gente

| # | Neerlandés | Español | Nota |
|---|---|---|---|
| P1 | de vriendin | la novia (o la amiga) | Según el contexto, novia o amiga. «Mijn vriendin» suele ser «mi novia». |
| P2 | de schoonouders | los suegros |  |
| P3 | de schoonmoeder | la suegra |  |
| P4 | de schoonvader | el suegro |  |
| P5 | de zwager | el cuñado |  |
| P6 | de schoonzus | la cuñada |  |
| P7 | de broer | el hermano |  |
| P8 | de zus | la hermana |  |
| P9 | de ouders | los padres |  |
| P10 | de opa | el abuelo |  |
| P11 | de oma | la abuela |  |
| P12 | de buurman | el vecino |  |
| P13 | de buurvrouw | la vecina |  |
| P14 | de collega | el compañero de trabajo |  |
| P15 | het kind | el niño |  |
| P16 | het gezin | la familia (padres e hijos) | Het gezin es la familia que vive junta; de familie, toda la familia. |
| P17 | de familie | la familia (toda) |  |
| P18 | het meisje | la chica | Los diminutivos (-je) son siempre het. |
| P19 | de jongen | el chico |  |
| P20 | de baby | el bebé |  |

### Casa y comida

| # | Neerlandés | Español | Nota |
|---|---|---|---|
| P21 | het huis | la casa |  |
| P22 | de keuken | la cocina |  |
| P23 | de woonkamer | el salón |  |
| P24 | de slaapkamer | el dormitorio |  |
| P25 | de badkamer | el baño |  |
| P26 | het raam | la ventana |  |
| P27 | de deur | la puerta |  |
| P28 | de tuin | el jardín |  |
| P29 | de koelkast | la nevera |  |
| P30 | het bed | la cama |  |
| P31 | het ontbijt | el desayuno |  |
| P32 | het avondeten | la cena |  |
| P33 | de boterham | la rebanada de pan (con algo encima) |  |
| P34 | het brood | el pan |  |
| P35 | de kaas | el queso |  |
| P36 | het vlees | la carne |  |
| P37 | de groente | la verdura |  |
| P38 | het fruit | la fruta |  |
| P39 | de taart | la tarta |  |
| P40 | het glas | el vaso |  |
| P41 | het bord | el plato |  |
| P42 | het mes | el cuchillo |  |
| P43 | de vork | el tenedor |  |
| P44 | de lepel | la cuchara |  |

### Tiempo y planes

| # | Neerlandés | Español | Nota |
|---|---|---|---|
| P45 | de afspraak | la cita |  |
| P46 | de verjaardag | el cumpleaños |  |
| P47 | het feest | la fiesta |  |
| P48 | de vakantie | las vacaciones |  |
| P49 | het weer | el tiempo (que hace) |  |
| P50 | de regen | la lluvia |  |
| P51 | de zon | el sol |  |
| P52 | de week | la semana |  |
| P53 | de maand | el mes |  |
| P54 | het jaar | el año |  |
| P55 | het uur | la hora |  |
| P56 | de ochtend | la mañana |  |
| P57 | de middag | la tarde (hasta las seis) |  |
| P58 | de avond | la noche (antes de acostarse) | De avond es de la cena a la hora de dormir; de nacht, cuando ya se duerme. |
| P59 | vanavond | esta noche |  |
| P60 | vanochtend<br>*También:* vanmorgen | esta mañana |  |
| P61 | overmorgen | pasado mañana |  |
| P62 | eergisteren | anteayer |  |
| P63 | straks | luego, dentro de un rato |  |
| P64 | meteen | enseguida |  |
| P65 | binnenkort | pronto, dentro de poco |  |
| P66 | net | hace un momento | «Ik ben net thuis»: acabo de llegar a casa. |

### Trabajo y ciudad

| # | Neerlandés | Español | Nota |
|---|---|---|---|
| P67 | het werk | el trabajo |  |
| P68 | de baan | el empleo, el puesto |  |
| P69 | de vergadering | la reunión |  |
| P70 | de fiets | la bici |  |
| P71 | het station | la estación |  |
| P72 | de trein | el tren |  |
| P73 | de winkel | la tienda |  |
| P74 | de boodschappen | la compra (del súper) |  |
| P75 | de rekening | la cuenta, la factura |  |
| P76 | het geld | el dinero |  |
| P77 | de gemeente | el ayuntamiento |  |
| P78 | de huisarts | el médico de cabecera |  |
| P79 | de apotheek | la farmacia |  |
| P80 | het ziekenhuis | el hospital |  |
| P81 | de straat | la calle |  |
| P82 | de stad | la ciudad |  |
| P83 | de buurt | el barrio |  |
| P84 | het centrum | el centro |  |
| P85 | de file | el atasco |  |

### Para conversar

| # | Neerlandés | Español | Nota |
|---|---|---|---|
| P86 | eigenlijk | en realidad |  |
| P87 | gewoon | simplemente; normal |  |
| P88 | trouwens | por cierto |  |
| P89 | volgens mij | creo que, en mi opinión |  |
| P90 | dat klopt | es verdad, correcto |  |
| P91 | dat maakt niet uit | da igual |  |
| P92 | geen idee | ni idea |  |
| P93 | ik heb zin in | me apetece (algo) | «Ik heb zin in koffie», «Ik heb zin om te gaan». |
| P94 | het valt mee | no es para tanto |  |
| P95 | het spijt me | lo siento |  |
| P96 | wat jammer | qué pena |  |
| P97 | gezellig | agradable, acogedor | Para un ambiente, una casa o una reunión a gusto. Muy neerlandés. |
| P98 | lekker | rico; a gusto |  |
| P99 | even | un momento (suaviza una petición) | «Kun je even helpen?»: ¿me ayudas un momento? |
| P100 | toch | ¿verdad? (al final de la frase) |  |
| P101 | nou | bueno… (para arrancar o dudar) |  |
| P102 | inderdaad | efectivamente |  |
| P103 | misschien | quizás |  |
| P104 | natuurlijk | claro, por supuesto |  |
| P105 | helaas | por desgracia |  |
| P106 | eindelijk | por fin |  |

### Cómo es, cómo está

| # | Neerlandés | Español | Nota |
|---|---|---|---|
| P107 | druk | ocupado, con mucho lío |  |
| P108 | rustig | tranquilo |  |
| P109 | moe | cansado |  |
| P110 | moeilijk | difícil |  |
| P111 | makkelijk | fácil |  |
| P112 | duur | caro |  |
| P113 | goedkoop | barato |  |
| P114 | vroeg | temprano |  |
| P115 | laat | tarde (de hora) | «Het is al laat»: ya es tarde. |
| P116 | ziek | enfermo |  |
| P117 | boos | enfadado |  |
| P118 | blij | contento |  |
| P119 | bang | con miedo |  |
| P120 | klaar | listo, terminado |  |
| P121 | vaak | a menudo |  |
| P122 | soms | a veces |  |
| P123 | nooit | nunca |  |
| P124 | altijd | siempre |  |
| P125 | al | ya |  |
| P126 | nog | todavía |  |
| P127 | weer | otra vez |  |
| P128 | samen | juntos |  |

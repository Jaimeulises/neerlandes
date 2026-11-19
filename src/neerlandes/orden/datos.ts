// Frases para practicar el orden de las palabras, agrupadas por la estructura
// que entrenan. Están pensadas para el error típico de quien piensa en inglés:
// poner el sujeto antes del verbo cuando no toca y dejar el verbo en medio
// cuando debería ir al final.
//
// Cómo se escribe cada frase:
// - fichas: los trozos que se ordenan, separados por «|», tal como van en mitad
//   de frase (la mayúscula inicial y el punto los pone la app).
// - final: «?» en las preguntas.
// - otras: otras formas buenas de decirla. Las que usan las mismas fichas valen
//   también al ordenar; todas valen al traducir. Al dictar solo vale la que suena.
//   Las formas tónicas del sujeto (wij por we, mij por me, zij por ze al principio)
//   no hace falta apuntarlas: al traducir se añaden solas (conFormasTonicas).
// - pista: lo que se enseña al traducir para que salga la estructura.
//
// Pendiente de revisión por una persona nativa (ver docs/revision.md).

export const GRUPOS_ORDEN = ['inversion', 'modal', 'perfectum', 'separables', 'niet', 'preguntas', 'subordinada', 'subordinada-delante'] as const;

export type GrupoOrden = (typeof GRUPOS_ORDEN)[number];

export const NOMBRES_GRUPO_ORDEN: Readonly<Record<GrupoOrden, string>> = {
  inversion: 'Inversión',
  modal: 'Verbos modales',
  perfectum: 'Perfectum',
  separables: 'Verbos separables',
  niet: 'Niet y geen',
  preguntas: 'Preguntas',
  subordinada: 'Subordinadas',
  'subordinada-delante': 'Subordinada delante',
};

/** La regla de cada grupo, en una o dos frases, para presentarla y recordarla al corregir. */
export const REGLAS_ORDEN: Readonly<Record<GrupoOrden, string>> = {
  inversion:
    'Si la frase empieza por algo que no es el sujeto (morgen, vandaag, in het weekend…), el verbo va en segunda posición y el sujeto justo detrás. En inglés se dice «Now I have time»; en neerlandés, «Nu heb ik tijd». En, maar y want no cuentan: detrás va el orden normal («want ik ben moe»).',
  modal:
    'Con willen, kunnen, moeten, mogen, zullen o gaan + infinitivo, ese verbo va en segunda posición (en primera si es una pregunta de sí o no: «Kun je me helpen?») y el infinitivo se va al final.',
  perfectum:
    'En el perfectum, hebben o zijn van en segunda posición (en primera si es una pregunta de sí o no: «Heb je al gegeten?») y el participio se va al final de la frase.',
  separables:
    'En los verbos separables (opbellen, opstaan, meenemen…), cuando el verbo va conjugado en la frase principal, en presente o en pasado, la partícula se separa y se va al final. Con un modal o en una subordinada va pegada al verbo: «Ik wil je opbellen», «omdat ik je opbel».',
  niet: 'Niet va detrás del verbo, de las palabras que dicen cuándo (morgen, vandaag, vanavond…) y del objeto definido (de film, mijn fiets, het, hem), pero delante del participio, del infinitivo, de la partícula, del adjetivo y del lugar. Con un sustantivo sin artículo o con een, se usa geen.',
  preguntas:
    'En las preguntas el verbo va primero, o justo detrás de la palabra interrogativa (wat, waar, hoe…). Si el sujeto es jij o je y va detrás del verbo, el verbo pierde la -t: «Drink jij koffie?». Si je es «tu», la -t se queda: «Waar werkt je vriend?».',
  subordinada:
    'Después de dat, omdat, als, of (si), waar… el verbo conjugado se va al final de esa parte de la frase: «omdat ik moe ben». Si hay también un infinitivo o un participio, los verbos van juntos al final: «dat ik morgen moet werken», «dat ik het heb gezien» o «dat ik het gezien heb».',
  'subordinada-delante':
    'Si la frase empieza por la subordinada, esa subordinada ocupa la primera posición y se cierra con una coma: la principal sigue con el verbo y después el sujeto («Als het regent, neem ik de tram»).',
};

export interface DatosFrase {
  readonly grupo: GrupoOrden;
  readonly fichas: string;
  readonly es: string;
  readonly final?: '.' | '?';
  readonly otras?: readonly string[];
  readonly pista?: string;
}

export const FRASES: readonly DatosFrase[] = [
  // Inversión
  { grupo: 'inversion', fichas: 'morgen|ga|ik|naar mijn schoonouders', es: 'Mañana voy a casa de mis suegros.', otras: ['ik ga morgen naar mijn schoonouders'], pista: 'Empieza por «Morgen».' },
  { grupo: 'inversion', fichas: 'vandaag|werk|ik|thuis', es: 'Hoy trabajo en casa.', otras: ['ik werk vandaag thuis'], pista: 'Empieza por «Vandaag».' },
  {
    grupo: 'inversion',
    fichas: 'in het weekend|fietsen|we|vaak naar het strand',
    es: 'El fin de semana vamos a menudo en bici a la playa.',
    otras: [
      'we fietsen in het weekend vaak naar het strand',
      'in het weekend gaan we vaak met de fiets naar het strand',
      'we gaan in het weekend vaak met de fiets naar het strand',
      'in het weekend gaan we vaak op de fiets naar het strand',
      'we gaan in het weekend vaak op de fiets naar het strand',
    ],
    pista: 'Empieza por «In het weekend»; usa «fietsen».',
  },
  { grupo: 'inversion', fichas: "'s avonds|kijken|we|samen een serie", es: 'Por la noche vemos una serie juntos.', otras: ["we kijken 's avonds samen een serie", "'s avonds kijken we samen naar een serie", "we kijken 's avonds samen naar een serie"], pista: "Empieza por «'s Avonds»." },
  { grupo: 'inversion', fichas: 'gisteren|was|het|heel koud', es: 'Ayer hizo mucho frío.', otras: ['het was gisteren heel koud', 'gisteren was het erg koud', 'het was gisteren erg koud'], pista: 'Empieza por «Gisteren».' },
  { grupo: 'inversion', fichas: 'na het eten|drinken|we|koffie', es: 'Después de comer tomamos café.', otras: ['we drinken na het eten koffie', 'we drinken koffie na het eten'], pista: 'Empieza por «Na het eten».' },
  {
    grupo: 'inversion',
    fichas: 'volgende week|heb|ik|een afspraak bij de tandarts',
    es: 'La semana que viene tengo cita con el dentista.',
    otras: ['ik heb volgende week een afspraak bij de tandarts'],
    pista: 'Empieza por «Volgende week».',
  },
  { grupo: 'inversion', fichas: 'meestal|eten|we|om zes uur', es: 'Normalmente cenamos a las seis.', otras: ['we eten meestal om zes uur', 'om zes uur eten we meestal'], pista: 'Empieza por «Meestal».' },

  // Verbos modales
  { grupo: 'modal', fichas: 'ik|wil|morgen|een nieuwe fiets|kopen', es: 'Mañana quiero comprar una bici nueva.', otras: ['morgen wil ik een nieuwe fiets kopen'], pista: 'Con «willen»: el infinitivo al final.' },
  {
    grupo: 'modal',
    fichas: 'kun|je|het zout|even|aangeven',
    es: '¿Puedes pasarme la sal?',
    final: '?',
    otras: [
      'kun je even het zout aangeven',
      'kan je het zout even aangeven',
      'kan je even het zout aangeven',
      'kun jij het zout even aangeven',
      'kun je me het zout even aangeven',
      'kun je me even het zout aangeven',
      'kan je me het zout even aangeven',
      'kan je me even het zout aangeven',
      'kun je het zout aangeven',
      'kan je het zout aangeven',
      'kun je me het zout aangeven',
      'kan je me het zout aangeven',
    ],
    pista: 'Empieza por «Kun je»; usa «aangeven».',
  },
  { grupo: 'modal', fichas: 'we|moeten|om acht uur|bij mijn ouders|zijn', es: 'Tenemos que estar en casa de mis padres a las ocho.', otras: ['om acht uur moeten we bij mijn ouders zijn'], pista: 'Con «moeten».' },
  { grupo: 'modal', fichas: 'ik|ga|vanavond|voor iedereen|koken', es: 'Esta noche voy a cocinar para todos.', otras: ['vanavond ga ik voor iedereen koken'], pista: 'Con «gaan» + infinitivo.' },
  { grupo: 'modal', fichas: 'mag|ik|je|iets|vragen', es: '¿Puedo preguntarte una cosa?', final: '?', otras: ['mag ik je wat vragen', 'mag ik jou iets vragen', 'mag ik jou wat vragen'], pista: 'Empieza por «Mag ik».' },
  { grupo: 'modal', fichas: 'jullie|kunnen|bij ons|blijven slapen', es: 'Podéis quedaros a dormir en nuestra casa.', pista: 'Con «kunnen» y «blijven slapen».' },
  { grupo: 'modal', fichas: 'ik|wil|elke dag|Nederlands|spreken', es: 'Quiero hablar neerlandés todos los días.', otras: ['elke dag wil ik Nederlands spreken', 'ik wil iedere dag Nederlands spreken', 'iedere dag wil ik Nederlands spreken'], pista: 'Con «willen».' },
  { grupo: 'modal', fichas: 'zullen we|morgen|naar de markt|gaan', es: '¿Vamos mañana al mercado?', final: '?', pista: 'Empieza por «Zullen we».' },

  // Perfectum
  { grupo: 'perfectum', fichas: 'ik|heb|gisteren|de hele dag|gewerkt', es: 'Ayer trabajé todo el día.', otras: ['gisteren heb ik de hele dag gewerkt'], pista: 'En perfectum, con «werken».' },
  { grupo: 'perfectum', fichas: 'we|zijn|in het weekend|naar Utrecht|gegaan', es: 'El fin de semana fuimos a Utrecht.', otras: ['in het weekend zijn we naar Utrecht gegaan'], pista: 'En perfectum, con «gaan».' },
  { grupo: 'perfectum', fichas: 'heb|je|goed|geslapen', es: '¿Has dormido bien?', final: '?', otras: ['heb jij goed geslapen'], pista: 'En perfectum, con «slapen».' },
  { grupo: 'perfectum', fichas: 'ik|heb|mijn sleutels|vergeten', es: 'Me he olvidado las llaves.', otras: ['ik ben mijn sleutels vergeten'], pista: 'En perfectum, con «vergeten».' },
  { grupo: 'perfectum', fichas: 'mijn schoonmoeder|heeft|een taart|gebakken', es: 'Mi suegra ha hecho una tarta.', pista: 'En perfectum, con «bakken».' },
  { grupo: 'perfectum', fichas: 'ze|zijn|vorig jaar|naar Spanje|verhuisd', es: 'Se mudaron a España el año pasado.', otras: ['vorig jaar zijn ze naar Spanje verhuisd', 'vorig jaar zijn zij naar Spanje verhuisd'], pista: 'En perfectum, con «verhuizen».' },
  { grupo: 'perfectum', fichas: 'we|hebben|veel|gelachen', es: 'Nos hemos reído mucho.', pista: 'En perfectum, con «lachen».' },
  { grupo: 'perfectum', fichas: 'hij|is|om tien uur|thuisgekomen', es: 'Llegó a casa a las diez.', otras: ['om tien uur is hij thuisgekomen'], pista: 'En perfectum, con «thuiskomen».' },

  // Verbos separables
  { grupo: 'separables', fichas: 'ik|bel|je|morgen|op', es: 'Te llamo mañana.', otras: ['morgen bel ik je op'], pista: 'Con «opbellen».' },
  { grupo: 'separables', fichas: 'hoe laat|sta|je|op', es: '¿A qué hora te levantas?', final: '?', otras: ['hoe laat sta jij op'], pista: 'Con «opstaan».' },
  { grupo: 'separables', fichas: 'neem|jij|de wijn|mee', es: '¿Traes tú el vino?', final: '?', otras: ['neem je de wijn mee'], pista: 'Con «meenemen».' },
  { grupo: 'separables', fichas: 'de trein|komt|om vijf uur|aan', es: 'El tren llega a las cinco.', otras: ['om vijf uur komt de trein aan'], pista: 'Con «aankomen».' },
  { grupo: 'separables', fichas: 'we|ruimen|na het eten|de keuken|op', es: 'Después de comer recogemos la cocina.', otras: ['na het eten ruimen we de keuken op', 'we ruimen de keuken na het eten op', 'we ruimen de keuken op na het eten'], pista: 'Con «opruimen».' },
  { grupo: 'separables', fichas: 'ik|nodig|mijn vrienden|voor zaterdag|uit', es: 'Invito a mis amigos para el sábado.', otras: ['ik nodig mijn vrienden uit voor zaterdag'], pista: 'Con «uitnodigen».' },
  { grupo: 'separables', fichas: 'wanneer|kom|je|terug', es: '¿Cuándo vuelves?', final: '?', otras: ['wanneer kom jij terug'], pista: 'Con «terugkomen».' },
  { grupo: 'separables', fichas: 'ze|legt|het|nog een keer|uit', es: 'Ella lo explica otra vez.', otras: ['zij legt het nog een keer uit', 'ze legt het nog eens uit', 'ze legt het opnieuw uit', 'ze legt het weer uit'], pista: 'Con «uitleggen».' },

  // Niet y geen
  { grupo: 'niet', fichas: 'ik|kom|morgen|niet', es: 'Mañana no vengo.', otras: ['morgen kom ik niet'], pista: 'Con «niet».' },
  { grupo: 'niet', fichas: 'ik|heb|het|niet|gezien', es: 'No lo he visto.', otras: ['ik heb hem niet gezien', 'dat heb ik niet gezien'], pista: 'Con «niet».' },
  { grupo: 'niet', fichas: 'dat|is|niet|waar', es: 'Eso no es verdad.', pista: 'Con «niet».' },
  { grupo: 'niet', fichas: 'we|gaan|vanavond|niet|uit', es: 'Esta noche no salimos.', otras: ['vanavond gaan we niet uit'], pista: 'Con «uitgaan» y «niet».' },
  { grupo: 'niet', fichas: 'ik|begrijp|het|niet', es: 'No lo entiendo.', otras: ['ik snap het niet', 'dat begrijp ik niet', 'dat snap ik niet'], pista: 'Con «niet».' },
  { grupo: 'niet', fichas: 'hij|wil|niet|meekomen', es: 'No quiere venir con nosotros.', otras: ['hij wil niet met ons meekomen'], pista: 'Con «meekomen» y «niet»; él es «hij».' },
  { grupo: 'niet', fichas: 'ik|heb|vandaag|geen tijd', es: 'Hoy no tengo tiempo.', otras: ['vandaag heb ik geen tijd'], pista: 'Con «geen».' },
  { grupo: 'niet', fichas: 'ik|woon|niet|in het centrum', es: 'No vivo en el centro.', pista: 'Con «niet».' },

  // Preguntas
  { grupo: 'preguntas', fichas: 'werk|jij|morgen', es: '¿Trabajas mañana?', final: '?', otras: ['werk je morgen'], pista: 'Con «jij» detrás del verbo.' },
  { grupo: 'preguntas', fichas: 'waar|woont|je zus', es: '¿Dónde vive tu hermana?', final: '?', otras: ['waar woont jouw zus'] },
  { grupo: 'preguntas', fichas: 'wat|ga|je|dit weekend|doen', es: '¿Qué vas a hacer este fin de semana?', final: '?', otras: ['wat ga jij dit weekend doen'] },
  { grupo: 'preguntas', fichas: 'heb|je|zin|in koffie', es: '¿Te apetece un café?', final: '?', otras: ['heb jij zin in koffie', 'heb je zin in een kopje koffie', 'heb jij zin in een kopje koffie'], pista: 'Con «zin hebben in».' },
  { grupo: 'preguntas', fichas: 'hoe|gaat|het|met je moeder', es: '¿Qué tal está tu madre?', final: '?', otras: ['hoe gaat het met jouw moeder', 'hoe is het met je moeder', 'hoe is het met jouw moeder'] },
  { grupo: 'preguntas', fichas: 'kom|jij|ook|naar het feest', es: '¿Tú también vienes a la fiesta?', final: '?', otras: ['kom je ook naar het feest'] },
  { grupo: 'preguntas', fichas: 'hoelang|woon|je|al|in Nederland', es: '¿Cuánto tiempo llevas viviendo en los Países Bajos?', final: '?', otras: ['hoelang woon jij al in Nederland', 'hoe lang woon je al in Nederland', 'hoe lang woon jij al in Nederland'], pista: 'Con «hoelang… al».' },
  { grupo: 'preguntas', fichas: 'waarom|lach|je', es: '¿Por qué te ríes?', final: '?', otras: ['waarom lach jij'] },

  // Subordinadas
  { grupo: 'subordinada', fichas: 'ik blijf thuis|omdat|ik|niet lekker|ben', es: 'Me quedo en casa porque no me encuentro bien.', pista: 'Con «omdat» y «niet lekker zijn».' },
  { grupo: 'subordinada', fichas: 'ik denk|dat|het|morgen|gaat regenen', es: 'Creo que mañana va a llover.', pista: 'Con «dat».' },
  { grupo: 'subordinada', fichas: 'weet je|of|ze|vanavond|komt', es: '¿Sabes si viene esta noche?', final: '?', otras: ['weet jij of ze vanavond komt', 'weet je of zij vanavond komt'], pista: 'Con «of»; ella es «ze».' },
  { grupo: 'subordinada', fichas: 'ze zegt|dat|ze|geen tijd|heeft', es: 'Dice que no tiene tiempo.', otras: ['zij zegt dat ze geen tijd heeft'], pista: 'Con «dat»; ella es «ze».' },
  { grupo: 'subordinada', fichas: 'ik bel je|als|ik|thuis|ben', es: 'Te llamo cuando esté en casa.', otras: ['als ik thuis ben, bel ik je', 'ik bel je op als ik thuis ben', 'als ik thuis ben, bel ik je op'], pista: 'Con «als».' },
  { grupo: 'subordinada', fichas: 'hij weet niet|waar|de sleutels|liggen', es: 'No sabe dónde están las llaves.', pista: 'Con «waar»; él es «hij»; las llaves «liggen».' },
  { grupo: 'subordinada', fichas: 'ik ben blij|dat|jullie|er|zijn', es: 'Me alegro de que estéis aquí.', pista: 'Con «dat» y «er zijn».' },
  { grupo: 'subordinada', fichas: 'we gaan naar binnen|omdat|het|koud|is', es: 'Entramos porque hace frío.', pista: 'Con «omdat».' },

  // Subordinada delante
  { grupo: 'subordinada-delante', fichas: 'als ik tijd heb,|kom|ik|langs', es: 'Si tengo tiempo, me paso.', otras: ['ik kom langs als ik tijd heb'], pista: 'Empieza por «Als»; usa «langskomen».' },
  {
    grupo: 'subordinada-delante',
    fichas: 'toen ik in Spanje woonde,|sprak|ik|geen Nederlands',
    es: 'Cuando vivía en España, no hablaba neerlandés.',
    otras: ['ik sprak geen Nederlands toen ik in Spanje woonde'],
    pista: 'Empieza por «Toen».',
  },
  {
    grupo: 'subordinada-delante',
    fichas: 'als het mooi weer is,|gaan|we|naar het strand',
    es: 'Si hace buen tiempo, vamos a la playa.',
    otras: [
      'we gaan naar het strand als het mooi weer is',
      'als het lekker weer is, gaan we naar het strand',
      'we gaan naar het strand als het lekker weer is',
      'als het goed weer is, gaan we naar het strand',
      'we gaan naar het strand als het goed weer is',
    ],
    pista: 'Empieza por «Als».',
  },
  { grupo: 'subordinada-delante', fichas: 'omdat het regent,|blijven|we|binnen', es: 'Como llueve, nos quedamos dentro.', otras: ['we blijven binnen omdat het regent'], pista: 'Empieza por «Omdat».' },
  { grupo: 'subordinada-delante', fichas: 'als je wilt,|kunnen|we|samen|koken', es: 'Si quieres, podemos cocinar juntos.', otras: ['we kunnen samen koken als je wilt', 'als je wil, kunnen we samen koken', 'we kunnen samen koken als je wil'], pista: 'Empieza por «Als».' },
  {
    grupo: 'subordinada-delante',
    fichas: 'nadat we gegeten hebben,|gaan|we|wandelen',
    es: 'Después de comer, vamos a pasear.',
    otras: ['we gaan wandelen nadat we gegeten hebben', 'nadat we hebben gegeten, gaan we wandelen', 'we gaan wandelen nadat we hebben gegeten'],
    pista: 'Empieza por «Nadat».',
  },
  {
    grupo: 'subordinada-delante',
    fichas: 'als ik slaap heb,|spreek|ik|slechter Nederlands',
    es: 'Cuando tengo sueño, hablo peor neerlandés.',
    otras: ['ik spreek slechter Nederlands als ik slaap heb'],
    pista: 'Empieza por «Als»; tener sueño es «slaap hebben».',
  },
  {
    grupo: 'subordinada-delante',
    fichas: 'zodra ik thuis ben,|stuur|ik|je|een berichtje',
    es: 'En cuanto esté en casa, te mando un mensaje.',
    otras: ['ik stuur je een berichtje zodra ik thuis ben', 'zodra ik thuis ben, stuur ik je een bericht', 'ik stuur je een bericht zodra ik thuis ben'],
    pista: 'Empieza por «Zodra».',
  },
];

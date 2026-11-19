// Vocabulario frecuente de la vida diaria, por temas. Los sustantivos llevan
// siempre su artículo (de o het): se aprenden juntos porque el artículo no se
// puede adivinar. Cada significado en español es único en toda la lista, para
// que los ejercicios de elegir tengan una sola respuesta buena.
//
// Pendiente de revisión por una persona nativa (ver docs/revision.md).

export const GRUPOS_VOCABULARIO = ['gente', 'casa', 'tiempo', 'ciudad', 'conversar', 'como-es'] as const;

export type GrupoVocabulario = (typeof GRUPOS_VOCABULARIO)[number];

export const NOMBRES_GRUPO_VOCABULARIO: Readonly<Record<GrupoVocabulario, string>> = {
  gente: 'Familia y gente',
  casa: 'Casa y comida',
  tiempo: 'Tiempo y planes',
  ciudad: 'Trabajo y ciudad',
  conversar: 'Para conversar',
  'como-es': 'Cómo es, cómo está',
};

export interface DatosPalabra {
  readonly nl: string;
  readonly es: string;
  readonly grupo: GrupoVocabulario;
  /** Otras formas que valen al escribirla. */
  readonly otras?: readonly string[];
  /** Solo existe en plural (no se pregunta de o het). */
  readonly plural?: boolean;
  /** Expresión, no sustantivo: el «het» del principio es el sujeto («het spijt me»), no un artículo. */
  readonly expresion?: boolean;
  /** Palabras cuyo significado también valdría para esta: no salen como opción mala con ella, ni al revés. */
  readonly parecidas?: readonly string[];
  readonly nota?: string;
}

export const PALABRAS: readonly DatosPalabra[] = [
  // Familia y gente
  { grupo: 'gente', nl: 'de vriendin', es: 'la novia (o la amiga)', nota: 'Según el contexto, novia o amiga. «Mijn vriendin» suele ser «mi novia».' },
  { grupo: 'gente', nl: 'de schoonouders', es: 'los suegros', plural: true },
  { grupo: 'gente', nl: 'de schoonmoeder', es: 'la suegra' },
  { grupo: 'gente', nl: 'de schoonvader', es: 'el suegro' },
  { grupo: 'gente', nl: 'de zwager', es: 'el cuñado' },
  { grupo: 'gente', nl: 'de schoonzus', es: 'la cuñada' },
  { grupo: 'gente', nl: 'de broer', es: 'el hermano' },
  { grupo: 'gente', nl: 'de zus', es: 'la hermana' },
  { grupo: 'gente', nl: 'de ouders', es: 'los padres', plural: true },
  { grupo: 'gente', nl: 'de opa', es: 'el abuelo' },
  { grupo: 'gente', nl: 'de oma', es: 'la abuela' },
  { grupo: 'gente', nl: 'de buurman', es: 'el vecino' },
  { grupo: 'gente', nl: 'de buurvrouw', es: 'la vecina' },
  { grupo: 'gente', nl: 'de collega', es: 'el compañero de trabajo' },
  { grupo: 'gente', nl: 'het kind', es: 'el niño', nota: 'Vale para niño y niña, y es también la palabra normal para hijo o hija: «Hoeveel kinderen heb je?», ¿cuántos hijos tienes?' },
  { grupo: 'gente', nl: 'het gezin', es: 'la familia (padres e hijos)', nota: 'Het gezin es la familia que vive junta; de familie, toda la familia.' },
  { grupo: 'gente', nl: 'de familie', es: 'la familia (toda)' },
  { grupo: 'gente', nl: 'het meisje', es: 'la chica', nota: 'Los diminutivos (-je) son siempre het.' },
  { grupo: 'gente', nl: 'de jongen', es: 'el chico' },
  { grupo: 'gente', nl: 'de baby', es: 'el bebé' },

  // Casa y comida
  { grupo: 'casa', nl: 'het huis', es: 'la casa' },
  { grupo: 'casa', nl: 'de keuken', es: 'la cocina' },
  { grupo: 'casa', nl: 'de woonkamer', es: 'el salón', otras: ['de huiskamer'] },
  { grupo: 'casa', nl: 'de slaapkamer', es: 'el dormitorio' },
  { grupo: 'casa', nl: 'de badkamer', es: 'el baño (con ducha o bañera)', nota: 'En las casas neerlandesas el váter suele estar en un cuarto aparte: «Waar is de wc?», ¿dónde está el baño?' },
  { grupo: 'casa', nl: 'het raam', es: 'la ventana' },
  { grupo: 'casa', nl: 'de deur', es: 'la puerta' },
  { grupo: 'casa', nl: 'de tuin', es: 'el jardín' },
  { grupo: 'casa', nl: 'de koelkast', es: 'la nevera' },
  { grupo: 'casa', nl: 'het bed', es: 'la cama' },
  { grupo: 'casa', nl: 'het ontbijt', es: 'el desayuno' },
  { grupo: 'casa', nl: 'het avondeten', es: 'la cena' },
  { grupo: 'casa', nl: 'de boterham', es: 'la rebanada de pan (con algo encima)' },
  { grupo: 'casa', nl: 'het brood', es: 'el pan' },
  { grupo: 'casa', nl: 'de kaas', es: 'el queso' },
  { grupo: 'casa', nl: 'het vlees', es: 'la carne' },
  { grupo: 'casa', nl: 'de groente', es: 'la verdura' },
  { grupo: 'casa', nl: 'het fruit', es: 'la fruta' },
  { grupo: 'casa', nl: 'de taart', es: 'la tarta' },
  { grupo: 'casa', nl: 'het glas', es: 'el vaso' },
  { grupo: 'casa', nl: 'het bord', es: 'el plato' },
  { grupo: 'casa', nl: 'het mes', es: 'el cuchillo' },
  { grupo: 'casa', nl: 'de vork', es: 'el tenedor' },
  { grupo: 'casa', nl: 'de lepel', es: 'la cuchara' },

  // Tiempo y planes
  { grupo: 'tiempo', nl: 'de afspraak', es: 'la cita' },
  { grupo: 'tiempo', nl: 'de verjaardag', es: 'el cumpleaños' },
  { grupo: 'tiempo', nl: 'het feest', es: 'la fiesta' },
  { grupo: 'tiempo', nl: 'de vakantie', es: 'las vacaciones' },
  { grupo: 'tiempo', nl: 'het weer', es: 'el tiempo (que hace)' },
  { grupo: 'tiempo', nl: 'de regen', es: 'la lluvia' },
  { grupo: 'tiempo', nl: 'de zon', es: 'el sol' },
  { grupo: 'tiempo', nl: 'de week', es: 'la semana' },
  { grupo: 'tiempo', nl: 'de maand', es: 'el mes' },
  { grupo: 'tiempo', nl: 'het jaar', es: 'el año' },
  { grupo: 'tiempo', nl: 'het uur', es: 'la hora', nota: 'Para preguntar la hora se dice «Hoe laat is het?», y «¿a qué hora?» es «Hoe laat?». Uur es la hora que dura (een uur) y la de «om drie uur».' },
  { grupo: 'tiempo', nl: 'de ochtend', es: 'la mañana', otras: ['de morgen'], nota: 'También de morgen, como en vanmorgen o goedemorgen. Morgen solo, sin artículo, es «mañana», el día siguiente.' },
  { grupo: 'tiempo', nl: 'de middag', es: 'la tarde (hasta las seis)' },
  { grupo: 'tiempo', nl: 'de avond', es: 'la noche (antes de acostarse)', nota: "De avond va más o menos de las seis hasta que uno se acuesta: «om acht uur 's avonds» es «a las ocho de la tarde». De nacht, cuando ya se duerme." },
  { grupo: 'tiempo', nl: 'vanavond', es: 'esta noche' },
  { grupo: 'tiempo', nl: 'vanochtend', es: 'esta mañana', otras: ['vanmorgen'] },
  { grupo: 'tiempo', nl: 'overmorgen', es: 'pasado mañana' },
  { grupo: 'tiempo', nl: 'eergisteren', es: 'anteayer' },
  { grupo: 'tiempo', nl: 'straks', es: 'luego, dentro de un rato' },
  { grupo: 'tiempo', nl: 'meteen', es: 'enseguida', otras: ['direct'] },
  { grupo: 'tiempo', nl: 'binnenkort', es: 'pronto (en unos días o semanas)', nota: 'Para dentro de un rato, hoy mismo, se dice straks.' },
  { grupo: 'tiempo', nl: 'net', es: 'hace un momento', otras: ['zojuist', 'zonet', 'daarnet'], nota: '«Ik ben net thuis»: acabo de llegar a casa.' },

  // Trabajo y ciudad
  { grupo: 'ciudad', nl: 'het werk', es: 'el trabajo' },
  { grupo: 'ciudad', nl: 'de baan', es: 'el empleo, el puesto', parecidas: ['het werk'] },
  { grupo: 'ciudad', nl: 'de vergadering', es: 'la reunión' },
  { grupo: 'ciudad', nl: 'de fiets', es: 'la bici' },
  { grupo: 'ciudad', nl: 'het station', es: 'la estación' },
  { grupo: 'ciudad', nl: 'de trein', es: 'el tren' },
  { grupo: 'ciudad', nl: 'de winkel', es: 'la tienda' },
  { grupo: 'ciudad', nl: 'de boodschappen', es: 'la compra (del súper)', plural: true },
  { grupo: 'ciudad', nl: 'de rekening', es: 'la cuenta, la factura' },
  { grupo: 'ciudad', nl: 'het geld', es: 'el dinero' },
  { grupo: 'ciudad', nl: 'de gemeente', es: 'el ayuntamiento' },
  { grupo: 'ciudad', nl: 'de huisarts', es: 'el médico de cabecera' },
  { grupo: 'ciudad', nl: 'de apotheek', es: 'la farmacia' },
  { grupo: 'ciudad', nl: 'het ziekenhuis', es: 'el hospital' },
  { grupo: 'ciudad', nl: 'de straat', es: 'la calle' },
  { grupo: 'ciudad', nl: 'de stad', es: 'la ciudad' },
  { grupo: 'ciudad', nl: 'de buurt', es: 'el barrio' },
  { grupo: 'ciudad', nl: 'het centrum', es: 'el centro' },
  { grupo: 'ciudad', nl: 'de file', es: 'el atasco' },

  // Para conversar
  { grupo: 'conversar', nl: 'eigenlijk', es: 'en realidad' },
  { grupo: 'conversar', nl: 'gewoon', es: 'simplemente; normal' },
  { grupo: 'conversar', nl: 'trouwens', es: 'por cierto' },
  { grupo: 'conversar', nl: 'volgens mij', es: 'creo que, en mi opinión', nota: 'Va en primera posición y detrás el verbo, sin dat: «Volgens mij komt hij niet», creo que no viene.' },
  { grupo: 'conversar', nl: 'dat klopt', es: 'es verdad, correcto' },
  { grupo: 'conversar', nl: 'dat maakt niet uit', es: 'da igual', otras: ['het maakt niet uit'] },
  { grupo: 'conversar', nl: 'geen idee', es: 'ni idea' },
  { grupo: 'conversar', nl: 'ik heb zin in', es: 'me apetece (algo)', nota: '«Ik heb zin in koffie», «Ik heb zin om te gaan».' },
  { grupo: 'conversar', nl: 'het valt mee', es: 'no es para tanto', otras: ['het valt wel mee', 'dat valt mee', 'dat valt wel mee'], expresion: true },
  { grupo: 'conversar', nl: 'het spijt me', es: 'lo siento', expresion: true },
  { grupo: 'conversar', nl: 'wat jammer', es: 'qué pena' },
  { grupo: 'conversar', nl: 'gezellig', es: 'agradable, acogedor', nota: 'Para un ambiente, una casa o una reunión a gusto. Muy neerlandés.' },
  { grupo: 'conversar', nl: 'lekker', es: 'rico; a gusto' },
  { grupo: 'conversar', nl: 'even', es: 'un momento (suaviza una petición)', nota: '«Kun je even helpen?»: ¿me ayudas un momento?' },
  { grupo: 'conversar', nl: 'toch', es: '¿verdad? (al final de la frase)' },
  { grupo: 'conversar', nl: 'nou', es: 'bueno… (para arrancar o dudar)' },
  { grupo: 'conversar', nl: 'inderdaad', es: 'efectivamente', parecidas: ['dat klopt'] },
  { grupo: 'conversar', nl: 'misschien', es: 'quizás' },
  { grupo: 'conversar', nl: 'natuurlijk', es: 'claro, por supuesto' },
  { grupo: 'conversar', nl: 'helaas', es: 'por desgracia' },
  { grupo: 'conversar', nl: 'eindelijk', es: 'por fin' },

  // Cómo es, cómo está
  { grupo: 'como-es', nl: 'druk', es: 'ocupado, con mucho lío' },
  { grupo: 'como-es', nl: 'rustig', es: 'tranquilo' },
  { grupo: 'como-es', nl: 'moe', es: 'cansado' },
  { grupo: 'como-es', nl: 'moeilijk', es: 'difícil' },
  { grupo: 'como-es', nl: 'makkelijk', es: 'fácil', otras: ['gemakkelijk'] },
  { grupo: 'como-es', nl: 'duur', es: 'caro' },
  { grupo: 'como-es', nl: 'goedkoop', es: 'barato' },
  { grupo: 'como-es', nl: 'vroeg', es: 'temprano' },
  { grupo: 'como-es', nl: 'laat', es: 'tarde (de hora)', nota: '«Het is al laat»: ya es tarde. Llegar tarde lleva te: «Sorry, ik ben te laat».' },
  { grupo: 'como-es', nl: 'ziek', es: 'enfermo' },
  { grupo: 'como-es', nl: 'boos', es: 'enfadado' },
  { grupo: 'como-es', nl: 'blij', es: 'contento' },
  { grupo: 'como-es', nl: 'bang', es: 'con miedo' },
  { grupo: 'como-es', nl: 'klaar', es: 'listo, terminado' },
  { grupo: 'como-es', nl: 'vaak', es: 'a menudo' },
  { grupo: 'como-es', nl: 'soms', es: 'a veces' },
  { grupo: 'como-es', nl: 'nooit', es: 'nunca' },
  { grupo: 'como-es', nl: 'altijd', es: 'siempre' },
  { grupo: 'como-es', nl: 'al', es: 'ya' },
  { grupo: 'como-es', nl: 'nog', es: 'todavía' },
  { grupo: 'como-es', nl: 'weer', es: 'otra vez', parecidas: ['het weer'] },
  { grupo: 'como-es', nl: 'samen', es: 'juntos' },
];

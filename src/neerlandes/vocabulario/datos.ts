// Vocabulario frecuente de la vida diaria, por temas. Los sustantivos llevan
// siempre su artículo (de o het): se aprenden juntos porque el artículo no se
// puede adivinar. Cada significado en español es único en toda la lista, para
// que los ejercicios de elegir tengan una sola respuesta buena.
//
// Cada palabra lleva su código permanente (P40): con él se revisa y de él sale
// su id, así que corregir el texto no le quita el historial. Una nueva lleva el
// siguiente número libre; un código no se cambia ni se reutiliza (ver
// ids-fijos.ts).
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
  /** Código permanente para revisarlo y para su id (ver ids-fijos.ts): no cambia aunque cambie el texto. */
  readonly codigo: string;
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
  { codigo: 'P1', grupo: 'gente', nl: 'de vriendin', es: 'la novia (o la amiga)', nota: 'Según el contexto, novia o amiga. «Mijn vriendin» suele ser “mi novia”.' },
  { codigo: 'P2', grupo: 'gente', nl: 'de schoonouders', es: 'los suegros', plural: true },
  { codigo: 'P3', grupo: 'gente', nl: 'de schoonmoeder', es: 'la suegra' },
  { codigo: 'P4', grupo: 'gente', nl: 'de schoonvader', es: 'el suegro' },
  { codigo: 'P5', grupo: 'gente', nl: 'de zwager', es: 'el cuñado' },
  { codigo: 'P6', grupo: 'gente', nl: 'de schoonzus', es: 'la cuñada' },
  { codigo: 'P7', grupo: 'gente', nl: 'de broer', es: 'el hermano' },
  { codigo: 'P8', grupo: 'gente', nl: 'de zus', es: 'la hermana' },
  { codigo: 'P9', grupo: 'gente', nl: 'de ouders', es: 'los padres', plural: true },
  { codigo: 'P10', grupo: 'gente', nl: 'de opa', es: 'el abuelo' },
  { codigo: 'P11', grupo: 'gente', nl: 'de oma', es: 'la abuela' },
  { codigo: 'P12', grupo: 'gente', nl: 'de buurman', es: 'el vecino' },
  { codigo: 'P13', grupo: 'gente', nl: 'de buurvrouw', es: 'la vecina' },
  { codigo: 'P14', grupo: 'gente', nl: 'de collega', es: 'el compañero de trabajo' },
  { codigo: 'P15', grupo: 'gente', nl: 'het kind', es: 'el niño', nota: 'Vale para niño y niña, y es también la palabra normal para hijo o hija: «Hoeveel kinderen heb je?», ¿cuántos hijos tienes?' },
  { codigo: 'P16', grupo: 'gente', nl: 'het gezin', es: 'la familia (padres e hijos)', nota: '«Het gezin» es la familia que vive junta; «de familie», toda la familia.' },
  { codigo: 'P17', grupo: 'gente', nl: 'de familie', es: 'la familia (toda)' },
  { codigo: 'P18', grupo: 'gente', nl: 'het meisje', es: 'la chica', nota: 'Los diminutivos (-je) son siempre «het».' },
  { codigo: 'P19', grupo: 'gente', nl: 'de jongen', es: 'el chico' },
  { codigo: 'P20', grupo: 'gente', nl: 'de baby', es: 'el bebé' },

  // Casa y comida
  { codigo: 'P21', grupo: 'casa', nl: 'het huis', es: 'la casa' },
  { codigo: 'P22', grupo: 'casa', nl: 'de keuken', es: 'la cocina' },
  { codigo: 'P23', grupo: 'casa', nl: 'de woonkamer', es: 'el salón', otras: ['de huiskamer'] },
  { codigo: 'P24', grupo: 'casa', nl: 'de slaapkamer', es: 'el dormitorio' },
  { codigo: 'P25', grupo: 'casa', nl: 'de badkamer', es: 'el baño (con ducha o bañera)', nota: 'En las casas neerlandesas el váter suele estar en un cuarto aparte: «Waar is de wc?», ¿dónde está el baño?' },
  { codigo: 'P26', grupo: 'casa', nl: 'het raam', es: 'la ventana' },
  { codigo: 'P27', grupo: 'casa', nl: 'de deur', es: 'la puerta' },
  { codigo: 'P28', grupo: 'casa', nl: 'de tuin', es: 'el jardín' },
  { codigo: 'P29', grupo: 'casa', nl: 'de koelkast', es: 'la nevera' },
  { codigo: 'P30', grupo: 'casa', nl: 'het bed', es: 'la cama' },
  { codigo: 'P31', grupo: 'casa', nl: 'het ontbijt', es: 'el desayuno' },
  { codigo: 'P32', grupo: 'casa', nl: 'het avondeten', es: 'la cena' },
  { codigo: 'P33', grupo: 'casa', nl: 'de boterham', es: 'la rebanada de pan (con algo encima)' },
  { codigo: 'P34', grupo: 'casa', nl: 'het brood', es: 'el pan' },
  { codigo: 'P35', grupo: 'casa', nl: 'de kaas', es: 'el queso' },
  { codigo: 'P36', grupo: 'casa', nl: 'het vlees', es: 'la carne' },
  { codigo: 'P37', grupo: 'casa', nl: 'de groente', es: 'la verdura' },
  { codigo: 'P38', grupo: 'casa', nl: 'het fruit', es: 'la fruta' },
  { codigo: 'P39', grupo: 'casa', nl: 'de taart', es: 'la tarta' },
  { codigo: 'P40', grupo: 'casa', nl: 'het glas', es: 'el vaso' },
  { codigo: 'P41', grupo: 'casa', nl: 'het bord', es: 'el plato' },
  { codigo: 'P42', grupo: 'casa', nl: 'het mes', es: 'el cuchillo' },
  { codigo: 'P43', grupo: 'casa', nl: 'de vork', es: 'el tenedor' },
  { codigo: 'P44', grupo: 'casa', nl: 'de lepel', es: 'la cuchara' },

  // Tiempo y planes
  { codigo: 'P45', grupo: 'tiempo', nl: 'de afspraak', es: 'la cita' },
  { codigo: 'P46', grupo: 'tiempo', nl: 'de verjaardag', es: 'el cumpleaños' },
  { codigo: 'P47', grupo: 'tiempo', nl: 'het feest', es: 'la fiesta' },
  { codigo: 'P48', grupo: 'tiempo', nl: 'de vakantie', es: 'las vacaciones' },
  { codigo: 'P49', grupo: 'tiempo', nl: 'het weer', es: 'el tiempo (que hace)' },
  { codigo: 'P50', grupo: 'tiempo', nl: 'de regen', es: 'la lluvia' },
  { codigo: 'P51', grupo: 'tiempo', nl: 'de zon', es: 'el sol' },
  { codigo: 'P52', grupo: 'tiempo', nl: 'de week', es: 'la semana' },
  { codigo: 'P53', grupo: 'tiempo', nl: 'de maand', es: 'el mes' },
  { codigo: 'P54', grupo: 'tiempo', nl: 'het jaar', es: 'el año' },
  { codigo: 'P55', grupo: 'tiempo', nl: 'het uur', es: 'la hora', nota: 'Para preguntar la hora se dice «Hoe laat is het?», y “¿a qué hora?” es «Hoe laat?». «Uur» es la hora que dura («een uur») y la de «om drie uur».' },
  { codigo: 'P56', grupo: 'tiempo', nl: 'de ochtend', es: 'la mañana', otras: ['de morgen'], nota: 'También «de morgen», como en «vanmorgen» o «goedemorgen». «Morgen» solo, sin artículo, es “mañana”, el día siguiente.' },
  { codigo: 'P57', grupo: 'tiempo', nl: 'de middag', es: 'la tarde (hasta las seis)' },
  { codigo: 'P58', grupo: 'tiempo', nl: 'de avond', es: 'la noche (antes de acostarse)', nota: "«De avond» va más o menos de las seis hasta que uno se acuesta: «om acht uur 's avonds» es “a las ocho de la tarde”. «De nacht», cuando ya se duerme." },
  { codigo: 'P59', grupo: 'tiempo', nl: 'vanavond', es: 'esta noche' },
  { codigo: 'P60', grupo: 'tiempo', nl: 'vanochtend', es: 'esta mañana', otras: ['vanmorgen'] },
  { codigo: 'P61', grupo: 'tiempo', nl: 'overmorgen', es: 'pasado mañana' },
  { codigo: 'P62', grupo: 'tiempo', nl: 'eergisteren', es: 'anteayer' },
  { codigo: 'P63', grupo: 'tiempo', nl: 'straks', es: 'luego, dentro de un rato' },
  { codigo: 'P64', grupo: 'tiempo', nl: 'meteen', es: 'enseguida', otras: ['direct'] },
  { codigo: 'P65', grupo: 'tiempo', nl: 'binnenkort', es: 'pronto (en unos días o semanas)', nota: 'Para dentro de un rato, hoy mismo, se dice «straks».' },
  { codigo: 'P66', grupo: 'tiempo', nl: 'net', es: 'hace un momento', otras: ['zojuist', 'zonet', 'daarnet'], nota: '«Ik ben net thuis»: acabo de llegar a casa.' },

  // Trabajo y ciudad
  { codigo: 'P67', grupo: 'ciudad', nl: 'het werk', es: 'el trabajo' },
  { codigo: 'P68', grupo: 'ciudad', nl: 'de baan', es: 'el empleo, el puesto', parecidas: ['het werk'] },
  { codigo: 'P69', grupo: 'ciudad', nl: 'de vergadering', es: 'la reunión' },
  { codigo: 'P70', grupo: 'ciudad', nl: 'de fiets', es: 'la bici' },
  { codigo: 'P71', grupo: 'ciudad', nl: 'het station', es: 'la estación' },
  { codigo: 'P72', grupo: 'ciudad', nl: 'de trein', es: 'el tren' },
  { codigo: 'P73', grupo: 'ciudad', nl: 'de winkel', es: 'la tienda' },
  { codigo: 'P74', grupo: 'ciudad', nl: 'de boodschappen', es: 'la compra (del súper)', plural: true },
  { codigo: 'P75', grupo: 'ciudad', nl: 'de rekening', es: 'la cuenta, la factura' },
  { codigo: 'P76', grupo: 'ciudad', nl: 'het geld', es: 'el dinero' },
  { codigo: 'P77', grupo: 'ciudad', nl: 'de gemeente', es: 'el ayuntamiento' },
  { codigo: 'P78', grupo: 'ciudad', nl: 'de huisarts', es: 'el médico de cabecera' },
  { codigo: 'P79', grupo: 'ciudad', nl: 'de apotheek', es: 'la farmacia' },
  { codigo: 'P80', grupo: 'ciudad', nl: 'het ziekenhuis', es: 'el hospital' },
  { codigo: 'P81', grupo: 'ciudad', nl: 'de straat', es: 'la calle' },
  { codigo: 'P82', grupo: 'ciudad', nl: 'de stad', es: 'la ciudad' },
  { codigo: 'P83', grupo: 'ciudad', nl: 'de buurt', es: 'el barrio' },
  { codigo: 'P84', grupo: 'ciudad', nl: 'het centrum', es: 'el centro' },
  { codigo: 'P85', grupo: 'ciudad', nl: 'de file', es: 'el atasco' },

  // Para conversar
  { codigo: 'P86', grupo: 'conversar', nl: 'eigenlijk', es: 'en realidad' },
  { codigo: 'P87', grupo: 'conversar', nl: 'gewoon', es: 'simplemente; normal' },
  { codigo: 'P88', grupo: 'conversar', nl: 'trouwens', es: 'por cierto' },
  { codigo: 'P89', grupo: 'conversar', nl: 'volgens mij', es: 'creo que, en mi opinión', nota: 'Va en primera posición y detrás el verbo, sin «dat»: «Volgens mij komt hij niet», creo que no viene.' },
  { codigo: 'P90', grupo: 'conversar', nl: 'dat klopt', es: 'es verdad, correcto' },
  { codigo: 'P91', grupo: 'conversar', nl: 'dat maakt niet uit', es: 'da igual', otras: ['het maakt niet uit'] },
  { codigo: 'P92', grupo: 'conversar', nl: 'geen idee', es: 'ni idea' },
  { codigo: 'P93', grupo: 'conversar', nl: 'ik heb zin in', es: 'me apetece (algo)', nota: '«Ik heb zin in koffie», «Ik heb zin om te gaan».' },
  { codigo: 'P94', grupo: 'conversar', nl: 'het valt mee', es: 'no es para tanto', otras: ['het valt wel mee', 'dat valt mee', 'dat valt wel mee'], expresion: true },
  { codigo: 'P95', grupo: 'conversar', nl: 'het spijt me', es: 'lo siento', expresion: true },
  { codigo: 'P96', grupo: 'conversar', nl: 'wat jammer', es: 'qué pena' },
  { codigo: 'P97', grupo: 'conversar', nl: 'gezellig', es: 'agradable, acogedor', nota: 'Para un ambiente, una casa o una reunión a gusto. Muy neerlandés.' },
  { codigo: 'P98', grupo: 'conversar', nl: 'lekker', es: 'rico; a gusto' },
  { codigo: 'P99', grupo: 'conversar', nl: 'even', es: 'un momento (suaviza una petición)', nota: '«Kun je even helpen?»: ¿me ayudas un momento?' },
  { codigo: 'P100', grupo: 'conversar', nl: 'toch', es: '¿verdad? (al final de la frase)' },
  { codigo: 'P101', grupo: 'conversar', nl: 'nou', es: 'bueno… (para arrancar o dudar)' },
  { codigo: 'P102', grupo: 'conversar', nl: 'inderdaad', es: 'efectivamente', parecidas: ['dat klopt'] },
  { codigo: 'P103', grupo: 'conversar', nl: 'misschien', es: 'quizás' },
  { codigo: 'P104', grupo: 'conversar', nl: 'natuurlijk', es: 'claro, por supuesto' },
  { codigo: 'P105', grupo: 'conversar', nl: 'helaas', es: 'por desgracia' },
  { codigo: 'P106', grupo: 'conversar', nl: 'eindelijk', es: 'por fin' },

  // Cómo es, cómo está
  { codigo: 'P107', grupo: 'como-es', nl: 'druk', es: 'ocupado, con mucho lío' },
  { codigo: 'P108', grupo: 'como-es', nl: 'rustig', es: 'tranquilo' },
  { codigo: 'P109', grupo: 'como-es', nl: 'moe', es: 'cansado' },
  { codigo: 'P110', grupo: 'como-es', nl: 'moeilijk', es: 'difícil' },
  { codigo: 'P111', grupo: 'como-es', nl: 'makkelijk', es: 'fácil', otras: ['gemakkelijk'] },
  { codigo: 'P112', grupo: 'como-es', nl: 'duur', es: 'caro' },
  { codigo: 'P113', grupo: 'como-es', nl: 'goedkoop', es: 'barato' },
  { codigo: 'P114', grupo: 'como-es', nl: 'vroeg', es: 'temprano' },
  { codigo: 'P115', grupo: 'como-es', nl: 'laat', es: 'tarde (de hora)', nota: '«Het is al laat»: ya es tarde. Llegar tarde lleva «te»: «Sorry, ik ben te laat».' },
  { codigo: 'P116', grupo: 'como-es', nl: 'ziek', es: 'enfermo' },
  { codigo: 'P117', grupo: 'como-es', nl: 'boos', es: 'enfadado' },
  { codigo: 'P118', grupo: 'como-es', nl: 'blij', es: 'contento' },
  { codigo: 'P119', grupo: 'como-es', nl: 'bang', es: 'con miedo' },
  { codigo: 'P120', grupo: 'como-es', nl: 'klaar', es: 'listo, terminado' },
  { codigo: 'P121', grupo: 'como-es', nl: 'vaak', es: 'a menudo' },
  { codigo: 'P122', grupo: 'como-es', nl: 'soms', es: 'a veces' },
  { codigo: 'P123', grupo: 'como-es', nl: 'nooit', es: 'nunca' },
  { codigo: 'P124', grupo: 'como-es', nl: 'altijd', es: 'siempre' },
  { codigo: 'P125', grupo: 'como-es', nl: 'al', es: 'ya' },
  { codigo: 'P126', grupo: 'como-es', nl: 'nog', es: 'todavía' },
  { codigo: 'P127', grupo: 'como-es', nl: 'weer', es: 'otra vez', parecidas: ['het weer'] },
  { codigo: 'P128', grupo: 'como-es', nl: 'samen', es: 'juntos' },
];

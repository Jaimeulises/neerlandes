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
  { grupo: 'gente', nl: 'het kind', es: 'el niño' },
  { grupo: 'gente', nl: 'het gezin', es: 'la familia (padres e hijos)', nota: 'Het gezin es la familia que vive junta; de familie, toda la familia.' },
  { grupo: 'gente', nl: 'de familie', es: 'la familia (toda)' },
  { grupo: 'gente', nl: 'het meisje', es: 'la chica', nota: 'Los diminutivos (-je) son siempre het.' },
  { grupo: 'gente', nl: 'de jongen', es: 'el chico' },
  { grupo: 'gente', nl: 'de baby', es: 'el bebé' },

  // Casa y comida
  { grupo: 'casa', nl: 'het huis', es: 'la casa' },
  { grupo: 'casa', nl: 'de keuken', es: 'la cocina' },
  { grupo: 'casa', nl: 'de woonkamer', es: 'el salón' },
  { grupo: 'casa', nl: 'de slaapkamer', es: 'el dormitorio' },
  { grupo: 'casa', nl: 'de badkamer', es: 'el baño' },
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
  { grupo: 'tiempo', nl: 'het uur', es: 'la hora' },
  { grupo: 'tiempo', nl: 'de ochtend', es: 'la mañana' },
  { grupo: 'tiempo', nl: 'de middag', es: 'la tarde (hasta las seis)' },
  { grupo: 'tiempo', nl: 'de avond', es: 'la noche (antes de acostarse)', nota: 'De avond es de la cena a la hora de dormir; de nacht, cuando ya se duerme.' },
  { grupo: 'tiempo', nl: 'vanavond', es: 'esta noche' },
  { grupo: 'tiempo', nl: 'vanochtend', es: 'esta mañana', otras: ['vanmorgen'] },
  { grupo: 'tiempo', nl: 'overmorgen', es: 'pasado mañana' },
  { grupo: 'tiempo', nl: 'eergisteren', es: 'anteayer' },
  { grupo: 'tiempo', nl: 'straks', es: 'luego, dentro de un rato' },
  { grupo: 'tiempo', nl: 'meteen', es: 'enseguida' },
  { grupo: 'tiempo', nl: 'binnenkort', es: 'pronto, dentro de poco' },
  { grupo: 'tiempo', nl: 'net', es: 'hace un momento', nota: '«Ik ben net thuis»: acabo de llegar a casa.' },

  // Trabajo y ciudad
  { grupo: 'ciudad', nl: 'het werk', es: 'el trabajo' },
  { grupo: 'ciudad', nl: 'de baan', es: 'el empleo, el puesto' },
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
  { grupo: 'conversar', nl: 'volgens mij', es: 'creo que, en mi opinión' },
  { grupo: 'conversar', nl: 'dat klopt', es: 'es verdad, correcto' },
  { grupo: 'conversar', nl: 'dat maakt niet uit', es: 'da igual' },
  { grupo: 'conversar', nl: 'geen idee', es: 'ni idea' },
  { grupo: 'conversar', nl: 'ik heb zin in', es: 'me apetece (algo)', nota: '«Ik heb zin in koffie», «Ik heb zin om te gaan».' },
  { grupo: 'conversar', nl: 'het valt mee', es: 'no es para tanto' },
  { grupo: 'conversar', nl: 'het spijt me', es: 'lo siento' },
  { grupo: 'conversar', nl: 'wat jammer', es: 'qué pena' },
  { grupo: 'conversar', nl: 'gezellig', es: 'agradable, acogedor', nota: 'Para un ambiente, una casa o una reunión a gusto. Muy neerlandés.' },
  { grupo: 'conversar', nl: 'lekker', es: 'rico; a gusto' },
  { grupo: 'conversar', nl: 'even', es: 'un momento (suaviza una petición)', nota: '«Kun je even helpen?»: ¿me ayudas un momento?' },
  { grupo: 'conversar', nl: 'toch', es: '¿verdad? (al final de la frase)' },
  { grupo: 'conversar', nl: 'nou', es: 'bueno… (para arrancar o dudar)' },
  { grupo: 'conversar', nl: 'inderdaad', es: 'efectivamente' },
  { grupo: 'conversar', nl: 'misschien', es: 'quizás' },
  { grupo: 'conversar', nl: 'natuurlijk', es: 'claro, por supuesto' },
  { grupo: 'conversar', nl: 'helaas', es: 'por desgracia' },
  { grupo: 'conversar', nl: 'eindelijk', es: 'por fin' },

  // Cómo es, cómo está
  { grupo: 'como-es', nl: 'druk', es: 'ocupado, con mucho lío' },
  { grupo: 'como-es', nl: 'rustig', es: 'tranquilo' },
  { grupo: 'como-es', nl: 'moe', es: 'cansado' },
  { grupo: 'como-es', nl: 'moeilijk', es: 'difícil' },
  { grupo: 'como-es', nl: 'makkelijk', es: 'fácil' },
  { grupo: 'como-es', nl: 'duur', es: 'caro' },
  { grupo: 'como-es', nl: 'goedkoop', es: 'barato' },
  { grupo: 'como-es', nl: 'vroeg', es: 'temprano' },
  { grupo: 'como-es', nl: 'laat', es: 'tarde (de hora)', nota: '«Het is al laat»: ya es tarde.' },
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
  { grupo: 'como-es', nl: 'weer', es: 'otra vez' },
  { grupo: 'como-es', nl: 'samen', es: 'juntos' },
];

// Corregir pidiendo: tras el primer fallo de una frase o de una forma verbal,
// antes de enseñar la solución, una pista y otro intento. La pista es la de lo
// que ha fallado (cada diagnóstico trae la suya) y, si no se sabe qué ha
// fallado, una general según lo que se ha hecho mal. Nunca da la respuesta:
// lo que se aprende es a arreglarla uno mismo, que es lo que hay que hacer al
// hablar.
//
// Cómo se escribe una pista (decisión 0007):
// 1. Dice dónde mirar y qué regla, nunca el sitio ni la forma buena, y su
//    pregunta no se contesta con la propia pista.
// 2. El inglés hace de disparador («así lo dirías en inglés»), sin poner detrás
//    la solución en neerlandés.
// 3. Una sola, corta (unas 25 palabras como mucho).
// 4. Si el fallo es entre dos opciones (hebben o zijn, -t o -d, con ge- o sin
//    él), el mismo texto en las dos direcciones: hay que aplicar el criterio.
// 5. La explicación entera queda para después del segundo intento.

import type { Diagnostico, Ejercicio, Veredicto } from '../../motor';

/** Las pistas generales, para cuando no se sabe qué regla ha fallado. Salen en docs/revision.md. */
export const PISTAS_GENERALES = {
  ordenar: 'Las palabras son esas; falla el orden. Empieza por el verbo conjugado: ¿qué tipo de frase es, y dónde va el verbo en ella?',
  traducirOrden: 'Tienes las palabras buenas, pero no en su sitio. Empieza por el verbo conjugado: ¿qué tipo de frase es, y dónde va el verbo en ella?',
  completar: 'Esa forma no es la buena. Revisa cómo se escribe y si va con este sujeto y en este tiempo.',
} as const;

/**
 * De qué se habla primero si hay varios fallos: del sitio del verbo, que es lo que la app quiere arreglar, y
 * después de lo demás. Lo que no está en la lista va al final.
 */
const PRIORIDAD = [
  'inversion',
  'preguntas',
  'subordinada-delante',
  'subordinada',
  'modal',
  'perfectum-orden',
  'separables',
  'niet',
  'auxiliar',
  'presente',
  'pasado',
  'participio',
  'participio-irregular',
];

function prioridad(d: Diagnostico): number {
  const i = PRIORIDAD.indexOf(d.destreza);
  return i < 0 ? PRIORIDAD.length : i;
}

/**
 * La pista para el segundo intento: la del fallo más importante o, si no se sabe qué ha fallado, una general.
 * Una sola: dos a la vez son mucho que leer antes de volver a intentarlo y reparten la atención entre dos
 * reglas; la otra se explica en el resultado.
 *
 * Vacío si el ejercicio no se reintenta: el dictado es para el oído, las opciones se acertarían por descarte y
 * decir se valora uno mismo. Tampoco al escribir la frase con otras palabras sin que se sepa qué falla: suele
 * ser una palabra que no se sabe o una errata, la pista no podría señalar nada y el segundo intento sería
 * adivinar.
 */
export function pistasDeReintento(ejercicio: Ejercicio, diagnosticos: readonly Diagnostico[], veredicto: Veredicto): string[] {
  if (ejercicio.forma !== 'traducir' && ejercicio.forma !== 'completar' && ejercicio.forma !== 'ordenar') return [];
  if (veredicto === 'exacta' || veredicto === 'tildes' || veredicto === 'vacia') return [];
  const primera = [...diagnosticos].filter((d) => d.pista).sort((a, b) => prioridad(a) - prioridad(b))[0]?.pista;
  if (primera) return [primera];
  if (ejercicio.forma === 'ordenar') return [PISTAS_GENERALES.ordenar];
  if (ejercicio.forma === 'completar') return [PISTAS_GENERALES.completar];
  return veredicto === 'orden' ? [PISTAS_GENERALES.traducirOrden] : [];
}

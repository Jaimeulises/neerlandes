// Corregir pidiendo: tras el primer fallo de una frase o de una forma verbal,
// antes de enseñar la solución, una pista y otro intento. La pista es la de lo
// que ha fallado (cada diagnóstico trae la suya) y, si no se sabe qué ha
// fallado, una general según lo que se ha hecho mal. Nunca da la respuesta:
// lo que se aprende es a arreglarla uno mismo, que es lo que hay que hacer al
// hablar.

import type { Diagnostico, Ejercicio, Veredicto } from '../../motor';

/** Las pistas generales, para cuando no se sabe qué regla ha fallado. Salen en docs/revision.md. */
export const PISTAS_GENERALES = {
  ordenar:
    'Las palabras son esas; falla el orden. Empieza por el verbo conjugado: segundo en la frase principal, primero en una pregunta de sí o no y al final en una subordinada. Lo demás se coloca a su alrededor.',
  traducirOrden:
    'Tienes las palabras buenas, pero no en su sitio. Empieza por el verbo conjugado: segundo en la frase principal, primero en una pregunta de sí o no y al final en una subordinada.',
  traducir: 'Alguna palabra no es la que toca, o falta o sobra alguna. Repasa también la forma de cada verbo.',
  completar: 'Esa forma no es la que va aquí. Fíjate en quién hace la acción y en el tiempo de la frase.',
} as const;

/** Como mucho dos pistas a la vez: más es leer, no intentarlo. */
const MAXIMO = 2;

/**
 * Las pistas para el segundo intento: las de los diagnósticos o, si no hay, una general. Vacío si el ejercicio no
 * se reintenta: el dictado es para el oído, las opciones se acertarían por descarte y decir se valora uno mismo.
 */
export function pistasDeReintento(ejercicio: Ejercicio, diagnosticos: readonly Diagnostico[], veredicto: Veredicto): string[] {
  if (ejercicio.forma !== 'traducir' && ejercicio.forma !== 'completar' && ejercicio.forma !== 'ordenar') return [];
  if (veredicto === 'exacta' || veredicto === 'tildes' || veredicto === 'vacia') return [];
  const deDiagnosticos = [...new Set(diagnosticos.flatMap((d) => (d.pista ? [d.pista] : [])))].slice(0, MAXIMO);
  if (deDiagnosticos.length > 0) return deDiagnosticos;
  if (ejercicio.forma === 'ordenar') return [PISTAS_GENERALES.ordenar];
  if (ejercicio.forma === 'completar') return [PISTAS_GENERALES.completar];
  return [veredicto === 'orden' ? PISTAS_GENERALES.traducirOrden : PISTAS_GENERALES.traducir];
}

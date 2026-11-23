// El diagnóstico de errores: qué regla se ha roto en una respuesta. Cada pista
// lo usa desde su `diagnosticar`.

import { palabras, type Diagnostico, type Ejercicio } from '../../motor';
import { diagnosticarFrase } from './frase';
import { FORMAS_HEBBEN, FORMAS_ZIJN } from './formas';
import { papelesDe, papelesDeFraseLibre, type Papeles } from './papeles';
import { explicarAuxiliar, explicarConjugacion, explicarParticipio } from './verbo';
import type { Frase } from '../orden/pista';

export { diagnosticarFrase } from './frase';
export { papelesDe, papelesDeFraseLibre, type Papeles } from './papeles';
export { explicarAuxiliar, explicarConjugacion, explicarParticipio } from './verbo';

/** Las respuestas que valen de un ejercicio en que se escribe u ordena una frase entera. */
function validasDe(ejercicio: Ejercicio): readonly string[] | null {
  if (ejercicio.forma === 'traducir') return ejercicio.respuestas;
  if (ejercicio.forma === 'ordenar') return ejercicio.validas;
  return null;
}

/** El diagnóstico de una frase de la pista de orden (o de un separable) traducida u ordenada. */
export function diagnosticarConFrase(frase: Frase, ejercicio: Ejercicio, respuesta: string): Diagnostico[] {
  const validas = validasDe(ejercicio);
  return validas ? diagnosticarFrase(papelesDe(frase), respuesta, validas) : [];
}

/** El diagnóstico de una frase de ejemplo (perfectum, pasado) traducida, a partir de su verbo conjugado. */
export function diagnosticarFraseLibre(
  ejercicio: Ejercicio,
  respuesta: string,
  verbo: string,
  finales: readonly string[],
  tipoFinal: Papeles['tipoFinal'],
): Diagnostico[] {
  const validas = validasDe(ejercicio);
  if (!validas) return [];
  const papeles = papelesDeFraseLibre(validas[0] ?? '', verbo, finales, tipoFinal);
  return papeles ? diagnosticarFrase(papeles, respuesta, validas) : [];
}

/** El auxiliar de una frase en perfectum: la primera forma de hebben o zijn. */
export function auxiliarDe(frase: string): string | undefined {
  return palabras(frase).find((w) => FORMAS_HEBBEN.has(w) || FORMAS_ZIJN.has(w));
}

const PRONOMBRES = new Set(['ik', 'jij', 'je', 'hij', 'zij', 'ze', 'het', 'we', 'wij', 'jullie', 'u']);

/** El sujeto de una frase con hueco: lo que va justo delante si es un pronombre o un nombre, o lo de detrás si va invertido. */
export function sujetoDeHueco(antes: string, despues: string): { sujeto: string[]; invertido: boolean } {
  const a = palabras(antes);
  const d = palabras(despues);
  if (a.length > 0 && PRONOMBRES.has(a.at(-1) ?? '')) return { sujeto: a.slice(-1), invertido: false };
  if (d.length > 0 && PRONOMBRES.has(d[0] ?? '')) return { sujeto: d.slice(0, 1), invertido: true };
  // «Mijn zus ___», «Mijn ouders ___»: todo lo de delante, si son pocas palabras.
  if (a.length > 0 && a.length <= 3) return { sujeto: a, invertido: false };
  return { sujeto: [], invertido: false };
}

/** El diagnóstico de una forma conjugada escrita en un hueco o elegida. */
export function diagnosticarForma(esperada: string, dada: string, antes: string, despues: string): Diagnostico[] {
  const palabra = palabras(dada)[0];
  if (!palabra) return [];
  const { sujeto, invertido } = sujetoDeHueco(antes, despues);
  const d = explicarConjugacion(palabras(esperada)[0] ?? esperada, palabra, sujeto, invertido);
  return d ? [d] : [];
}

export function diagnosticarParticipio(esperado: string, dado: string): Diagnostico[] {
  const palabra = palabras(dado)[0];
  if (!palabra) return [];
  const d = explicarParticipio(palabras(esperado)[0] ?? esperado, palabra);
  return d ? [d] : [];
}

export function diagnosticarAuxiliar(elegido: string, correcto: string, participio: string, fraseBuena: string): Diagnostico[] {
  return elegido === correcto ? [] : [explicarAuxiliar(elegido, correcto, participio, fraseBuena)];
}

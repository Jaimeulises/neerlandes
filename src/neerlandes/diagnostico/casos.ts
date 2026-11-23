// Cada explicación de un fallo tiene un nombre fijo, su caso. Sirve para
// comprobar que todas tienen un ejemplo en docs/revision.md (los E), donde una
// persona nativa puede revisar lo que dicen: si se añade una explicación nueva,
// su caso va aquí y las pruebas piden su ejemplo.

import type { Diagnostico } from '../../motor';

export const CASOS = [
  // El orden de la frase
  'pregunta-interrogativa',
  'pregunta-si-no',
  'inversion-delante',
  'inversion-otro-delante',
  'inversion-segunda',
  'inversion-niet',
  'separable-pegado',
  'participio-al-final',
  'infinitivo-al-final',
  'particula-al-final',
  'falta-particula',
  'subordinada-un-verbo',
  'subordinada-varios-verbos',
  'subordinada-delante',
  'geen',
  'niet-sitio',
  // La conjugación
  'pasado-con-presente',
  'pasado-plural-sin-n',
  'pasado-singular-con-n',
  'pasado-te-de',
  'pasado-irregular',
  'presente-jij-detras',
  'presente-ik-con-t',
  'presente-falta-t',
  'presente-je-posesivo',
  'presente-plural',
  'presente-infinitivo',
  'presente-con-pasado',
  'presente-otra',
  // El participio
  'participio-separable',
  'participio-irregular',
  'participio-sin-datos',
  'participio-prefijo',
  'participio-sin-ge',
  'participio-raiz-td',
  'participio-kofschip',
  // El auxiliar del perfectum
  'auxiliar-zijn',
  'auxiliar-hebben',
  // El artículo
  'articulo-diminutivo',
  'articulo-het',
  'articulo-de',
] as const;

export type Caso = (typeof CASOS)[number];

/** Un diagnóstico de la parte de neerlandés: lleva siempre su caso. */
export type DiagnosticoNl = Diagnostico & { readonly caso: Caso };

/**
 * Los casos que ningún contenido de la app puede provocar, y por qué. Se quedan por si cambia el contenido,
 * pero no llevan ejemplo: no hay frase de la app con que hacerlo.
 */
export const CASOS_SIN_EJEMPLO: Readonly<Partial<Record<Caso, string>>> = {
  'participio-sin-datos': 'Todos los participios de la app están en los datos (las pruebas lo comprueban), así que siempre se sabe de qué verbo es.',
};

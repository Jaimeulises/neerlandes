// El papel de cada trozo de una frase: qué es el sujeto, cuál el verbo
// conjugado, qué va al final (infinitivo, participio, partícula) y, en las
// subordinadas, la conjunción y su verbo. Sale de la posición de las fichas
// según el grupo, porque cada grupo tiene su estructura fija; las pruebas
// comprueban que todas las frases dan papeles con sentido.

import { palabras } from '../../motor';
import type { Frase } from '../orden/pista';
import { FORMAS_HEBBEN, FORMAS_ZIJN } from './formas';

export type TipoFinal = 'infinitivo' | 'participio' | 'particula';

export interface Papeles {
  /** Lo que va delante del verbo cuando no es el sujeto (morgen, la subordinada…). Vacío si empieza por el sujeto o es pregunta de sí o no. */
  readonly delante: readonly string[];
  /** La palabra interrogativa (waar, hoe laat…), si la hay. */
  readonly interrogativa: readonly string[];
  /** El verbo conjugado de la principal. */
  readonly verbo: string;
  readonly sujeto: readonly string[];
  /** Lo que se va al final de la principal: infinitivo, participio o partícula. */
  readonly finales: readonly string[];
  readonly tipoFinal: TipoFinal | null;
  readonly pregunta: boolean;
  /** La subordinada, si la hay. */
  readonly subordinada: {
    readonly conjuncion: string;
    /** El verbo conjugado de la subordinada (el que se va al final). */
    readonly verbo: string;
    /** El sujeto de la subordinada, si se sabe (para ver si su verbo está bien conjugado). */
    readonly sujeto: readonly string[];
    /** Todos los verbos del final de la subordinada, en su orden («gaat regenen»). */
    readonly verbos: readonly string[];
    /** Las demás palabras de la subordinada, sin la conjunción ni los verbos. */
    readonly resto: readonly string[];
    /** Si va delante de la principal. */
    readonly delante: boolean;
  } | null;
}

const INTERROGATIVAS = new Set(['wat', 'waar', 'hoe', 'hoelang', 'waarom', 'wanneer', 'wie', 'welke', 'welk', 'hoeveel']);
const PRONOMBRES_SUJETO = new Set(['ik', 'jij', 'je', 'hij', 'zij', 'ze', 'het', 'we', 'wij', 'jullie', 'u', 'er']);

export function esInterrogativa(trozo: readonly string[]): boolean {
  return trozo.length > 0 && INTERROGATIVAS.has(trozo[0] ?? '');
}

/** Las palabras de cada ficha. */
function trozos(frase: Frase): string[][] {
  return frase.fichas.map((f) => palabras(f));
}

const vacio = (): string[] => [];

/** Verbo y sujeto según dónde va el verbo: primero en las preguntas de sí o no, tras la interrogativa en las demás, segundo si no. */
function verboYSujeto(t: readonly string[][], pregunta: boolean): Pick<Papeles, 'verbo' | 'sujeto' | 'interrogativa'> & { siguiente: number } {
  const t0 = t[0] ?? [];
  if (pregunta && esInterrogativa(t0)) return { interrogativa: t0, verbo: (t[1] ?? [])[0] ?? '', sujeto: t[2] ?? [], siguiente: 3 };
  if (pregunta) {
    // «zullen we» va en una sola ficha.
    if (t0.length === 2) return { interrogativa: vacio(), verbo: t0[0] ?? '', sujeto: [t0[1] ?? ''], siguiente: 1 };
    return { interrogativa: vacio(), verbo: t0[0] ?? '', sujeto: t[1] ?? [], siguiente: 2 };
  }
  return { interrogativa: vacio(), sujeto: t0, verbo: (t[1] ?? [])[0] ?? '', siguiente: 2 };
}

export function papelesDe(frase: Frase): Papeles {
  const t = trozos(frase);
  const pregunta = frase.frase.endsWith('?');
  const ultima = t.at(-1) ?? [];
  const sinSubordinada = { subordinada: null };
  switch (frase.grupo) {
    case 'inversion':
      return { delante: t[0] ?? [], interrogativa: [], verbo: (t[1] ?? [])[0] ?? '', sujeto: t[2] ?? [], finales: [], tipoFinal: null, pregunta, ...sinSubordinada };
    case 'modal':
    case 'perfectum':
    case 'separables': {
      const vs = verboYSujeto(t, pregunta);
      const tipoFinal: TipoFinal = frase.grupo === 'modal' ? 'infinitivo' : frase.grupo === 'perfectum' ? 'participio' : 'particula';
      return { delante: [], ...vs, finales: ultima, tipoFinal, pregunta, ...sinSubordinada };
    }
    case 'niet':
    case 'preguntas': {
      const vs = verboYSujeto(t, pregunta);
      return { delante: [], ...vs, finales: [], tipoFinal: null, pregunta, ...sinSubordinada };
    }
    case 'subordinada': {
      // principal | conjunción | sujeto | … | verbos del final. De la principal no se mira nada: es corta
      // y no es lo que se practica.
      const verbos = ultima;
      const medio = t.slice(2, -1).flat();
      return {
        delante: [],
        interrogativa: [],
        sujeto: [],
        verbo: '',
        finales: [],
        tipoFinal: null,
        pregunta,
        subordinada: { conjuncion: (t[1] ?? [])[0] ?? '', verbo: verbos[0] ?? '', sujeto: t[2] ?? [], verbos, resto: medio, delante: false },
      };
    }
    case 'subordinada-delante': {
      // subordinada entera (conjunción … verbos) | verbo | sujeto | resto
      const sub = t[0] ?? [];
      const conjuncion = sub[0] ?? '';
      // Al final de la subordinada pueden ir dos verbos («gegeten hebben»): el participio y el conjugado.
      const ultimaSub = sub.at(-1) ?? '';
      const penultima = sub.at(-2) ?? '';
      const dosVerbos = FORMAS_HEBBEN.has(ultimaSub) || FORMAS_ZIJN.has(ultimaSub) ? (penultima.startsWith('ge') ? 2 : 1) : 1;
      const verbos = sub.slice(-dosVerbos);
      const verboSub = dosVerbos === 2 ? ultimaSub : (verbos[0] ?? '');
      return {
        delante: sub,
        interrogativa: [],
        verbo: (t[1] ?? [])[0] ?? '',
        sujeto: t[2] ?? [],
        finales: [],
        tipoFinal: null,
        pregunta,
        // El sujeto es el pronombre de detrás de la conjunción («als ik tijd heb»); si no lo es, no se sabe.
        subordinada: { conjuncion, verbo: verboSub, sujeto: PRONOMBRES_SUJETO.has(sub[1] ?? '') ? sub.slice(1, 2) : [], verbos, resto: sub.slice(1, -dosVerbos), delante: true },
      };
    }
  }
}

const DETERMINANTES = new Set(['mijn', 'de', 'het', 'ons', 'onze', 'je', 'jouw', 'zijn', 'haar', 'hun', 'die', 'dat', 'deze', 'dit']);

/**
 * Los papeles de una frase sin fichas (las de ejemplo de los verbos), a partir del verbo conjugado. Si
 * empieza por un pronombre o un determinante, eso es el sujeto; si no, lo que va delante y el sujeto detrás.
 */
export function papelesDeFraseLibre(texto: string, verbo: string, finales: readonly string[], tipoFinal: TipoFinal | null): Papeles | null {
  const w = palabras(texto);
  const i = w.indexOf(verbo);
  if (i < 0) return null;
  const pregunta = texto.trim().endsWith('?');
  const empiezaPorSujeto = i > 0 && (PRONOMBRES_SUJETO.has(w[0] ?? '') || (DETERMINANTES.has(w[0] ?? '') && i <= 3));
  const base = { interrogativa: [], verbo, finales, tipoFinal, pregunta, subordinada: null };
  if (i === 0) return { ...base, delante: [], sujeto: w.slice(1, 2) };
  if (empiezaPorSujeto) return { ...base, delante: [], sujeto: w.slice(0, i) };
  return { ...base, delante: w.slice(0, i), sujeto: w.slice(i + 1, i + 2) };
}

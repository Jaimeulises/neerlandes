// Qué verbo es cada forma: un índice de todas las formas que salen de los
// datos de verbos (presente, participio, pasado e infinitivo), para reconocer
// el verbo que el alumno quería decir aunque lo haya conjugado mal.

import { normalizar } from '../../motor';
import { alternativas } from '../comun';
import { SEPARABLES, VERBOS, type DatosVerbo } from '../verbos/datos';

export type TipoForma = 'infinitivo' | 'presente' | 'participio' | 'pasado';

export interface FormaVerbal {
  readonly inf: string;
  readonly tipo: TipoForma;
  readonly verbo?: DatosVerbo;
  /** Si el participio es irregular (solo en los participios). */
  readonly irregular?: boolean;
  readonly aux?: 'hebben' | 'zijn';
}

function presenteDe(v: DatosVerbo): readonly string[] {
  if (v.presente) return v.presente.flatMap(alternativas);
  if (!v.raiz) return [];
  return [v.raiz, v.raiz.endsWith('t') ? v.raiz : `${v.raiz}t`];
}

function crearIndice(): Map<string, FormaVerbal[]> {
  const indice = new Map<string, FormaVerbal[]>();
  const poner = (forma: string, f: FormaVerbal): void => {
    const clave = normalizar(forma);
    if (clave === '' || clave.includes(' ')) return;
    const lista = indice.get(clave) ?? [];
    if (!lista.some((x) => x.inf === f.inf && x.tipo === f.tipo)) lista.push(f);
    indice.set(clave, lista);
  };
  for (const v of VERBOS) {
    const comun = { inf: v.inf, verbo: v, ...(v.aux ? { aux: v.aux } : {}) };
    poner(v.inf, { ...comun, tipo: 'infinitivo' });
    for (const p of presenteDe(v)) poner(p, { ...comun, tipo: 'presente' });
    if (v.conJij) for (const p of alternativas(v.conJij)) poner(p, { ...comun, tipo: 'presente' });
    if (v.participio) for (const p of alternativas(v.participio)) poner(p, { ...comun, tipo: 'participio', irregular: v.irregular === true });
    for (const p of (v.pasado ?? []).flatMap(alternativas)) poner(p, { ...comun, tipo: 'pasado' });
  }
  for (const s of SEPARABLES) {
    poner(s.inf, { inf: s.inf, tipo: 'infinitivo', aux: s.aux });
    poner(s.participio, { inf: s.inf, tipo: 'participio', aux: s.aux, irregular: false });
  }
  return indice;
}

const INDICE = crearIndice();

/** Lo que se sabe de una forma: puede ser de varios verbos o de varios tiempos (zijn es infinitivo y presente). */
export function formasDe(palabra: string): readonly FormaVerbal[] {
  return INDICE.get(normalizar(palabra)) ?? [];
}

/**
 * Si dos palabras son formas del mismo verbo. Con los verbos de los datos se mira el índice; con los demás,
 * se acepta que difieran en una -t, una -en o una -n final (kijk, kijkt, kijken).
 */
export function mismoVerbo(a: string, b: string): boolean {
  const x = normalizar(a);
  const y = normalizar(b);
  if (x === y) return true;
  const fx = formasDe(x);
  const fy = formasDe(y);
  if (fx.length > 0 && fy.length > 0) return fx.some((f) => fy.some((g) => g.inf === f.inf));
  const terminaciones = ['t', 'en', 'n'];
  return terminaciones.some((t) => x === y + t || y === x + t) || (x.length > 3 && y.length > 3 && x.replace(/(en|t|n)$/, '') === y.replace(/(en|t|n)$/, ''));
}

/** Las formas de hebben y de zijn como auxiliar. */
export const FORMAS_HEBBEN: ReadonlySet<string> = new Set(['heb', 'hebt', 'heeft', 'hebben', 'had', 'hadden']);
export const FORMAS_ZIJN: ReadonlySet<string> = new Set(['ben', 'bent', 'is', 'zijn', 'was', 'waren']);

/** La forma de zijn que corresponde a una de hebben, y al revés (heb y ben, heeft e is…). */
export const AUXILIAR_CONTRARIO: Readonly<Record<string, string>> = {
  heb: 'ben',
  hebt: 'bent',
  heeft: 'is',
  hebben: 'zijn',
  had: 'was',
  hadden: 'waren',
  ben: 'heb',
  bent: 'hebt',
  is: 'heeft',
  zijn: 'hebben',
  was: 'had',
  waren: 'hadden',
};

// Qué verbo es cada forma: un índice de todas las formas que salen de los
// datos de verbos (presente, participio, pasado e infinitivo), para reconocer
// el verbo que el alumno quería decir aunque lo haya conjugado mal.

import { normalizar } from '../../motor';
import { alternativas } from '../comun';
import { formaConJij, formasPresente } from '../verbos/conjugacion';
import { SEPARABLES, VERBOS, type DatosVerbo } from '../verbos/datos';
import { OTROS_VERBOS } from './datos';

export type TipoForma = 'infinitivo' | 'presente' | 'participio' | 'pasado';

export interface FormaVerbal {
  readonly inf: string;
  readonly tipo: TipoForma;
  readonly verbo?: DatosVerbo;
  /** Si el participio es irregular (solo en los participios). */
  readonly irregular?: boolean;
  /** Si el verbo es separable (opbellen, thuiskomen). */
  readonly separable?: boolean;
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
    poner(s.inf, { inf: s.inf, tipo: 'infinitivo', aux: s.aux, separable: true });
    poner(s.participio, { inf: s.inf, tipo: 'participio', aux: s.aux, irregular: false, separable: true });
  }
  for (const o of OTROS_VERBOS) {
    const comun = { inf: o.inf, aux: o.aux, ...(o.separable ? { separable: true } : {}) };
    poner(o.inf, { ...comun, tipo: 'infinitivo' });
    poner(o.participio, { ...comun, tipo: 'participio', irregular: o.irregular });
  }
  return indice;
}

const INDICE = crearIndice();

/** Lo que se sabe de una forma: puede ser de varios verbos o de varios tiempos (zijn es infinitivo y presente). */
export function formasDe(palabra: string): readonly FormaVerbal[] {
  return INDICE.get(normalizar(palabra)) ?? [];
}

/** Lo que queda de un verbo de los datos sin terminaciones: su raíz, la forma de ik y el infinitivo con y sin -en. */
function raicesDe(formas: readonly FormaVerbal[]): Set<string> {
  const raices = new Set<string>();
  for (const f of formas) {
    raices.add(f.inf);
    raices.add(f.inf.replace(/en$/, ''));
    if (f.verbo?.raiz) raices.add(f.verbo.raiz);
    for (const ik of alternativas(f.verbo?.presente?.[0] ?? '')) if (ik !== '') raices.add(ik);
  }
  return raices;
}

/**
 * Si una palabra que no está en el índice parece una forma regular inventada de alguno de esos verbos: su raíz
 * con -te, -de, -ten, -den, -t, -d o -en, con ge- o sin él («komde», «slaapte», «woonten», «speeld»). Es el
 * fallo de quien aplica la regla a un irregular o se equivoca de terminación, y hay que reconocerlo para
 * explicarlo.
 */
function pareceDe(palabra: string, formas: readonly FormaVerbal[]): boolean {
  const raices = raicesDe(formas);
  const sinGe = palabra.replace(/^ge/, '');
  return [palabra, sinGe].some((p) => {
    const sinFinal = p.replace(/(ten|den|te|de|en|t|d)$/, '');
    return sinFinal !== p && sinFinal.length > 1 && raices.has(sinFinal);
  });
}

/**
 * Si dos palabras son formas del mismo verbo. Con los verbos de los datos se mira el índice, y una forma
 * inventada vale si sale de la raíz de uno de ellos; con los demás, se acepta que difieran en una -t, una -en
 * o una -n final (kijk, kijkt, kijken).
 */
export function mismoVerbo(a: string, b: string): boolean {
  const x = normalizar(a);
  const y = normalizar(b);
  if (x === y) return true;
  const fx = formasDe(x);
  const fy = formasDe(y);
  if (fx.length > 0 && fy.length > 0) return fx.some((f) => fy.some((g) => g.inf === f.inf));
  if (fx.length > 0 && pareceDe(y, fx)) return true;
  if (fy.length > 0 && pareceDe(x, fy)) return true;
  const terminaciones = ['t', 'en', 'n'];
  return terminaciones.some((t) => x === y + t || y === x + t) || (x.length > 3 && y.length > 3 && x.replace(/(en|t|n)$/, '') === y.replace(/(en|t|n)$/, ''));
}

/** El presente del verbo de una forma, por persona, y la forma con jij detrás. null si el verbo no está en los datos. */
export function presenteDelVerbo(palabra: string): { readonly formas: readonly (readonly string[])[]; readonly conJij: readonly string[] } | null {
  const v = formasDe(palabra).find((f) => f.verbo?.raiz !== undefined || f.verbo?.presente !== undefined)?.verbo;
  if (!v) return null;
  return { formas: formasPresente(v).map(alternativas), conJij: alternativas(formaConJij(v)) };
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

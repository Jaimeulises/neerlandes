// Corrige una respuesta escrita contra las que valen. Genérico: no sabe de
// idiomas, solo de palabras. Separa lo que importa para aprender a construir
// frases: si las palabras están bien y falla el orden, o qué palabras sobran
// y cuáles faltan. Un fallo de una letra no se perdona: «werk» por «werkt»
// es justo el error que se quiere ver.

import type { Calificacion } from './contratos';

/**
 * exacta: igual que una que vale (sin contar mayúsculas, puntuación ni espacios).
 * tildes: igual salvo tildes o diéresis; se da por buena y se avisa.
 * orden: las mismas palabras en otro orden.
 * distinta: cambian palabras.
 * vacia: no se ha escrito nada.
 */
export type Veredicto = 'exacta' | 'tildes' | 'orden' | 'distinta' | 'vacia';

/** Una palabra marcada: bien si está en su sitio, sobra en la respuesta, falta en la esperada. */
export interface Marca {
  readonly texto: string;
  readonly estado: 'bien' | 'sobra' | 'falta';
}

export interface Correccion {
  readonly veredicto: Veredicto;
  /** La respuesta que vale más parecida a la dada, tal como está escrita. */
  readonly cercana: string;
  /** La respuesta dada, palabra a palabra: lo que sobra o está fuera de sitio. */
  readonly dada: readonly Marca[];
  /** La cercana, palabra a palabra: lo que faltaba o iba en otro sitio. */
  readonly esperada: readonly Marca[];
}

const PUNTUACION = /[.,!?¿¡;:"“”„«»()[\]…]/g;

/** Minúsculas, apóstrofos rectos, sin puntuación y con un solo espacio entre palabras. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(PUNTUACION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

export function palabras(texto: string): string[] {
  const n = normalizar(texto);
  return n === '' ? [] : n.split(' ');
}

/** Distancia de edición entre dos listas de palabras. */
function distancia(a: readonly string[], b: readonly string[]): number {
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    for (let j = 1; j <= b.length; j++) {
      const cambio = a[i - 1] === b[j - 1] ? 0 : 1;
      fila.push(Math.min((previa[j] ?? 0) + 1, (fila[j - 1] ?? 0) + 1, (previa[j - 1] ?? 0) + cambio));
    }
    previa = fila;
  }
  return previa[b.length] ?? 0;
}

/** Qué posiciones de a y de b forman la subsecuencia común más larga. */
function comunes(a: readonly string[], b: readonly string[]): { enA: Set<number>; enB: Set<number> } {
  const largo: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const fila = largo[i] as number[];
      fila[j] = a[i] === b[j] ? (largo[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(largo[i + 1]?.[j] ?? 0, fila[j + 1] ?? 0);
    }
  }
  const enA = new Set<number>();
  const enB = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      enA.add(i);
      enB.add(j);
      i++;
      j++;
    } else if ((largo[i + 1]?.[j] ?? 0) >= (largo[i]?.[j + 1] ?? 0)) {
      i++;
    } else {
      j++;
    }
  }
  return { enA, enB };
}

function mismasPalabras(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((p, i) => p === y[i]);
}

/**
 * Las palabras como están escritas, con sus mayúsculas y su puntuación, si casan una a una con las
 * normalizadas. Si no casan (un signo suelto, una palabra partida), las normalizadas.
 */
function comoEstan(original: string, normalizadas: readonly string[]): readonly string[] {
  const trozos = original
    .trim()
    .split(/\s+/)
    .filter((t) => normalizar(t) !== '');
  return trozos.length === normalizadas.length && trozos.every((t, i) => normalizar(t) === normalizadas[i]) ? trozos : normalizadas;
}

function marcar(dada: readonly string[], esperada: readonly string[], textoDado: string, textoEsperado: string): { dada: Marca[]; esperada: Marca[] } {
  const { enA, enB } = comunes(dada, esperada);
  const vistaDada = comoEstan(textoDado, dada);
  const vistaEsperada = comoEstan(textoEsperado, esperada);
  return {
    dada: dada.map((p, i) => ({ texto: vistaDada[i] ?? p, estado: enA.has(i) ? 'bien' : 'sobra' })),
    esperada: esperada.map((p, j) => ({ texto: vistaEsperada[j] ?? p, estado: enB.has(j) ? 'bien' : 'falta' })),
  };
}

export function corregir(respuesta: string, validas: readonly string[]): Correccion {
  const primera = validas[0] ?? '';
  const dada = palabras(respuesta);
  if (dada.length === 0) {
    return { veredicto: 'vacia', cercana: primera, dada: [], esperada: comoEstan(primera, palabras(primera)).map((texto) => ({ texto, estado: 'falta' })) };
  }
  const candidatas = validas.map((v) => ({ v, p: palabras(v) }));
  const bien = (v: string, p: readonly string[]): Correccion => ({ veredicto: 'exacta', cercana: v, ...marcar(p, p, v, v) });

  const exacta = candidatas.find((c) => c.p.join(' ') === dada.join(' '));
  if (exacta) return bien(exacta.v, exacta.p);

  const dadaSinTildes = sinTildes(dada.join(' '));
  const conTildes = candidatas.find((c) => sinTildes(c.p.join(' ')) === dadaSinTildes);
  if (conTildes) return { ...bien(conTildes.v, conTildes.p), veredicto: 'tildes' };

  const ordenada = candidatas.find((c) => mismasPalabras(c.p, dada));
  if (ordenada) return { veredicto: 'orden', cercana: ordenada.v, ...marcar(dada, ordenada.p, respuesta, ordenada.v) };

  let mejor = candidatas[0] ?? { v: primera, p: palabras(primera) };
  let menor = Number.POSITIVE_INFINITY;
  for (const c of candidatas) {
    const d = distancia(dada, c.p);
    if (d < menor) {
      menor = d;
      mejor = c;
    }
  }
  return { veredicto: 'distinta', cercana: mejor.v, ...marcar(dada, mejor.p, respuesta, mejor.v) };
}

export function calificacionDe(veredicto: Veredicto): Calificacion {
  return veredicto === 'exacta' || veredicto === 'tildes' ? 'bien' : 'otra_vez';
}

/**
 * La frase con mayúscula inicial y su punto final, si no lo trae. Si empieza por una forma abreviada con
 * apóstrofo («'s avonds»), la mayúscula va en la palabra siguiente («'s Avonds»).
 */
export function comoFrase(texto: string, final = '.'): string {
  const limpio = texto.trim();
  if (limpio === '') return limpio;
  const abreviada = /^(['’][a-z]\s+)(.)/u.exec(limpio);
  const conMayuscula = abreviada
    ? `${abreviada[1] ?? ''}${(abreviada[2] ?? '').toLocaleUpperCase()}${limpio.slice(abreviada[0].length)}`
    : limpio.charAt(0).toLocaleUpperCase() + limpio.slice(1);
  return /[.!?]$/.test(conMayuscula) ? conMayuscula : conMayuscula + final;
}

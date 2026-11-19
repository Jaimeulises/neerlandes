// Piezas que comparten las pistas de neerlandés: alternativas, identificadores,
// huecos en una frase y opciones barajadas sin repetir.

import { comoFrase, normalizar, type Azar, type Ejercicio } from '../motor';

/** «wilt/wil» → ['wilt', 'wil']. La primera es la que se enseña. */
export function alternativas(forma: string): string[] {
  return forma.split('/').map((f) => f.trim()).filter((f) => f !== '');
}

export function primera(forma: string): string {
  return alternativas(forma)[0] ?? forma;
}

/** Un identificador estable a partir de un texto: minúsculas, sin tildes ni signos, con guiones. */
export function idDe(texto: string, maximo = 6): string {
  return normalizar(texto)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter((p) => p !== '')
    .slice(0, maximo)
    .join('-');
}

/** Una frase con un hueco donde estaba una palabra. null si la palabra no está una sola vez. */
export function hueco(frase: string, palabra: string, final = '.'): { antes: string; despues: string } | null {
  const palabras = frase.trim().split(/\s+/);
  const posiciones = palabras.flatMap((p, i) => (normalizar(p) === normalizar(palabra) ? [i] : []));
  if (posiciones.length !== 1) return null;
  const i = posiciones[0] ?? 0;
  const entera = comoFrase(frase, final);
  const enteras = entera.split(/\s+/);
  const antes = enteras.slice(0, i).join(' ');
  const resto = enteras.slice(i + 1).join(' ');
  // Si la palabra quitada llevaba el punto final, el punto se queda detrás del hueco.
  const ultima = enteras[i] ?? '';
  const puntoFinal = i === enteras.length - 1 ? (/[.!?]$/.exec(ultima)?.[0] ?? '') : '';
  return {
    antes: antes === '' ? '' : `${antes} `,
    despues: resto === '' ? puntoFinal : ` ${resto}`,
  };
}

/** Opciones sin repetir (comparando como texto normalizado), con la buena dentro, barajadas. */
export function opcionesCon(correcta: string, distractores: readonly string[], azar: Azar, cuantas = 4): string[] {
  const vistas = new Set([normalizar(correcta)]);
  const elegidas: string[] = [];
  for (const d of azar.barajar(distractores)) {
    if (elegidas.length >= cuantas - 1) break;
    const n = normalizar(d);
    if (vistas.has(n)) continue;
    vistas.add(n);
    elegidas.push(d);
  }
  return azar.barajar([correcta, ...elegidas]);
}

/** Elige una forma de ejercicio entre las que el alumno tiene activadas, con pesos. */
export function elegirForma<F extends Ejercicio['forma']>(azar: Azar, activas: ReadonlySet<Ejercicio['forma']>, pesos: readonly (readonly [F, number])[], porDefecto: F): F {
  const posibles = pesos.filter(([f, peso]) => peso > 0 && activas.has(f));
  const total = posibles.reduce((s, [, peso]) => s + peso, 0);
  if (total === 0) return porDefecto;
  let tirada = azar.siguiente() * total;
  for (const [forma, peso] of posibles) {
    tirada -= peso;
    if (tirada < 0) return forma;
  }
  return posibles[posibles.length - 1]?.[0] ?? porDefecto;
}

/** Baraja las fichas procurando que no salgan ya en su orden. */
export function barajarFichas(fichas: readonly string[], azar: Azar): { id: number; texto: string }[] {
  const conId = fichas.map((texto, id) => ({ id, texto }));
  if (conId.length < 2) return conId;
  let barajadas = azar.barajar(conId);
  for (let intento = 0; intento < 6 && barajadas.every((f, i) => f.id === i); intento++) {
    barajadas = azar.barajar(conId);
  }
  return barajadas;
}

export { comoFrase };

// Piezas que comparten las pistas de neerlandés: alternativas, identificadores,
// huecos en una frase y opciones barajadas sin repetir.

import { comoFrase, normalizar, type Azar, type Ejercicio } from '../motor';
import { IDS_FIJOS } from './ids-fijos';

/** «wilt/wil» → ['wilt', 'wil']. La primera es la que se enseña. */
export function alternativas(forma: string): string[] {
  return forma.split('/').map((f) => f.trim()).filter((f) => f !== '');
}

export function primera(forma: string): string {
  return alternativas(forma)[0] ?? forma;
}

/**
 * El id de un elemento por su código permanente: el que tenía antes de la fase 1, si lo tenía (así su
 * historial sigue con él aunque se corrija el texto), o el propio código si es nuevo. Ver ids-fijos.ts.
 */
export function idFijo(codigo: string): string {
  return IDS_FIJOS[codigo] ?? codigo;
}

/** Huella FNV-1a de 32 bits de un texto (sobre UTF-8), en hexadecimal: nombra el audio grabado y dice si algo revisado ha cambiado. */
export function huella(texto: string): string {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(texto)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
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

/** Pronombres átonos que al escribir también valen en su forma tónica, estén donde estén. */
const TONICAS: Readonly<Record<string, string>> = { we: 'wij', me: 'mij' };

/** La forma tónica de una palabra, si la tiene; «ze» solo abriendo la frase, donde es el sujeto. */
function tonica(palabra: string, abreLaFrase: boolean): string | null {
  const partes = /^(\p{L}+)(.*)$/u.exec(palabra);
  if (!partes) return null;
  const [, letras = '', resto = ''] = partes;
  const minuscula = letras.toLowerCase();
  const forma = TONICAS[minuscula] ?? (abreLaFrase && minuscula === 'ze' ? 'zij' : null);
  if (forma === null) return null;
  const conMayuscula = letras !== minuscula;
  return `${conMayuscula ? forma.charAt(0).toUpperCase() + forma.slice(1) : forma}${resto}`;
}

/**
 * Las respuestas de traducir con las formas tónicas de los pronombres, que también valen al escribir:
 * «wij» por «we» y «mij» por «me» en cualquier sitio, y «zij» por «ze» cuando abre la frase (detrás del
 * verbo «ze» también es objeto: «ik zie ze»). «jij» por «je» va en los datos, porque «je» también es
 * objeto y posesivo («ik bel je op», «je zus»). No se usa al dictar: ahí vale lo que suena.
 */
export function conFormasTonicas(respuestas: readonly string[]): string[] {
  const todas = [...respuestas];
  const vistas = new Set(respuestas.map(normalizar));
  for (const respuesta of respuestas) {
    const palabras = respuesta.split(' ');
    const cambiables = palabras.flatMap((p, i) => (tonica(p, i === 0) === null ? [] : [i]));
    // Todas las mezclas, porque se pueden combinar: «zij zegt dat we…» y «ze zegt dat wij…».
    for (let mezcla = 1; mezcla < 2 ** cambiables.length; mezcla++) {
      const variante = palabras
        .map((p, i) => {
          const k = cambiables.indexOf(i);
          return k >= 0 && ((mezcla >> k) & 1) === 1 ? (tonica(p, i === 0) ?? p) : p;
        })
        .join(' ');
      const n = normalizar(variante);
      if (vistas.has(n)) continue;
      vistas.add(n);
      todas.push(variante);
    }
  }
  return todas;
}

/**
 * Opciones sin repetir (comparando como texto normalizado), con la buena dentro, barajadas. Los
 * distractores se toman en el orden recibido, que es su prioridad: quien no la tenga, que los baraje.
 */
export function opcionesCon(correcta: string, distractores: readonly string[], azar: Azar, cuantas = 4): string[] {
  const vistas = new Set([normalizar(correcta)]);
  const elegidas: string[] = [];
  for (const d of distractores) {
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

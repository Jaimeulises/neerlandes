// Historial de respuestas: qué se contestó, cuándo y cómo fue. De aquí salen
// la racha, lo hecho hoy y las estadísticas. Se guarda compacto y se recorta
// a los últimos días para que no crezca sin fin.

import { diaDe, diasEntre } from './dia';
import type { Calificacion } from './contratos';

export interface Respuesta {
  /** Marca de tiempo en milisegundos. */
  readonly t: number;
  /** Clave «pista/elemento». */
  readonly k: string;
  readonly c: Calificacion;
  /** Forma del ejercicio: opcion, ordenar, traducir, completar, dictado o decir. */
  readonly f: string;
  /** Destrezas que entrenaba el ejercicio. Las respuestas antiguas no las traen. */
  readonly d?: readonly string[];
  /** Destrezas en las que se encontró un fallo concreto, si se falló. */
  readonly x?: readonly string[];
}

export type Historial = readonly Respuesta[];

export const HISTORIAL_VACIO: Historial = [];

/** Días de historial que se conservan al detalle. */
export const DIAS_CONSERVADOS = 400;

export function anotar(historial: Historial, respuesta: Respuesta): Historial {
  const limite = respuesta.t - DIAS_CONSERVADOS * 86_400_000;
  const recortado = historial.length > 0 && (historial[0]?.t ?? 0) < limite ? historial.filter((r) => r.t >= limite) : historial;
  return [...recortado, respuesta];
}

export interface ResumenDia {
  readonly dia: string;
  readonly respuestas: number;
  readonly aciertos: number;
}

export function resumenPorDia(historial: Historial): ResumenDia[] {
  const porDia = new Map<string, { respuestas: number; aciertos: number }>();
  for (const r of historial) {
    const dia = diaDe(new Date(r.t));
    const acumulado = porDia.get(dia) ?? { respuestas: 0, aciertos: 0 };
    acumulado.respuestas++;
    if (r.c !== 'otra_vez') acumulado.aciertos++;
    porDia.set(dia, acumulado);
  }
  return [...porDia.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([dia, v]) => ({ dia, ...v }));
}

/**
 * Días seguidos con estudio, contando hoy si ya se ha estudiado y, si no,
 * desde ayer (la racha no se pierde hasta que acaba el día). Los días libres
 * (descanso o pausa) no la rompen.
 */
export function racha(historial: Historial, ahora: Date, libres: ReadonlySet<string> = new Set()): number {
  const dias = new Set(historial.map((r) => diaDe(new Date(r.t))));
  const hoy = diaDe(ahora);
  // Hoy sin estudiar todavía no rompe nada: se cuenta desde ayer.
  let cursor = dias.has(hoy) ? hoy : diaAnterior(hoy);
  let n = 0;
  // Un día libre (descanso o pausa) sin estudio ni suma ni rompe; cualquier otro día sin estudio corta la racha.
  for (let i = 0; i < 1000; i++) {
    if (dias.has(cursor)) n++;
    else if (!libres.has(cursor)) break;
    cursor = diaAnterior(cursor);
  }
  return n;
}

function diaAnterior(dia: string): string {
  const [y = 0, m = 1, d = 1] = dia.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) - 86_400_000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

export function respuestasHoy(historial: Historial, ahora: Date): number {
  const hoy = diaDe(ahora);
  let n = 0;
  for (let i = historial.length - 1; i >= 0; i--) {
    const r = historial[i];
    if (!r) break;
    if (diaDe(new Date(r.t)) !== hoy) break;
    n++;
  }
  return n;
}

/** Últimos n días, del más antiguo al más reciente, con cuántas respuestas hubo en cada uno. */
export function ultimosDias(historial: Historial, ahora: Date, n: number): ResumenDia[] {
  const resumen = new Map(resumenPorDia(historial).map((r) => [r.dia, r]));
  const hoy = diaDe(ahora);
  const dias: ResumenDia[] = [];
  let cursor = hoy;
  for (let i = 0; i < n; i++) {
    dias.unshift(resumen.get(cursor) ?? { dia: cursor, respuestas: 0, aciertos: 0 });
    cursor = diaAnterior(cursor);
  }
  return dias;
}

export { diasEntre };

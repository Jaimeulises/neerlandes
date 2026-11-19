// Construye la ronda de una pista o la ronda de hoy, que mezcla todas: primero
// lo que toca repasar, alternando pistas, y después lo nuevo, repartido entre
// ellas.

import { construirRonda, RONDA_POR_DEFECTO, vistosPorPista, type Azar, type OpcionesRonda, type PasoRonda, type Pista, type Progreso } from '../motor';

export interface PasoMixto {
  readonly pistaId: string;
  readonly paso: PasoRonda;
}

function intercalar<T>(listas: readonly (readonly T[])[]): T[] {
  const resultado: T[] = [];
  const largo = Math.max(0, ...listas.map((l) => l.length));
  for (let i = 0; i < largo; i++) {
    for (const lista of listas) {
      const x = lista[i];
      if (x !== undefined) resultado.push(x);
    }
  }
  return resultado;
}

/** Reparte n entre k partes lo más igual posible: 4 entre 3 da 2, 1, 1. */
export function repartir(n: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
}

export function construirRondaDe(
  pistas: readonly Pista[],
  progreso: Progreso,
  ahora: Date,
  azar: Azar,
  opciones: OpcionesRonda = RONDA_POR_DEFECTO,
): PasoMixto[] {
  const vistos = vistosPorPista(pistas, progreso);
  const nuevos = repartir(opciones.nuevosMaximo, pistas.length);
  const porPista = pistas.map((pista, i) =>
    construirRonda(pista, progreso, ahora, azar, { ...opciones, nuevosMaximo: nuevos[i] ?? 0 }, vistos).map((paso) => ({ pistaId: pista.id, paso })),
  );
  const repasos = intercalar(porPista.map((l) => l.filter((p) => p.paso.presentacion === null)));
  const nuevosPasos = intercalar(porPista.map((l) => l.filter((p) => p.paso.presentacion !== null)));
  return [...repasos, ...nuevosPasos].slice(0, opciones.tamano);
}

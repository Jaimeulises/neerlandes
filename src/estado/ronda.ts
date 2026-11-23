// Construye la ronda de una pista o la ronda de hoy, que mezcla todas: primero
// lo que toca repasar, alternando pistas, y después lo nuevo, repartido entre
// ellas.

import {
  clave,
  construirRonda,
  crearAzar,
  diaDe,
  resumirPista,
  RONDA_POR_DEFECTO,
  vistosPorPista,
  type Azar,
  type OpcionesRonda,
  type PasoRonda,
  type Pista,
  type Progreso,
} from '../motor';
import type { Ajustes, Forma } from './ajustes';

export interface PasoMixto {
  readonly pistaId: string;
  readonly paso: PasoRonda;
}

/** Las opciones de una ronda según los ajustes. En una ronda extra no entra nada nuevo y se repasa aunque no toque. */
export function opcionesDeRonda(ajustes: Ajustes, formas: ReadonlySet<Forma>, extra = false): OpcionesRonda {
  return {
    ...RONDA_POR_DEFECTO,
    tamano: ajustes.tamanoRonda,
    nuevosMaximo: extra ? 0 : ajustes.nuevosPorRonda,
    formas,
    ...(extra ? { incluirNoVencidos: true } : {}),
  };
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

/**
 * Reparte n de uno en uno, en rueda y empezando por la parte `inicio`, entre las que aún tienen: ninguna
 * recibe más de lo que tiene disponible y lo que una no puede usar pasa a las demás. 4 entre [9, 9, 9]
 * empezando por 0 da [2, 1, 1]; 4 entre [0, 9, 9] da [0, 2, 2].
 */
export function repartir(n: number, disponibles: readonly number[], inicio = 0): number[] {
  const k = disponibles.length;
  const reparto = disponibles.map(() => 0);
  let quedan = n;
  let dado = true;
  while (quedan > 0 && dado) {
    dado = false;
    for (let j = 0; j < k && quedan > 0; j++) {
      const i = (((inicio + j) % k) + k) % k;
      if ((reparto[i] ?? 0) < (disponibles[i] ?? 0)) {
        reparto[i] = (reparto[i] ?? 0) + 1;
        quedan--;
        dado = true;
      }
    }
  }
  return reparto;
}

/** La pista por la que empieza el reparto de lo nuevo: cambia cada día, para que ninguna salga siempre perdiendo. */
function inicioDelDia(ahora: Date, k: number): number {
  return k === 0 ? 0 : Math.floor(Date.parse(diaDe(ahora)) / 86_400_000) % k;
}

export function construirRondaDe(
  pistas: readonly Pista[],
  progreso: Progreso,
  ahora: Date,
  azar: Azar,
  opciones: OpcionesRonda = RONDA_POR_DEFECTO,
): PasoMixto[] {
  const vistos = vistosPorPista(pistas, progreso);
  // Lo nuevo se reparte entre las pistas que tienen algo que dar: lo que no puede usar una pasa a otra.
  const disponibles = pistas.map((p) => resumirPista(p, progreso, ahora, vistos).nuevosDisponibles);
  const inicio = inicioDelDia(ahora, pistas.length);
  const nuevos = repartir(opciones.nuevosMaximo, disponibles, inicio);
  const porPista = pistas.map((pista, i) =>
    construirRonda(pista, progreso, ahora, azar, { ...opciones, nuevosMaximo: nuevos[i] ?? 0 }, vistos).map((paso) => ({ pistaId: pista.id, paso })),
  );
  // Nuevo es lo que aún no tiene tarjeta, traiga presentación o no: lo que sale de una regla no la trae, y
  // tiene que ir detrás de la que abre su grupo, que es la que presenta la regla.
  const esNuevo = (p: PasoMixto): boolean => !progreso.has(clave(p.pistaId, p.paso.ejercicio.elementoId));
  const repasos = intercalar(porPista.map((l) => l.filter((p) => !esNuevo(p))));
  // Lo nuevo se intercala empezando por la pista del día: si los repasos dejan poco sitio, lo que se queda
  // fuera al recortar no es siempre de las mismas pistas. Dentro de cada pista se mantiene el orden.
  const desdeHoy = [...porPista.slice(inicio), ...porPista.slice(0, inicio)];
  const nuevosPasos = intercalar(desdeHoy.map((l) => l.filter(esNuevo)));
  return [...repasos, ...nuevosPasos].slice(0, opciones.tamano);
}

export interface PrevisionRonda {
  readonly repasos: number;
  readonly nuevos: number;
}

/** Lo que traerá la ronda si se empieza ahora: cuántos repasos y cuántas cosas nuevas. */
export function preverRonda(pistas: readonly Pista[], progreso: Progreso, ahora: Date, opciones: OpcionesRonda): PrevisionRonda {
  // Qué entra no depende del azar (solo el orden y el tipo de ejercicio), así que vale cualquier semilla.
  const pasos = construirRondaDe(pistas, progreso, ahora, crearAzar(1), opciones);
  const nuevos = pasos.filter((p) => !progreso.has(clave(p.pistaId, p.paso.ejercicio.elementoId))).length;
  return { repasos: pasos.length - nuevos, nuevos };
}

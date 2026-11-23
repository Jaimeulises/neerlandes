// Rondas, desbloqueos y validación de pistas. Genérico: no sabe de idiomas.
// Viene de Michi, la app de japonés del mismo autor. Lo que se falla vuelve
// dentro de la misma ronda, los grupos pueden esperar a otras pistas y cada
// ejercicio se crea con lo que el alumno ya ha visto.

import type { Azar } from './azar';
import type { Calificacion, ContextoEjercicio, Ejercicio, Elemento, Pista, Presentacion } from './contratos';
import { clave, vencida, vistosDe, type Progreso, type Tarjeta } from './repaso';

export interface OpcionesRonda {
  /** Ejercicios como máximo en una ronda. */
  readonly tamano: number;
  /** Elementos nuevos como máximo en una ronda. */
  readonly nuevosMaximo: number;
  /** Cuántas veces vuelve un elemento fallado dentro de la ronda. */
  readonly repeticionesPorFallo: number;
  readonly formas: ReadonlySet<Ejercicio['forma']>;
  readonly variante?: string;
  /** Solo estos elementos (para reforzar lo que cuesta). */
  readonly soloElementos?: ReadonlySet<string>;
  /** Incluir también los elementos vistos que aún no han vencido. */
  readonly incluirNoVencidos?: boolean;
  /** Lo que domina el alumno cada destreza (ver ContextoEjercicio). */
  readonly dominio?: (destreza: string) => number | null;
  /** Todos los grupos abiertos desde el principio, sin esperar a ver entero el anterior. */
  readonly gruposAbiertos?: boolean;
}

/** Un paso de la ronda: el ejercicio y, si el elemento es nuevo, su presentación. */
export interface PasoRonda {
  readonly ejercicio: Ejercicio;
  readonly presentacion: Presentacion | null;
  /** true si el paso es la vuelta de un fallo anterior en esta ronda. */
  readonly repeticion: boolean;
  /** Si el paso está para practicar una regla que se acaba de fallar, cuál (el id de la destreza). */
  readonly practica?: string;
}

export const TODAS_LAS_FORMAS: ReadonlySet<Ejercicio['forma']> = new Set(['opcion', 'ordenar', 'traducir', 'completar', 'dictado', 'decir']);

export const RONDA_POR_DEFECTO: OpcionesRonda = {
  tamano: 10,
  nuevosMaximo: 4,
  repeticionesPorFallo: 1,
  formas: TODAS_LAS_FORMAS,
};

export function vistosPorPista(pistas: readonly Pista[], progreso: Progreso): Map<string, ReadonlySet<string>> {
  return new Map(pistas.map((p) => [p.id, vistosDe(progreso, p.id)]));
}

/**
 * Grupos abiertos, en orden. El primero siempre lo está si la pista no dice
 * otra cosa; cada uno de los siguientes se abre cuando todos los elementos del
 * anterior ya se han visto y, si la pista lo pide, cuando sus requisitos de
 * otras pistas están cumplidos. Con `todos`, todos desde el principio.
 */
export function gruposDesbloqueados<E extends Elemento>(
  pista: Pista<E>,
  progreso: Progreso,
  vistosOtras: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
  todos = false,
): string[] {
  if (todos) return [...pista.grupos];
  const abiertos: string[] = [];
  for (const grupo of pista.grupos) {
    if (pista.grupoListo && !pista.grupoListo(grupo, vistosOtras)) break;
    abiertos.push(grupo);
    const completo = pista.elementos.filter((e) => e.grupo === grupo).every((e) => progreso.has(clave(pista.id, e.id)));
    if (!completo) break;
  }
  return abiertos;
}

/** Grupos de la pista que ya se han visto del todo. */
export function gruposCompletados<E extends Elemento>(pista: Pista<E>, progreso: Progreso): string[] {
  return pista.grupos.filter((grupo) =>
    pista.elementos.filter((e) => e.grupo === grupo).every((e) => progreso.has(clave(pista.id, e.id))),
  );
}

function contexto<E extends Elemento>(
  pista: Pista<E>,
  progreso: Progreso,
  elemento: E,
  azar: Azar,
  opciones: OpcionesRonda,
  vistos: ReadonlySet<string> = vistosDe(progreso, pista.id),
): ContextoEjercicio {
  return {
    azar,
    vistos,
    repeticiones: progreso.get(clave(pista.id, elemento.id))?.reps ?? 0,
    formas: opciones.formas,
    ...(opciones.variante !== undefined ? { variante: opciones.variante } : {}),
    ...(opciones.dominio ? { dominio: opciones.dominio } : {}),
  };
}

/**
 * Los elementos en rueda por grupos: el primero de cada grupo, luego el segundo... Así, con todos los grupos
 * abiertos, cada uno empieza por el elemento que presenta su regla. Con los grupos en orden solo uno tiene cosas
 * sin ver, y la rueda deja el orden como estaba.
 */
function enRueda<E extends Elemento>(elementos: readonly E[], grupos: readonly string[]): E[] {
  const porGrupo = grupos.map((g) => elementos.filter((e) => e.grupo === g));
  const resultado: E[] = [];
  const largo = Math.max(0, ...porGrupo.map((l) => l.length));
  for (let i = 0; i < largo; i++) {
    for (const lista of porGrupo) {
      const e = lista[i];
      if (e) resultado.push(e);
    }
  }
  return resultado;
}

/** El ejercicio de un elemento, con las destrezas del elemento si el ejercicio no dice las suyas. */
export function crearEjercicioDe<E extends Elemento>(pista: Pista<E>, elemento: E, ctx: ContextoEjercicio): Ejercicio {
  const ejercicio = pista.crearEjercicio(elemento, ctx);
  if (ejercicio.destrezas || !pista.destrezasDe) return ejercicio;
  return { ...ejercicio, destrezas: pista.destrezasDe(elemento) };
}

/**
 * Primero los repasos vencidos (el más atrasado antes) y, si queda hueco,
 * elementos nuevos de los grupos abiertos en el orden del paquete (en rueda por
 * grupos si hay varios abiertos). Los nuevos llevan su presentación si la pista
 * sabe presentarlos.
 */
export function construirRonda<E extends Elemento>(
  pista: Pista<E>,
  progreso: Progreso,
  ahora: Date,
  azar: Azar,
  opciones: OpcionesRonda = RONDA_POR_DEFECTO,
  vistosOtras: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
): PasoRonda[] {
  const candidatos = opciones.soloElementos ? pista.elementos.filter((e) => opciones.soloElementos?.has(e.id)) : pista.elementos;
  const vencidos = candidatos
    .map((elemento) => ({ elemento, tarjeta: progreso.get(clave(pista.id, elemento.id)) }))
    .filter((x): x is { elemento: E; tarjeta: Tarjeta } => x.tarjeta !== undefined && (opciones.incluirNoVencidos === true || vencida(x.tarjeta, ahora)))
    .sort((a, b) => a.tarjeta.due.getTime() - b.tarjeta.due.getTime())
    .slice(0, opciones.tamano)
    .map((x) => x.elemento);

  const huecos = Math.max(0, Math.min(opciones.tamano - vencidos.length, opciones.nuevosMaximo));
  const abiertos = new Set(gruposDesbloqueados(pista, progreso, vistosOtras, opciones.gruposAbiertos === true));
  const sinVer = candidatos.filter((e) => abiertos.has(e.grupo) && !progreso.has(clave(pista.id, e.id)));
  const nuevos = enRueda(sinVer, pista.grupos).slice(0, huecos);

  // Los ejercicios se crean como si los nuevos de la ronda ya se conocieran, para que sus distractores
  // puedan incluir a los demás nuevos, que se presentan en la misma ronda. Las repeticiones de cada
  // elemento siguen saliendo del progreso.
  const vistosConNuevos = new Set([...vistosDe(progreso, pista.id), ...nuevos.map((e) => e.id)]);
  const crear = (e: E, repeticion: boolean): PasoRonda => ({
    ejercicio: crearEjercicioDe(pista, e, contexto(pista, progreso, e, azar, opciones, vistosConNuevos)),
    presentacion: null,
    repeticion,
  });

  const pasosVencidos = azar.barajar(vencidos).map((e) => crear(e, false));
  const pasosNuevos = nuevos.map((e) => ({
    ...crear(e, false),
    presentacion: pista.presentar?.(e, opciones.variante) ?? null,
  }));
  return [...pasosVencidos, ...pasosNuevos];
}

/**
 * Qué paso añadir al final de la ronda cuando se falla: el mismo elemento, con
 * un ejercicio nuevo, mientras no se agoten las repeticiones. Devuelve null si
 * no toca repetir.
 */
export function repetirTrasFallo<E extends Elemento>(
  pista: Pista<E>,
  elemento: E,
  progreso: Progreso,
  azar: Azar,
  vecesRepetido: number,
  opciones: OpcionesRonda = RONDA_POR_DEFECTO,
): PasoRonda | null {
  if (vecesRepetido >= opciones.repeticionesPorFallo) return null;
  return {
    ejercicio: crearEjercicioDe(pista, elemento, contexto(pista, progreso, elemento, azar, opciones)),
    presentacion: null,
    repeticion: true,
  };
}

/**
 * Un ejercicio de otro elemento que entrena la misma destreza, para practicar en caliente la regla que se
 * acaba de fallar con una frase distinta. Primero lo ya visto; si no hay, algo nuevo de un grupo abierto que
 * no necesite presentación (lo que sale de una regla ya presentada). Nunca algo que ya esté en la ronda.
 * null si no hay ninguno.
 */
export function practicarDestreza<E extends Elemento>(
  pista: Pista<E>,
  destreza: string,
  excluir: ReadonlySet<string>,
  progreso: Progreso,
  azar: Azar,
  opciones: OpcionesRonda = RONDA_POR_DEFECTO,
): PasoRonda | null {
  if (!pista.destrezasDe) return null;
  const entrena = pista.elementos.filter((e) => !excluir.has(e.id) && (pista.destrezasDe?.(e) ?? []).includes(destreza));
  const vistos = entrena.filter((e) => progreso.has(clave(pista.id, e.id)));
  const abiertos = new Set(gruposDesbloqueados(pista, progreso, new Map(), opciones.gruposAbiertos === true));
  const nuevosSinPresentacion = entrena.filter(
    (e) => !progreso.has(clave(pista.id, e.id)) && abiertos.has(e.grupo) && (pista.presentar?.(e, opciones.variante) ?? null) === null,
  );
  const elemento = azar.elegir(vistos.length > 0 ? vistos : nuevosSinPresentacion);
  if (!elemento) return null;
  return {
    ejercicio: crearEjercicioDe(pista, elemento, contexto(pista, progreso, elemento, azar, opciones)),
    presentacion: null,
    repeticion: true,
    practica: destreza,
  };
}

export interface ResumenPista {
  readonly total: number;
  /** Elementos que ya se han visto al menos una vez. */
  readonly vistos: number;
  /** Elementos vistos cuyo repaso ya toca. */
  readonly paraRepasar: number;
  /** Elementos nuevos que pueden entrar ya (grupos abiertos). */
  readonly nuevosDisponibles: number;
}

export function resumirPista<E extends Elemento>(
  pista: Pista<E>,
  progreso: Progreso,
  ahora: Date,
  vistosOtras: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
  gruposAbiertos = false,
): ResumenPista {
  let vistos = 0;
  let paraRepasar = 0;
  for (const e of pista.elementos) {
    const tarjeta = progreso.get(clave(pista.id, e.id));
    if (!tarjeta) continue;
    vistos++;
    if (vencida(tarjeta, ahora)) paraRepasar++;
  }
  const abiertos = new Set(gruposDesbloqueados(pista, progreso, vistosOtras, gruposAbiertos));
  const nuevosDisponibles = pista.elementos.filter((e) => abiertos.has(e.grupo) && !progreso.has(clave(pista.id, e.id))).length;
  return { total: pista.elementos.length, vistos, paraRepasar, nuevosDisponibles };
}

export function calificarOpcion(ejercicio: { respuestaCorrecta: string }, respuesta: string): Calificacion {
  return respuesta === ejercicio.respuestaCorrecta ? 'bien' : 'otra_vez';
}

/** Errores de forma de una pista. Vacío si está bien. */
export function validarPista<E extends Elemento>(pista: Pista<E>): string[] {
  const errores: string[] = [];
  const grupos = new Set(pista.grupos);
  if (grupos.size !== pista.grupos.length) errores.push('hay grupos repetidos');

  const ids = new Set<string>();
  for (const e of pista.elementos) {
    if (ids.has(e.id)) errores.push(`elemento repetido: ${e.id}`);
    ids.add(e.id);
    if (!grupos.has(e.grupo)) errores.push(`grupo desconocido en ${e.id}: ${e.grupo}`);
  }
  for (const g of pista.grupos) {
    if (!pista.elementos.some((e) => e.grupo === g)) errores.push(`grupo vacío: ${g}`);
  }
  return errores;
}

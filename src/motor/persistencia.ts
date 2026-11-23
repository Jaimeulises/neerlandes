// Guardado del progreso y del historial. El motor solo sabe convertirlos a
// texto y de vuelta; dónde se guardan lo pone cada plataforma con un Almacen.
// Nada sale del dispositivo. Viene de Michi, la app de japonés del mismo autor.

import { TypeConvert, type Card } from 'ts-fsrs';
import { HISTORIAL_VACIO, type Historial, type Respuesta } from './historial';
import { conDiasAcertados, PROGRESO_VACIO, type Progreso, type Tarjeta } from './repaso';

/** Dónde guarda el motor sus datos. Cada plataforma pone el suyo. */
export interface Almacen {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
  borrar(clave: string): Promise<void>;
}

/** Almacén en memoria, para pruebas y para la web sin almacenamiento. */
export function almacenEnMemoria(): Almacen {
  const datos = new Map<string, string>();
  return {
    leer: (clave) => Promise.resolve(datos.get(clave) ?? null),
    guardar: (clave, valor) => {
      datos.set(clave, valor);
      return Promise.resolve();
    },
    borrar: (clave) => {
      datos.delete(clave);
      return Promise.resolve();
    },
  };
}

export const VERSION_COPIA = 1;

const CAMPOS_NUMERICOS = ['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses'] as const;
const CALIFICACIONES = new Set(['otra_vez', 'dificil', 'bien', 'facil']);

export class CopiaIlegible extends Error {
  override name = 'CopiaIlegible';
}

export const CLAVE_PROGRESO = 'progreso';
export const CLAVE_HISTORIAL = 'historial';
/** Donde se guarda, tal cual, lo que no se pudo leer antes de escribir encima. */
export const CLAVE_APARTADO = 'apartado';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function leerTarjeta(clave: string, valor: unknown): Tarjeta {
  if (!esObjeto(valor)) throw new CopiaIlegible(`tarjeta ${clave}: no es un objeto`);
  for (const campo of CAMPOS_NUMERICOS) {
    if (typeof valor[campo] !== 'number' || !Number.isFinite(valor[campo])) {
      throw new CopiaIlegible(`tarjeta ${clave}: ${campo} no es un número`);
    }
  }
  // Los días acertados son nuestros, no de FSRS, y las tarjetas antiguas no los traen.
  if (valor.dias !== undefined && (typeof valor.dias !== 'number' || !Number.isInteger(valor.dias) || valor.dias < 0)) {
    throw new CopiaIlegible(`tarjeta ${clave}: dias no es un número`);
  }
  try {
    return TypeConvert.card(valor as unknown as Card);
  } catch {
    throw new CopiaIlegible(`tarjeta ${clave}: fecha o estado no válidos`);
  }
}

function leerRespuesta(indice: number, valor: unknown): Respuesta {
  if (!esObjeto(valor)) throw new CopiaIlegible(`respuesta ${indice}: no es un objeto`);
  const { t, k, c, f } = valor;
  if (typeof t !== 'number' || !Number.isFinite(t)) throw new CopiaIlegible(`respuesta ${indice}: fecha no válida`);
  if (typeof k !== 'string' || !k.includes('/')) throw new CopiaIlegible(`respuesta ${indice}: clave no válida`);
  if (typeof c !== 'string' || !CALIFICACIONES.has(c)) throw new CopiaIlegible(`respuesta ${indice}: calificación no válida`);
  if (typeof f !== 'string') throw new CopiaIlegible(`respuesta ${indice}: forma no válida`);
  return { t, k, c: c as Respuesta['c'], f };
}

export function serializarProgreso(progreso: Progreso): string {
  return JSON.stringify({ version: VERSION_COPIA, tarjetas: Object.fromEntries(progreso) });
}

/** Lanza CopiaIlegible si el texto no es un progreso guardado por esta versión. */
export function deserializarProgreso(texto: string): Progreso {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new CopiaIlegible('no es JSON');
  }
  if (!esObjeto(datos) || datos.version !== VERSION_COPIA || !esObjeto(datos.tarjetas)) {
    throw new CopiaIlegible('formato o versión desconocidos');
  }
  const progreso = new Map<string, Tarjeta>();
  for (const [clave, valor] of Object.entries(datos.tarjetas)) {
    progreso.set(clave, leerTarjeta(clave, valor));
  }
  return progreso;
}

export function serializarHistorial(historial: Historial): string {
  return JSON.stringify({ version: VERSION_COPIA, respuestas: historial });
}

export function deserializarHistorial(texto: string): Historial {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new CopiaIlegible('no es JSON');
  }
  if (!esObjeto(datos) || datos.version !== VERSION_COPIA || !Array.isArray(datos.respuestas)) {
    throw new CopiaIlegible('formato o versión desconocidos');
  }
  return datos.respuestas.map((v, i) => leerRespuesta(i, v));
}

export interface Datos {
  readonly progreso: Progreso;
  readonly historial: Historial;
}

/** Sin datos guardados devuelve lo vacío. Si algo está dañado, lanza CopiaIlegible. */
export async function cargarDatos(almacen: Almacen): Promise<Datos> {
  const [p, h] = await Promise.all([almacen.leer(CLAVE_PROGRESO), almacen.leer(CLAVE_HISTORIAL)]);
  const historial = h === null ? HISTORIAL_VACIO : deserializarHistorial(h);
  // Lo guardado antes de apuntar los días acertados se completa con el historial.
  return { progreso: conDiasAcertados(p === null ? PROGRESO_VACIO : deserializarProgreso(p), historial), historial };
}

export async function guardarDatos(almacen: Almacen, datos: Datos): Promise<void> {
  await Promise.all([
    almacen.guardar(CLAVE_PROGRESO, serializarProgreso(datos.progreso)),
    almacen.guardar(CLAVE_HISTORIAL, serializarHistorial(datos.historial)),
  ]);
}

/** Lo guardado tal cual, sin interpretarlo: lo que se aparta o se exporta cuando no se puede leer. */
export interface DatosEnBruto {
  readonly progreso: string | null;
  readonly historial: string | null;
}

export async function leerEnBruto(almacen: Almacen): Promise<DatosEnBruto> {
  const [progreso, historial] = await Promise.all([almacen.leer(CLAVE_PROGRESO), almacen.leer(CLAVE_HISTORIAL)]);
  return { progreso, historial };
}

/**
 * Antes de sustituir algo que no se pudo leer, lo guarda aparte tal cual (clave «apartado», una entrada
 * por vez, sin pisar las anteriores), para que empezar de cero o restaurar una copia no destruya lo que
 * había. Devuelve si había algo que apartar. Si no se puede leer o no se puede guardar aparte, lanza:
 * quien llama no debe escribir encima.
 */
export async function apartarDatos(almacen: Almacen, ahora: Date): Promise<boolean> {
  const { progreso, historial } = await leerEnBruto(almacen);
  if (progreso === null && historial === null) return false;
  const previo = await almacen.leer(CLAVE_APARTADO);
  let anteriores: unknown[] = [];
  if (previo !== null) {
    try {
      const leido: unknown = JSON.parse(previo);
      anteriores = Array.isArray(leido) ? (leido as unknown[]) : [leido];
    } catch {
      // Ni lo apartado antes se entiende: se conserva como texto.
      anteriores = [previo];
    }
  }
  await almacen.guardar(CLAVE_APARTADO, JSON.stringify([...anteriores, { apartadoEl: ahora.toISOString(), progreso, historial }]));
  return true;
}

/** Copia de seguridad completa en un solo texto, para exportar y compartir. */
export function serializarCopia(datos: Datos, app: string, creadaEl: Date): string {
  return JSON.stringify({
    app,
    version: VERSION_COPIA,
    creadaEl: creadaEl.toISOString(),
    progreso: JSON.parse(serializarProgreso(datos.progreso)) as unknown,
    historial: JSON.parse(serializarHistorial(datos.historial)) as unknown,
  });
}

/** Lee una copia completa. Comprueba que sea de esta app antes de tocar nada. */
export function deserializarCopia(texto: string, app: string): Datos {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new CopiaIlegible('no es JSON');
  }
  if (!esObjeto(datos)) throw new CopiaIlegible('no es una copia');
  if (datos.app !== app) throw new CopiaIlegible('es una copia de otra app');
  if (datos.version !== VERSION_COPIA) throw new CopiaIlegible('versión de copia desconocida');
  const historial = deserializarHistorial(JSON.stringify(datos.historial));
  return { progreso: conDiasAcertados(deserializarProgreso(JSON.stringify(datos.progreso)), historial), historial };
}

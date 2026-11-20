// El estado de estudio en React: carga el progreso y el historial del almacén,
// los guarda tras cada respuesta y expone lo que las pantallas necesitan.
// Dos cosas que no hace nunca: escribir encima de algo que no pudo leer sin
// apartarlo antes, y callarse que un guardado ha fallado.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  anotar,
  apartarDatos,
  cargarDatos,
  CopiaIlegible,
  guardarDatos,
  HISTORIAL_VACIO,
  leerEnBruto,
  PROGRESO_VACIO,
  registrarRespuesta,
  type Almacen,
  type Calificacion,
  type Datos,
  type DatosEnBruto,
  type Ejercicio,
} from '../motor';

/** 'danado': hay algo guardado pero no se entiende. 'inaccesible': el dispositivo no deja leer el almacén. */
export type EstadoCarga = 'cargando' | 'listo' | 'danado' | 'inaccesible';

/**
 * 'guardado': lo último está en el dispositivo. 'fallo': el último guardado falló; sigue en memoria y se
 * reintenta. 'sin-guardar': esta sesión no escribe en el dispositivo, porque no se pudo abrir lo guardado
 * y escribir encima podría destruirlo.
 */
export type EstadoGuardado = 'guardado' | 'fallo' | 'sin-guardar';

export interface DatosEnUso {
  readonly estado: EstadoCarga;
  readonly datos: Datos;
  /** Si lo guardado no se pudo leer, qué decía el error. */
  readonly error: string | null;
  readonly guardado: EstadoGuardado;
  readonly responder: (
    pistaId: string,
    elementoId: string,
    calificacion: Calificacion,
    forma: Ejercicio['forma'],
    destrezas?: readonly string[],
    falladas?: readonly string[],
    ahora?: Date,
  ) => void;
  /**
   * Sustituye todo por una copia (restaurar) o por nada (borrar). Si lo que había no se pudo leer, antes lo
   * guarda aparte tal cual. No lanza: si no se puede guardar, lo dice `guardado`.
   */
  readonly reemplazar: (datos: Datos) => Promise<void>;
  /** Vuelve a intentar leer lo guardado, desde la pantalla de error. */
  readonly reintentar: () => void;
  /** Vuelve a intentar guardar lo que hay en memoria. Devuelve si se guardó. */
  readonly guardarAhora: () => Promise<boolean>;
  /** Lo guardado tal cual, sin interpretar, para llevárselo cuando no se puede leer. null si no hay nada o no se deja leer. */
  readonly enBruto: () => Promise<DatosEnBruto | null>;
}

const VACIO: Datos = { progreso: PROGRESO_VACIO, historial: HISTORIAL_VACIO };

/** El nombre y el mensaje del error, venga de donde venga (los del navegador no siempre son un Error de aquí). */
function detalleDe(e: unknown): string {
  if (typeof e === 'object' && e !== null) {
    const { name, message } = e as { name?: unknown; message?: unknown };
    const nombre = typeof name === 'string' ? name : '';
    const mensaje = typeof message === 'string' ? message : '';
    const detalle = nombre && mensaje ? `${nombre}: ${mensaje}` : nombre || mensaje;
    if (detalle) return detalle.slice(0, 140);
  }
  return 'sin detalle';
}

export function useDatos(almacen: Almacen): DatosEnUso {
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<EstadoGuardado>('guardado');
  const [intento, setIntento] = useState(0);
  const ultimo = useRef<Datos>(VACIO);
  /** Cómo acabó la última carga: de eso depende qué hay que respetar al escribir. */
  const carga = useRef<EstadoCarga>('cargando');
  /** Lo guardado no se pudo leer y aún no se ha apartado: hay que apartarlo antes de escribir encima. */
  const porApartar = useRef(false);
  const apartando = useRef<Promise<void> | null>(null);
  /** No se pudo ni abrir el almacén: esta sesión no escribe en él. */
  const sinGuardar = useRef(false);
  /** Cada guardado tiene su turno: solo el último decide si hay aviso. */
  const turno = useRef(0);

  useEffect(() => {
    let vivo = true;
    cargarDatos(almacen).then(
      (cargados) => {
        if (!vivo) return;
        ultimo.current = cargados;
        carga.current = 'listo';
        setDatos(cargados);
        setError(null);
        setEstado('listo');
      },
      (e: unknown) => {
        if (!vivo) return;
        const ilegible = e instanceof CopiaIlegible;
        carga.current = ilegible ? 'danado' : 'inaccesible';
        setError(ilegible ? e.message : detalleDe(e));
        setEstado(carga.current);
      },
    );
    return () => {
      vivo = false;
    };
  }, [almacen, intento]);

  const reintentar = useCallback(() => {
    carga.current = 'cargando';
    setEstado('cargando');
    setIntento((n) => n + 1);
  }, []);

  const guardar = useCallback(
    async (nuevos: Datos): Promise<boolean> => {
      if (sinGuardar.current) return false;
      const mio = ++turno.current;
      try {
        if (porApartar.current) {
          // Varias respuestas seguidas no deben apartar lo mismo varias veces: todas esperan a la misma.
          apartando.current ??= apartarDatos(almacen, new Date())
            .then(() => {
              porApartar.current = false;
            })
            .finally(() => {
              apartando.current = null;
            });
          await apartando.current;
        }
        await guardarDatos(almacen, nuevos);
        if (mio === turno.current) setGuardado('guardado');
        return true;
      } catch {
        // Cuota agotada, almacén cerrado, lo que sea: el progreso sigue en memoria y se dice.
        if (mio === turno.current) setGuardado('fallo');
        return false;
      }
    },
    [almacen],
  );

  const responder = useCallback(
    (
      pistaId: string,
      elementoId: string,
      calificacion: Calificacion,
      forma: Ejercicio['forma'],
      destrezas: readonly string[] = [],
      falladas: readonly string[] = [],
      ahora: Date = new Date(),
    ) => {
      const actual = ultimo.current;
      const progreso = registrarRespuesta(actual.progreso, pistaId, elementoId, calificacion, ahora);
      const historial = anotar(actual.historial, {
        t: ahora.getTime(),
        k: `${pistaId}/${elementoId}`,
        c: calificacion,
        f: forma,
        ...(destrezas.length > 0 ? { d: destrezas } : {}),
        ...(falladas.length > 0 ? { x: falladas } : {}),
      });
      const nuevos: Datos = { progreso, historial };
      ultimo.current = nuevos;
      setDatos(nuevos);
      // Si un guardado falla, el siguiente lo lleva todo: cada uno escribe el progreso entero.
      void guardar(nuevos);
    },
    [guardar],
  );

  const reemplazar = useCallback(
    async (nuevos: Datos): Promise<void> => {
      // Lo que no se pudo leer no se pisa sin más. Si está dañado, se aparta tal cual antes del primer
      // guardado (lo hace `guardar`). Si ni se pudo abrir el almacén, puede que dentro esté todo bien:
      // esta sesión no escribe en él.
      if (carga.current === 'danado') porApartar.current = true;
      if (carga.current === 'inaccesible') sinGuardar.current = true;
      carga.current = 'listo';
      ultimo.current = nuevos;
      setDatos(nuevos);
      setError(null);
      setEstado('listo');
      if (sinGuardar.current) {
        setGuardado('sin-guardar');
        return;
      }
      await guardar(nuevos);
    },
    [guardar],
  );

  const guardarAhora = useCallback((): Promise<boolean> => guardar(ultimo.current), [guardar]);

  const enBruto = useCallback(async (): Promise<DatosEnBruto | null> => {
    try {
      const bruto = await leerEnBruto(almacen);
      return bruto.progreso === null && bruto.historial === null ? null : bruto;
    } catch {
      return null;
    }
  }, [almacen]);

  // Con un guardado fallido, se reintenta también al salir de la app o volver a ella: en el móvil, salir
  // suele ser la última ocasión antes de que el sistema la cierre.
  useEffect(() => {
    if (guardado !== 'fallo') return;
    const alCambiar = (): void => {
      void guardar(ultimo.current);
    };
    document.addEventListener('visibilitychange', alCambiar);
    return () => {
      document.removeEventListener('visibilitychange', alCambiar);
    };
  }, [guardado, guardar]);

  return useMemo(
    () => ({ estado, datos, error, guardado, responder, reemplazar, reintentar, guardarAhora, enBruto }),
    [estado, datos, error, guardado, responder, reemplazar, reintentar, guardarAhora, enBruto],
  );
}

// El nivel de cada destreza, sacado del historial. Genérico: no sabe de
// idiomas. Cada respuesta cuenta según lo difícil que es su forma (escribir la
// frase entera pesa más que ordenar fichas) y según lo reciente que es: lo que
// se hizo ayer dice más que lo de hace un mes. Un fallo con diagnóstico solo
// le cuenta a la destreza que se ha fallado, no a todas las del ejercicio.

import type { Destreza } from './contratos';
import type { Historial } from './historial';

/** Lo que pesa una respuesta según la forma del ejercicio: producir pesa más que reconocer. */
export const PESO_DE_FORMA: Readonly<Record<string, number>> = {
  opcion: 0.4,
  ordenar: 0.4,
  dictado: 0.6,
  completar: 0.7,
  // Decir se lo evalúa uno mismo, sin nada que lo compruebe: pesa poco hasta que haya grabación con la que compararse.
  decir: 0.5,
  traducir: 1,
};

/** Cuánto pierde cada respuesta frente a la siguiente más reciente de la misma destreza. */
const OLVIDO = 0.92;
/** Respuestas por destreza que se tienen en cuenta. */
const MAXIMO_RESPUESTAS = 40;
/** Fallos imaginarios con que empieza cada destreza: sin ellos, dos aciertos darían el 100 %. */
const PRUDENCIA = 1.5;
/** Respuestas que hacen falta para decir algo del nivel de una destreza. */
export const MINIMO_PARA_NIVEL = 3;
/** A partir de aquí una destreza se da por dominada. */
export const UMBRAL_DOMINADA = 0.75;
/** Por debajo de aquí una destreza está floja: vuelve más ayuda (por ejemplo, las fichas). */
export const UMBRAL_FLOJA = 0.45;

export interface EstadoDestreza {
  /** De 0 a 1. */
  readonly dominio: number;
  readonly respuestas: number;
  readonly aciertos: number;
  /** Marca de tiempo de la última respuesta. */
  readonly ultima: number;
}

interface Observacion {
  readonly bien: boolean;
  readonly peso: number;
  readonly t: number;
}

/** Qué dice cada respuesta del historial de cada destreza. Las respuestas sin destrezas no cuentan. */
function observaciones(historial: Historial): Map<string, Observacion[]> {
  const porDestreza = new Map<string, Observacion[]>();
  const apuntar = (destreza: string, o: Observacion): void => {
    const lista = porDestreza.get(destreza);
    if (lista) lista.push(o);
    else porDestreza.set(destreza, [o]);
  };
  for (const r of historial) {
    const peso = PESO_DE_FORMA[r.f] ?? 0.5;
    const bien = r.c !== 'otra_vez';
    if (bien) {
      for (const d of r.d ?? []) apuntar(d, { bien, peso, t: r.t });
    } else {
      const falladas = r.x && r.x.length > 0 ? r.x : (r.d ?? []);
      for (const d of falladas) apuntar(d, { bien, peso, t: r.t });
    }
  }
  return porDestreza;
}

export function nivelPorDestreza(historial: Historial): Map<string, EstadoDestreza> {
  const resultado = new Map<string, EstadoDestreza>();
  for (const [destreza, lista] of observaciones(historial)) {
    const recientes = lista.slice(-MAXIMO_RESPUESTAS).reverse();
    let acertado = 0;
    let total = 0;
    let factor = 1;
    for (const o of recientes) {
      total += o.peso * factor;
      if (o.bien) acertado += o.peso * factor;
      factor *= OLVIDO;
    }
    resultado.set(destreza, {
      dominio: acertado / (total + PRUDENCIA),
      respuestas: lista.length,
      aciertos: lista.filter((o) => o.bien).length,
      ultima: lista.at(-1)?.t ?? 0,
    });
  }
  return resultado;
}

/** El dominio de una destreza, o null si aún no hay respuestas suficientes para decirlo. */
export function dominioDe(niveles: ReadonlyMap<string, EstadoDestreza>): (destreza: string) => number | null {
  return (destreza) => {
    const e = niveles.get(destreza);
    return e && e.respuestas >= MINIMO_PARA_NIVEL ? e.dominio : null;
  };
}

export interface NivelEstimado {
  /** El nivel más alto con todas sus destrezas dominadas, o null si ninguno. */
  readonly alcanzado: string | null;
  /** El siguiente nivel, si queda alguno. */
  readonly siguiente: string | null;
  /** Destrezas del siguiente nivel ya dominadas y cuántas tiene. */
  readonly dominadasDelSiguiente: number;
  readonly totalDelSiguiente: number;
}

/**
 * El nivel según las destrezas dominadas: se alcanza un nivel cuando todas sus destrezas, y las de los
 * anteriores, están dominadas. Los niveles van en el orden en que aparecen en la lista de destrezas.
 */
export function estimarNivel(destrezas: readonly Destreza[], niveles: ReadonlyMap<string, EstadoDestreza>): NivelEstimado {
  const orden = [...new Set(destrezas.map((d) => d.nivel))];
  const dominada = (d: Destreza): boolean => {
    const e = niveles.get(d.id);
    return e !== undefined && e.respuestas >= MINIMO_PARA_NIVEL && e.dominio >= UMBRAL_DOMINADA;
  };
  let alcanzado: string | null = null;
  for (const nivel of orden) {
    const suyas = destrezas.filter((d) => d.nivel === nivel);
    if (!suyas.every(dominada)) {
      return { alcanzado, siguiente: nivel, dominadasDelSiguiente: suyas.filter(dominada).length, totalDelSiguiente: suyas.length };
    }
    alcanzado = nivel;
  }
  return { alcanzado, siguiente: null, dominadasDelSiguiente: 0, totalDelSiguiente: 0 };
}

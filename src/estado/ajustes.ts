// Los ajustes del alumno: tamaño de la ronda, cuántas cosas nuevas entran,
// la voz, qué ejercicios salen y cuánto tiempo hay para decir la frase. Viven en localStorage, aparte del progreso:
// si se pierden, no se pierde nada importante.

import { TODAS_LAS_FORMAS, type Ejercicio } from '../motor';

export type Forma = Ejercicio['forma'];

/** Cuánto tiempo da la cuenta atrás de decir la frase: el de una conversación, la mitad más o ninguno. */
export const TIEMPOS_DECIR = ['normal', 'calma', 'sin'] as const;
export type TiempoDecir = (typeof TIEMPOS_DECIR)[number];

export const NOMBRES_TIEMPO_DECIR: Readonly<Record<TiempoDecir, string>> = {
  normal: 'Normal',
  calma: 'Con calma',
  sin: 'Sin cuenta atrás',
};

export interface Ajustes {
  readonly tamanoRonda: number;
  readonly nuevosPorRonda: number;
  readonly voz: boolean;
  readonly vozLenta: boolean;
  readonly formas: readonly Forma[];
  /**
   * Para quien ya conoce lo básico: lo nuevo entra de todos los grupos sin esperar a ver entero el anterior
   * (como mucho un grupo nuevo por ronda) y empieza escribiendo, salvo que su regla esté floja.
   */
  readonly gruposAbiertos: boolean;
  readonly tiempoDecir: TiempoDecir;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  tamanoRonda: 12,
  nuevosPorRonda: 4,
  voz: true,
  vozLenta: false,
  formas: [...TODAS_LAS_FORMAS],
  gruposAbiertos: false,
  tiempoDecir: 'normal',
};

export const TAMANOS_RONDA = [8, 12, 20] as const;
export const NUEVOS_POR_RONDA = [2, 4, 6] as const;

const CLAVE = 'stap/ajustes';

function esTiempoDecir(valor: unknown): valor is TiempoDecir {
  return TIEMPOS_DECIR.some((t) => t === valor);
}

function esForma(valor: unknown): valor is Forma {
  return typeof valor === 'string' && TODAS_LAS_FORMAS.has(valor as Forma);
}

/** Lee los ajustes guardados. Lo que falte o no se entienda vuelve a su valor por defecto. */
export function leerAjustes(): Ajustes {
  let guardado: unknown;
  try {
    const texto = localStorage.getItem(CLAVE);
    guardado = texto ? (JSON.parse(texto) as unknown) : null;
  } catch {
    guardado = null;
  }
  if (typeof guardado !== 'object' || guardado === null) return AJUSTES_POR_DEFECTO;
  const g = guardado as Record<string, unknown>;
  const formas = Array.isArray(g.formas) ? g.formas.filter(esForma) : AJUSTES_POR_DEFECTO.formas;
  return {
    tamanoRonda: typeof g.tamanoRonda === 'number' && g.tamanoRonda > 0 ? g.tamanoRonda : AJUSTES_POR_DEFECTO.tamanoRonda,
    nuevosPorRonda: typeof g.nuevosPorRonda === 'number' && g.nuevosPorRonda >= 0 ? g.nuevosPorRonda : AJUSTES_POR_DEFECTO.nuevosPorRonda,
    voz: typeof g.voz === 'boolean' ? g.voz : AJUSTES_POR_DEFECTO.voz,
    vozLenta: typeof g.vozLenta === 'boolean' ? g.vozLenta : AJUSTES_POR_DEFECTO.vozLenta,
    formas: formas.length > 0 ? formas : AJUSTES_POR_DEFECTO.formas,
    gruposAbiertos: typeof g.gruposAbiertos === 'boolean' ? g.gruposAbiertos : AJUSTES_POR_DEFECTO.gruposAbiertos,
    tiempoDecir: esTiempoDecir(g.tiempoDecir) ? g.tiempoDecir : AJUSTES_POR_DEFECTO.tiempoDecir,
  };
}

export function guardarAjustes(ajustes: Ajustes): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ajustes));
  } catch {
    // Sin almacenamiento, los ajustes duran lo que dure la sesión.
  }
}

/** Las formas que salen de verdad: sin voz no hay dictado. Nunca vacío: ordenar siempre se puede. */
export function formasActivas(ajustes: Ajustes, hayVoz: boolean): ReadonlySet<Forma> {
  const formas = new Set(ajustes.formas.filter((f) => f !== 'dictado' || (hayVoz && ajustes.voz)));
  if (formas.size === 0) formas.add('ordenar');
  return formas;
}

export const NOMBRES_FORMA: Readonly<Record<Forma, string>> = {
  traducir: 'Traducir escribiendo la frase entera',
  completar: 'Completar el hueco',
  ordenar: 'Ordenar las fichas',
  decir: 'Decirla en voz alta',
  dictado: 'Dictado',
  opcion: 'Elegir entre opciones',
};

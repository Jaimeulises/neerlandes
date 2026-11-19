// Repaso espaciado FSRS por pista y elemento, con ts-fsrs (licencia MIT, sin
// red ni datos). El progreso es inmutable: cada respuesta devuelve uno nuevo.
// Viene de Michi, la app de japonés del mismo autor.

import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';
import type { Calificacion } from './contratos';
import { diaDe } from './dia';
import type { Historial } from './historial';

/** La tarjeta de FSRS, más lo que FSRS no apunta y hace falta para decir que algo está asentado. */
export interface Tarjeta extends Card {
  /**
   * Días de estudio distintos en que el primer intento del día fue un acierto. Es lo que separa «hoy me ha
   * salido» de «me acuerdo otro día». Las tarjetas guardadas antes de que se apuntara no lo traen: al
   * cargarlas se cuenta en el historial (`conDiasAcertados`).
   */
  readonly dias?: number;
}

/**
 * Días distintos con acierto a la primera que hacen falta para dar algo por asentado. Progreso se lo
 * explica al alumno con todas las letras («al menos dos días distintos»): si cambia aquí, cambia allí.
 */
export const DIAS_PARA_ASENTAR = 2;

/** Tarjetas FSRS por clave «pista/elemento». Un elemento sin tarjeta es nuevo. */
export type Progreso = ReadonlyMap<string, Tarjeta>;

export const PROGRESO_VACIO: Progreso = new Map();

const planificador = fsrs(generatorParameters({ enable_fuzz: false }));

const NOTA: Record<Calificacion, Grade> = {
  otra_vez: Rating.Again,
  dificil: Rating.Hard,
  bien: Rating.Good,
  facil: Rating.Easy,
};

export function clave(pistaId: string, elementoId: string): string {
  return `${pistaId}/${elementoId}`;
}

export function separarClave(k: string): { pistaId: string; elementoId: string } {
  const corte = k.indexOf('/');
  return { pistaId: k.slice(0, corte), elementoId: k.slice(corte + 1) };
}

export function registrarRespuesta(
  progreso: Progreso,
  pistaId: string,
  elementoId: string,
  calificacion: Calificacion,
  ahora: Date,
): Progreso {
  const k = clave(pistaId, elementoId);
  const tarjeta: Tarjeta = progreso.get(k) ?? createEmptyCard(ahora);
  // Si el reloj del móvil ha ido hacia atrás (cambio de hora, viaje, ajuste manual), el repaso no puede
  // ser anterior al último: se cuenta como hecho en ese mismo momento en vez de fallar.
  const ultimo = tarjeta.last_review ? new Date(tarjeta.last_review).getTime() : 0;
  const cuando = ahora.getTime() < ultimo ? new Date(ultimo) : ahora;
  const { card } = planificador.next(tarjeta, cuando, NOTA[calificacion]);
  // Solo cuenta el primer intento de cada día de estudio: acertar a la segunda, con la respuesta recién
  // vista, es memoria de hace un momento y no dice nada de si se recordará otro día.
  const primeroDelDia = !tarjeta.last_review || diaDe(cuando) > diaDe(new Date(ultimo));
  const dias = (tarjeta.dias ?? 0) + (primeroDelDia && calificacion !== 'otra_vez' ? 1 : 0);
  const siguiente = new Map(progreso);
  siguiente.set(k, { ...card, dias });
  return siguiente;
}

export function vencida(tarjeta: Tarjeta, ahora: Date): boolean {
  return tarjeta.due.getTime() <= ahora.getTime();
}

/**
 * Una tarjeta está asentada cuando se ha acertado a la primera en al menos dos días de estudio distintos
 * y FSRS ya la tiene en repaso espaciado (ni nueva, ni aprendiéndose, ni reaprendiéndose tras un fallo).
 * El estado de FSRS solo no basta: dos aciertos seguidos el mismo día ya lo dan.
 */
export function asentada(tarjeta: Tarjeta): boolean {
  return tarjeta.state === State.Review && (tarjeta.dias ?? 0) >= DIAS_PARA_ASENTAR;
}

/** Por cada clave del historial, en cuántos días de estudio el primer intento fue un acierto. */
export function diasAcertadosSegun(historial: Historial): Map<string, number> {
  const ultimoDia = new Map<string, string>();
  const dias = new Map<string, number>();
  for (const r of historial) {
    const dia = diaDe(new Date(r.t));
    const anterior = ultimoDia.get(r.k);
    // Una respuesta fechada antes que la anterior (reloj atrasado) no abre un día nuevo.
    if (anterior !== undefined && dia <= anterior) continue;
    ultimoDia.set(r.k, dia);
    dias.set(r.k, (dias.get(r.k) ?? 0) + (r.c !== 'otra_vez' ? 1 : 0));
  }
  return dias;
}

/**
 * Pone los días acertados a las tarjetas que no los traen (las guardadas antes de que se apuntaran),
 * contándolos en el historial. Si de una tarjeta ya no queda historial, no hay forma de saber en cuántos
 * días se acertó: se le reconoce uno si se ha repasado alguna vez, y el siguiente acierto a la primera,
 * otro día, la asienta.
 */
export function conDiasAcertados(progreso: Progreso, historial: Historial): Progreso {
  let falta = false;
  for (const tarjeta of progreso.values()) {
    if (tarjeta.dias === undefined) {
      falta = true;
      break;
    }
  }
  if (!falta) return progreso;
  const contados = diasAcertadosSegun(historial);
  const completo = new Map<string, Tarjeta>();
  for (const [k, tarjeta] of progreso) {
    if (tarjeta.dias !== undefined) {
      completo.set(k, tarjeta);
      continue;
    }
    completo.set(k, { ...tarjeta, dias: contados.get(k) ?? Math.min(tarjeta.reps, 1) });
  }
  return completo;
}

/** Elementos vistos de una pista: los que tienen tarjeta. */
export function vistosDe(progreso: Progreso, pistaId: string): Set<string> {
  const prefijo = `${pistaId}/`;
  const vistos = new Set<string>();
  for (const k of progreso.keys()) {
    if (k.startsWith(prefijo)) vistos.add(k.slice(prefijo.length));
  }
  return vistos;
}

// Las formas del presente de un verbo de los datos: las seis personas y la de
// jij detrás del verbo. Las usan la pista de los verbos y el diagnóstico, que
// necesita saber qué forma va con cada sujeto para explicar un fallo.

import type { DatosVerbo, Formas } from './datos';

/** Las seis formas del presente, con sus alternativas. */
export function formasPresente(v: DatosVerbo): Formas {
  if (v.presente) return v.presente;
  const raiz = v.raiz ?? v.inf;
  const conT = raiz.endsWith('t') ? raiz : `${raiz}t`;
  return [raiz, conT, conT, v.inf, v.inf, v.inf];
}

/** La forma con jij detrás del verbo (sin la -t). */
export function formaConJij(v: DatosVerbo): string {
  return v.conJij ?? formasPresente(v)[0];
}

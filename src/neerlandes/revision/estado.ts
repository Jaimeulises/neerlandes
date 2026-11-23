// Qué está revisado y qué falta. De cada elemento revisado se guarda en
// revisado.json la huella de lo que se leyó y el día: si después cambia lo que
// se lee, la huella deja de coincidir y vuelve solo a pendiente. Lo apunta
// `npm run revisado -- O1-O12 V3` (scripts/revisado.ts).

import { huellaDe, type ElementoRevision, type Tipo } from './elementos';

export interface Revisado {
  readonly huella: string;
  /** El día en que se marcó, AAAA-MM-DD. */
  readonly el: string;
}

export type Registro = Readonly<Record<string, Revisado>>;

export function estaRevisado(e: ElementoRevision, registro: Registro): boolean {
  return registro[e.codigo]?.huella === huellaDe(e);
}

const ORDEN_TIPOS: readonly Tipo[] = ['O', 'R', 'V', 'S', 'P', 'E', 'T'];

function numero(codigo: string): number {
  return Number(codigo.slice(1));
}

/** Los códigos por tipo y número, para que revisado.json cambie poco de una vez a otra. */
export function ordenarCodigos(codigos: Iterable<string>): string[] {
  return [...codigos].sort((a, b) => {
    const tipo = ORDEN_TIPOS.indexOf(a[0] as Tipo) - ORDEN_TIPOS.indexOf(b[0] as Tipo);
    return tipo !== 0 ? tipo : numero(a) - numero(b);
  });
}

/**
 * Los códigos que se piden: sueltos (V3) o en rangos del mismo tipo (O1-O12), separados por espacios o comas. Un
 * código que no está entre los `validos`, o un rango entre tipos distintos, es un error: mejor que marcar algo que no
 * se ha leído.
 */
export function leerCodigos(pedidos: readonly string[], validos: Iterable<string>): string[] {
  const existentes = new Set(validos);
  const leidos = new Set<string>();
  for (const pedido of pedidos.flatMap((p) => p.split(/[\s,]+/)).filter(Boolean)) {
    const codigo = pedido.toUpperCase();
    const rango = /^([A-Z])(\d+)-([A-Z])?(\d+)$/.exec(codigo);
    if (rango) {
      const [, tipo = '', desde = '', tipoHasta, hasta = ''] = rango;
      if (tipoHasta !== undefined && tipoHasta !== tipo) throw new Error(`Un rango va dentro de un mismo tipo: ${pedido}`);
      const [a, b] = [Number(desde), Number(hasta)];
      if (a > b) throw new Error(`Rango al revés: ${pedido}`);
      // En un rango valen los huecos (códigos retirados); que no haya ninguno, no.
      const delRango = [...existentes].filter((c) => c[0] === tipo && numero(c) >= a && numero(c) <= b);
      if (delRango.length === 0) throw new Error(`Ningún código en ${pedido}`);
      for (const c of delRango) leidos.add(c);
    } else if (existentes.has(codigo)) {
      leidos.add(codigo);
    } else {
      throw new Error(`No existe el código ${pedido}`);
    }
  }
  return ordenarCodigos(leidos);
}

/** El registro con esos códigos marcados como revisados hoy, tal como se leen ahora. */
export function marcar(registro: Registro, elementos: readonly ElementoRevision[], codigos: readonly string[], el: string): Registro {
  const porCodigo = new Map(elementos.map((e) => [e.codigo, e]));
  const nuevo: Record<string, Revisado> = { ...registro };
  for (const c of codigos) {
    const e = porCodigo.get(c);
    if (!e) throw new Error(`No existe el código ${c}`);
    nuevo[c] = { huella: huellaDe(e), el };
  }
  return ordenado(nuevo);
}

export function quitar(registro: Registro, codigos: readonly string[]): Registro {
  const quitados = new Set(codigos);
  return ordenado(Object.fromEntries(Object.entries(registro).filter(([c]) => !quitados.has(c))));
}

function ordenado(registro: Registro): Registro {
  return Object.fromEntries(
    ordenarCodigos(Object.keys(registro)).flatMap((c) => {
      const r = registro[c];
      return r ? [[c, r] as const] : [];
    }),
  );
}

/**
 * Los códigos seguidos, juntos en tramos: «O1 a O12, O15» para leer, «O1-O12 O15» para la orden que los marca
 * (`tramos(codigos, '-', ' ')`).
 */
export function tramos(codigos: readonly string[], hasta = ' a ', entre = ', '): string {
  const partes: string[] = [];
  const ordenados = ordenarCodigos(codigos);
  let i = 0;
  while (i < ordenados.length) {
    const inicio = ordenados[i] ?? '';
    let fin = inicio;
    while (i + 1 < ordenados.length) {
      const siguiente = ordenados[i + 1] ?? '';
      if (siguiente[0] !== fin[0] || numero(siguiente) !== numero(fin) + 1) break;
      fin = siguiente;
      i++;
    }
    partes.push(fin === inicio ? inicio : `${inicio}${hasta}${fin}`);
    i++;
  }
  return partes.join(entre);
}

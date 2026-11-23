// Qué está revisado y qué falta. De cada elemento revisado se guarda en
// revisado.json la huella de lo que se leyó y el día: si después cambia lo que
// se lee, la huella deja de coincidir y vuelve solo a pendiente. Lo apunta
// `npm run revisado -- O1-O12 V3 --lote 3fa2b1c4` (scripts/revisado.ts), con la
// orden que lleva cada lote en docs/revision.md. Cada lote lleva, en una línea
// oculta, la huella de cada elemento tal como sale en esa copia, y eso es lo que
// se guarda, no lo que diga el código al marcar: lo que se corrija después de
// imprimir la copia, también por las correcciones de ese mismo lote, sigue
// pendiente y sale en el lote siguiente para confirmarlo.

import { fnv1a, huellaDe, type ElementoRevision, type Tipo } from './elementos';

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
 * se ha leído. Al marcar, los válidos son los del lote que se leyó (`donde`), así que un rango mal escrito (O1-O90 por
 * O1-O9) no se sale de él.
 */
export function leerCodigos(pedidos: readonly string[], validos: Iterable<string>, donde?: string): string[] {
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
      if (delRango.length === 0) throw new Error(donde ? `Ningún código de ${pedido} está en ${donde}` : `Ningún código en ${pedido}`);
      for (const c of delRango) leidos.add(c);
    } else if (existentes.has(codigo)) {
      leidos.add(codigo);
    } else {
      throw new Error(donde ? `${pedido} no está en ${donde}` : `No existe el código ${pedido}`);
    }
  }
  return ordenarCodigos(leidos);
}

/** La huella de cada elemento tal como es ahora, por código. */
export function huellasDe(elementos: readonly ElementoRevision[]): Map<string, string> {
  return new Map(elementos.map((e) => [e.codigo, huellaDe(e)]));
}

/** El registro con esos códigos marcados como revisados el día `el`, con la huella de lo que se leyó (`leidas`). */
export function marcar(registro: Registro, leidas: ReadonlyMap<string, string>, codigos: readonly string[], el: string): Registro {
  const nuevo: Record<string, Revisado> = { ...registro };
  for (const c of codigos) {
    const huella = leidas.get(c);
    if (huella === undefined) throw new Error(`${c} no está en lo que se leyó`);
    nuevo[c] = { huella, el };
  }
  return ordenado(nuevo);
}

/**
 * De los códigos que se marcan, los que ya no dicen lo que se leyó (se corrigieron después de la copia, o ya no
 * existen): se apuntan con la huella de lo leído, así que siguen pendientes y salen en el lote siguiente.
 */
export function cambiadosDesdeQueSeLeyo(leidas: ReadonlyMap<string, string>, elementos: readonly ElementoRevision[], codigos: readonly string[]): string[] {
  const ahora = huellasDe(elementos);
  return codigos.filter((c) => ahora.get(c) !== leidas.get(c));
}

/** La línea oculta de un lote en docs/revision.md: su id y la huella de cada elemento tal como sale en esa copia. */
export function lineaDeLote(lote: readonly ElementoRevision[]): { readonly id: string; readonly linea: string } {
  const huellas = lote.map((e) => `${e.codigo} ${huellaDe(e)}`).join(', ');
  const id = fnv1a(huellas);
  return { id, linea: `<!-- lote ${id}: ${huellas} -->` };
}

/**
 * Las huellas de un lote, sacadas de una copia de docs/revision.md por el id que lleva su orden, o null si esa copia
 * no lo trae. Una línea que no cuadra con su id (retocada a mano) no vale.
 */
export function leerLote(documento: string, id: string): Map<string, string> | null {
  for (const [, idLinea = '', huellas = ''] of documento.matchAll(/^<!-- lote ([0-9a-f]{8}): (.*) -->$/gm)) {
    if (idLinea !== id.toLowerCase() || fnv1a(huellas) !== idLinea) continue;
    const pares = huellas.split(', ').map((par) => /^([ORVSPET][1-9]\d*) ([0-9a-f]{8})$/.exec(par));
    if (pares.some((p) => p === null)) continue;
    return new Map(pares.flatMap((p) => (p ? [[p[1] ?? '', p[2] ?? ''] as const] : [])));
  }
  return null;
}

/** revisado.json con un código por línea: dos lotes marcados en ramas distintas casi nunca chocan. */
export function serializarRegistro(registro: Registro): string {
  const codigos = ordenarCodigos(Object.keys(registro));
  if (codigos.length === 0) return '{}\n';
  const lineas = codigos.map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(registro[c])}`);
  return `{\n${lineas.join(',\n')}\n}\n`;
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

// Todo lo que la app enseña y tiene que revisar una persona nativa, elemento a
// elemento y cada uno con su código permanente: las frases de orden (O), las
// reglas (R), los verbos (V), los separables (S), las palabras (P), las
// explicaciones de errores (E) y los demás textos con neerlandés (T). Los
// códigos de los datos van en los datos; los de las reglas y los textos, aquí.
//
// De cada elemento se guarda solo su contenido: texto de los datos o calculado
// por el código, sin etiquetas ni formato. El documento lo pinta (documento.ts)
// y la huella sale del contenido: si cambia algo de lo que se lee, vuelve a
// pendiente; si solo cambia cómo se pinta, no (decisión 0007).

import { FRASE_DE_PRUEBA } from '../audio';
import { alternativas, comoFrase, primera } from '../comun';
import { DESTREZAS, FALTA_PARA_B2, type IdDestreza } from '../destrezas';
import { PISTAS_GENERALES } from '../diagnostico';
import { diagnosticarEjemplos } from '../diagnostico/ejemplos';
import { GRUPOS_ORDEN, NOMBRES_GRUPO_ORDEN, REGLAS_ORDEN, type GrupoOrden } from '../orden/datos';
import { ELEMENTOS_ORDEN, orden } from '../orden/pista';
import { SEPARABLES, VERBOS, type DatosVerbo } from '../verbos/datos';
import { CONSIGNA_AUXILIAR, formaConJij, formasPresente, preguntaPresenteEs, REGLAS_VERBOS, SUJETOS, verbos } from '../verbos/pista';
import { GRUPOS_VOCABULARIO, NOMBRES_GRUPO_VOCABULARIO } from '../vocabulario/datos';
import { CONSIGNA_ARTICULO, ELEMENTOS_VOCABULARIO, PISTA_ARTICULO, vocabulario } from '../vocabulario/pista';

/** O frases de orden, R reglas, V verbos, S separables, P palabras, E explicaciones de errores, T otros textos. */
export type Tipo = 'O' | 'R' | 'V' | 'S' | 'P' | 'E' | 'T';

export interface ContenidoFrase {
  readonly frase: string;
  /** Las demás formas buenas. */
  readonly otras: readonly string[];
  readonly es: string;
  /** La pista que sale al traducirla, que a veces trae neerlandés. */
  readonly pista?: string;
}

export interface ContenidoVerbo {
  readonly inf: string;
  readonly es: string;
  /** Las seis formas (ik, jij, hij, wij, jullie, zij), la frase con ik, la pregunta con jij y sus otras formas. */
  readonly presente?: { readonly formas: readonly string[]; readonly frase: string; readonly pregunta?: string; readonly otrasConJij: readonly string[] };
  /** Con lo que se montan en español las frases de presente: las seis formas, lo que sigue y la pregunta. */
  readonly presenteEs?: { readonly formas: readonly string[]; readonly resto: string; readonly pregunta?: string };
  /** El presente de un verbo que no se practica: solo sale como opción mala en el pasado. */
  readonly presenteOpcion?: readonly string[];
  readonly perfectum?: { readonly auxiliar: string; readonly participio: string; readonly frase: string; readonly es: string; readonly otras: readonly string[] };
  readonly pasado?: { readonly singular: string; readonly plural: string; readonly frase?: string; readonly es?: string; readonly otras: readonly string[] };
  readonly nota?: string;
}

export interface ContenidoSeparable {
  readonly inf: string;
  readonly es: string;
  readonly presente: { readonly frase: string; readonly es: string; readonly otras: readonly string[] };
  readonly perfectum: { readonly auxiliar: string; readonly participio: string; readonly frase: string; readonly es: string };
}

export interface ContenidoPalabra {
  readonly nl: string;
  readonly otras: readonly string[];
  readonly es: string;
  readonly nota?: string;
}

export interface ContenidoExplicacion {
  /** La frase o la palabra buena, y lo que se ha respondido. */
  readonly frase: string;
  readonly respuesta: string;
  readonly diagnosticos: readonly { readonly titulo: string; readonly texto: string; readonly pista?: string }[];
}

interface Base {
  readonly codigo: string;
  /** El apartado del documento donde va: el grupo, en las frases y las palabras. */
  readonly apartado: string;
  /** Para situarse, sin ser parte de lo revisado (no entra en la huella): de qué va una regla o dónde sale un texto. */
  readonly contexto?: string;
  /** 1 si se revisa en la fase 1 (orden, verbos y pistas); 2, lo demás (palabras y textos). */
  readonly fase: 1 | 2;
}

export type ElementoRevision =
  | (Base & { readonly tipo: 'O'; readonly contenido: ContenidoFrase })
  | (Base & { readonly tipo: 'R'; readonly contenido: { readonly texto: string } })
  | (Base & { readonly tipo: 'V'; readonly contenido: ContenidoVerbo })
  | (Base & { readonly tipo: 'S'; readonly contenido: ContenidoSeparable })
  | (Base & { readonly tipo: 'P'; readonly contenido: ContenidoPalabra })
  /** de: el código del elemento sobre el que va el fallo. */
  | (Base & { readonly tipo: 'E'; readonly de: string; readonly contenido: ContenidoExplicacion })
  | (Base & { readonly tipo: 'T'; readonly contenido: { readonly texto: string } });

export const NOMBRES_TIPO: Readonly<Record<Tipo, string>> = {
  O: 'Orden de la frase',
  R: 'Reglas',
  V: 'Verbos',
  S: 'Verbos separables',
  P: 'Vocabulario',
  E: 'Explicaciones de errores',
  T: 'Otros textos de la app',
};

/** Los códigos de las reglas: no cambian aunque cambie el orden de los grupos. */
const CODIGOS_REGLAS_ORDEN: Readonly<Record<GrupoOrden, string>> = {
  inversion: 'R1',
  modal: 'R2',
  perfectum: 'R3',
  separables: 'R4',
  niet: 'R5',
  preguntas: 'R6',
  subordinada: 'R7',
  'subordinada-delante': 'R8',
};

const CODIGOS_REGLAS_VERBOS: Readonly<Record<keyof typeof REGLAS_VERBOS, string>> = {
  presente: 'R9',
  perfectum: 'R10',
  'perfectum-irregular': 'R11',
  zijn: 'R12',
  separables: 'R13',
  pasado: 'R14',
};

const NOMBRES_REGLAS_VERBOS: Readonly<Record<keyof typeof REGLAS_VERBOS, string>> = {
  presente: 'Presente',
  perfectum: 'Perfectum regular',
  'perfectum-irregular': 'Perfectum irregular',
  zijn: 'Perfectum con zijn',
  separables: 'Verbos separables',
  pasado: 'Pasado simple',
};

/** Las destrezas salen en Progreso con su nombre y su descripción. */
const CODIGOS_DESTREZAS: Readonly<Record<IdDestreza, string>> = {
  presente: 'T1',
  inversion: 'T2',
  modal: 'T3',
  'perfectum-orden': 'T4',
  participio: 'T5',
  auxiliar: 'T6',
  niet: 'T7',
  preguntas: 'T8',
  vocabulario: 'T9',
  articulo: 'T10',
  'participio-irregular': 'T11',
  separables: 'T12',
  subordinada: 'T13',
  'subordinada-delante': 'T14',
  pasado: 'T15',
};

function frasesDeOrden(grupo: GrupoOrden): ElementoRevision[] {
  const apartado = `${NOMBRES_TIPO.O}: ${NOMBRES_GRUPO_ORDEN[grupo]}`;
  const regla: ElementoRevision = { codigo: CODIGOS_REGLAS_ORDEN[grupo], tipo: 'R', apartado, fase: 1, contenido: { texto: REGLAS_ORDEN[grupo] } };
  const frases = ELEMENTOS_ORDEN.filter((e) => e.grupo === grupo).map(
    (f): ElementoRevision => ({
      codigo: f.codigo,
      tipo: 'O',
      apartado,
      fase: 1,
      contenido: { frase: f.frase, otras: f.validas.slice(1), es: f.es, ...(f.pista ? { pista: f.pista } : {}) },
    }),
  );
  return [regla, ...frases];
}

function contenidoVerbo(v: DatosVerbo): ContenidoVerbo {
  let presente: ContenidoVerbo['presente'];
  let presenteEs: ContenidoVerbo['presenteEs'];
  if (v.comp !== undefined) {
    const formas = formasPresente(v);
    const [conJij = '', ...otrasConJij] = v.sinPregunta ? [] : alternativas(formaConJij(v));
    presente = {
      formas,
      frase: comoFrase(`ik ${primera(formas[0] ?? '')} ${v.comp}`),
      ...(v.sinPregunta ? {} : { pregunta: comoFrase(`${conJij} jij ${v.comp}`, '?') }),
      otrasConJij,
    };
    // Las frases de presente salen traducidas: el sujeto, la forma en español y lo que sigue.
    if (v.presenteEs && v.compEs !== undefined) {
      const pregunta = v.sinPregunta ? undefined : preguntaPresenteEs(v);
      presenteEs = { formas: v.presenteEs, resto: v.compEs, ...(pregunta ? { pregunta } : {}) };
    }
  }
  return {
    inf: v.inf,
    es: v.es,
    ...(presente ? { presente } : {}),
    ...(presenteEs ? { presenteEs } : {}),
    // No se practica, pero sale como opción mala en el pasado: también hay que revisarlo.
    ...(v.comp === undefined && v.raiz && v.pasado ? { presenteOpcion: formasPresente(v) } : {}),
    ...(v.participio && v.perf
      ? {
          perfectum: {
            auxiliar: v.aux === 'zijn' ? 'is' : 'heeft',
            participio: v.participio,
            frase: comoFrase(v.perf[0]),
            es: v.perf[1],
            otras: (v.perfOtras ?? []).map((o) => comoFrase(o)),
          },
        }
      : {}),
    ...(v.pasado
      ? {
          pasado: {
            singular: v.pasado[0],
            plural: v.pasado[1],
            ...(v.pasadoEj ? { frase: comoFrase(v.pasadoEj[0]), es: v.pasadoEj[1] } : {}),
            otras: (v.pasadoOtras ?? []).map((o) => comoFrase(o)),
          },
        }
      : {}),
    ...(v.nota ? { nota: v.nota } : {}),
  };
}

function reglaDeVerbos(k: keyof typeof REGLAS_VERBOS, apartado: string): ElementoRevision {
  return { codigo: CODIGOS_REGLAS_VERBOS[k], tipo: 'R', apartado, contexto: NOMBRES_REGLAS_VERBOS[k], fase: 1, contenido: { texto: REGLAS_VERBOS[k] } };
}

function verbosConSusReglas(): ElementoRevision[] {
  const reglas = (Object.keys(REGLAS_VERBOS) as (keyof typeof REGLAS_VERBOS)[]).filter((k) => k !== 'separables').map((k) => reglaDeVerbos(k, NOMBRES_TIPO.V));
  // Lo que sale con todos los verbos: la consigna del auxiliar y los sujetos de las frases de presente.
  const comunes = [
    texto('T30', 'Verbos, la consigna al elegir el auxiliar del perfectum', CONSIGNA_AUXILIAR, 1),
    texto('T33', 'Verbos, los sujetos con que salen las frases de presente (cada forma, ya revisada, va con uno de ellos)', SUJETOS.map((s) => `«${s.nl}»: ${s.es}`).join('; '), 1),
  ].map((t) => ({ ...t, apartado: NOMBRES_TIPO.V }));
  return [...reglas, ...VERBOS.map((v): ElementoRevision => ({ codigo: v.codigo, tipo: 'V', apartado: NOMBRES_TIPO.V, fase: 1, contenido: contenidoVerbo(v) })), ...comunes];
}

function separablesConSuRegla(): ElementoRevision[] {
  const separables = SEPARABLES.map(
    (s): ElementoRevision => ({
      codigo: s.codigo,
      tipo: 'S',
      apartado: NOMBRES_TIPO.S,
      fase: 1,
      contenido: {
        inf: s.inf,
        es: s.es,
        presente: { frase: comoFrase(s.presente.replaceAll('|', ' ')), es: s.presenteEs, otras: (s.otras ?? []).map((o) => comoFrase(o)) },
        perfectum: { auxiliar: s.aux === 'zijn' ? 'is' : 'heeft', participio: s.participio, frase: comoFrase(s.perf[0]), es: s.perf[1] },
      },
    }),
  );
  return [reglaDeVerbos('separables', NOMBRES_TIPO.S), ...separables];
}

function palabras(): ElementoRevision[] {
  const comunes = [
    texto('T31', 'Vocabulario, la consigna al elegir el artículo', CONSIGNA_ARTICULO),
    texto('T32', 'Vocabulario, la pista al escribir un sustantivo', PISTA_ARTICULO),
  ].map((t) => ({ ...t, apartado: NOMBRES_TIPO.P }));
  const porGrupo = GRUPOS_VOCABULARIO.flatMap((grupo) =>
    ELEMENTOS_VOCABULARIO.filter((e) => e.grupo === grupo).map(
      (p): ElementoRevision => ({
        codigo: p.codigo,
        tipo: 'P',
        apartado: `${NOMBRES_TIPO.P}: ${NOMBRES_GRUPO_VOCABULARIO[grupo]}`,
        fase: 2,
        contenido: { nl: p.nl, otras: p.otras, es: p.es, ...(p.nota ? { nota: p.nota } : {}) },
      }),
    ),
  );
  return [...comunes, ...porGrupo];
}

/** Cada explicación de error, con el apartado del elemento sobre el que va, para revisarla justo después de él. */
function explicaciones(sobre: ReadonlyMap<string, ElementoRevision>): ElementoRevision[] {
  return diagnosticarEjemplos().map((e): ElementoRevision => {
    const origen = sobre.get(e.de);
    if (!origen) throw new Error(`${e.codigo}: no está en la revisión el elemento ${e.de}`);
    const nombre = origen.tipo === 'O' ? (origen.apartado.split(': ')[1] ?? origen.apartado) : NOMBRES_TIPO[origen.tipo].toLowerCase();
    return {
      codigo: e.codigo,
      tipo: 'E',
      de: e.de,
      apartado: `${NOMBRES_TIPO.E}: ${nombre}`,
      fase: origen.fase,
      contenido: {
        frase: e.frase,
        respuesta: e.respuesta,
        diagnosticos: e.diagnosticos.map((d) => ({ titulo: d.titulo, texto: d.texto, ...(d.pista ? { pista: d.pista } : {}) })),
      },
    };
  });
}

/** Un texto suelto: qué dice y, como contexto, dónde sale. */
function texto(codigo: string, donde: string, contenido: string, fase: 1 | 2 = 2): ElementoRevision {
  return { codigo, tipo: 'T', apartado: NOMBRES_TIPO.T, contexto: donde, fase, contenido: { texto: contenido } };
}

/** Las pistas del primer fallo cuando no se sabe qué regla ha fallado (las demás van con su explicación, en E). */
function pistasGenerales(): ElementoRevision[] {
  return [
    texto('T26', 'Pista del primer fallo al ordenar, si no se sabe qué regla falla', PISTAS_GENERALES.ordenar, 1),
    texto('T27', 'Pista del primer fallo al escribir la frase con las palabras buenas en otro orden', PISTAS_GENERALES.traducirOrden, 1),
    // T28 era la pista general al escribir la frase con otras palabras: ya no hay reintento sin diagnóstico. Su código no se reutiliza.
    texto('T29', 'Pista del primer fallo al completar una forma', PISTAS_GENERALES.completar, 1),
  ].map((t) => ({ ...t, apartado: 'Pistas del primer fallo' }));
}

function textos(): ElementoRevision[] {
  return [
    ...DESTREZAS.map((d) => texto(CODIGOS_DESTREZAS[d.id], 'Progreso, una regla', `${d.nombre}. ${d.descripcion}`)),
    ...FALTA_PARA_B2.map((f) => texto(f.codigo, 'Progreso, lo que falta para B2', f.texto)),
    texto('T22', 'Hoy, la parte de orden', orden.descripcion),
    texto('T23', 'Hoy, la parte de verbos', verbos.descripcion),
    texto('T24', 'Hoy, la parte de vocabulario', vocabulario.descripcion),
    texto('T25', 'Ajustes, el botón Probar de la voz', FRASE_DE_PRUEBA),
  ];
}

/**
 * Todo lo revisable, en el orden en que se revisa: primero lo de la fase 1 (cada grupo de orden con su regla, sus
 * frases y sus explicaciones de errores; después los verbos, los separables y las pistas generales) y al final las
 * palabras y los demás textos, que pueden esperar a la fase 2.
 */
export function elementosDeRevision(): ElementoRevision[] {
  const bloques = [...GRUPOS_ORDEN.map(frasesDeOrden), verbosConSusReglas(), separablesConSuRegla(), palabras()];
  const sobre = new Map(bloques.flat().map((e) => [e.codigo, e]));
  const errores = explicaciones(sobre);
  const conSusErrores = bloques.map((bloque) => {
    const codigos = new Set(bloque.map((e) => e.codigo));
    return [...bloque, ...errores.filter((e) => e.tipo === 'E' && codigos.has(e.de))];
  });
  const palabrasConErrores = conSusErrores.pop() ?? [];
  return [...conSusErrores.flat(), ...pistasGenerales(), ...palabrasConErrores, ...textos()];
}

/** El contenido como listas de cadenas, en el orden en que se construye y sin los nombres de los campos. */
function segmentos(valor: unknown): unknown {
  if (typeof valor === 'string') return valor.normalize('NFC');
  if (Array.isArray(valor)) return valor.map(segmentos);
  if (typeof valor === 'object' && valor !== null) return Object.values(valor).filter((v) => v !== undefined).map(segmentos);
  throw new Error(`El contenido revisable solo lleva texto, no ${typeof valor}`);
}

/**
 * FNV-1a de 32 bits sobre UTF-8, en hexadecimal. La revisión tiene la suya y el audio la suya: si algún día hay que
 * cambiar la del audio, lo revisado no vuelve entero a pendiente.
 */
function fnv1a(texto: string): string {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(texto)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** La huella de lo que se revisa de un elemento: su contenido, normalizado (NFC), sin formato ni etiquetas. */
export function huellaDe(e: ElementoRevision): string {
  return fnv1a(JSON.stringify(segmentos(e.contenido)));
}

/** Todas las cadenas del contenido de un elemento, seguidas. */
export function textosDe(e: ElementoRevision): string[] {
  const planos = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(planos) : []);
  return planos(segmentos(e.contenido));
}

/** Las palabras del contenido (sin etiquetas ni códigos): con ellas se estima lo que se tarda en leerlo. */
export function palabrasDe(e: ElementoRevision): number {
  return textosDe(e)
    .join(' ')
    .split(/\s+/)
    .filter((p) => /\p{L}/u.test(p)).length;
}

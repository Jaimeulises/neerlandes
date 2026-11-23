// Todo lo que la app enseña y tiene que revisar una persona nativa, elemento a
// elemento y cada uno con su código permanente: las frases de orden (O), las
// reglas (R), los verbos (V), los separables (S), las palabras (P), las
// explicaciones de errores (E) y los demás textos con neerlandés (T). Los
// códigos de los datos van en los datos; los de las reglas y los textos, aquí.
//
// De cada elemento sale lo que ve quien revisa, en Markdown. Su huella se saca
// de ese texto sin las marcas de formato: si cambia algo de lo que se lee,
// vuelve a estar pendiente; si solo cambia el formato, no (ver estado.ts).

import { FRASE_DE_PRUEBA } from '../audio';
import { alternativas, comoFrase, huella, primera } from '../comun';
import { DESTREZAS, FALTA_PARA_B2, type IdDestreza } from '../destrezas';
import { PISTAS_GENERALES } from '../diagnostico';
import { diagnosticarEjemplos } from '../diagnostico/ejemplos';
import { GRUPOS_ORDEN, NOMBRES_GRUPO_ORDEN, REGLAS_ORDEN, type GrupoOrden } from '../orden/datos';
import { ELEMENTOS_ORDEN, orden } from '../orden/pista';
import { SEPARABLES, VERBOS, type DatosVerbo } from '../verbos/datos';
import { formaConJij, formasPresente, preguntaPresenteEs, REGLAS_VERBOS, verbos } from '../verbos/pista';
import { GRUPOS_VOCABULARIO, NOMBRES_GRUPO_VOCABULARIO } from '../vocabulario/datos';
import { ELEMENTOS_VOCABULARIO, vocabulario } from '../vocabulario/pista';

/** O frases de orden, R reglas, V verbos, S separables, P palabras, E explicaciones de errores, T otros textos. */
export type Tipo = 'O' | 'R' | 'V' | 'S' | 'P' | 'E' | 'T';

/** Cómo se pinta un elemento: fila de una de las dos tablas, punto de una lista o bloque suelto. */
export type Formato = 'tabla-orden' | 'tabla-palabras' | 'lista' | 'bloque';

export interface ElementoRevision {
  readonly codigo: string;
  readonly tipo: Tipo;
  /** El apartado del documento donde va (el grupo, en las frases y las palabras). */
  readonly apartado: string;
  readonly formato: Formato;
  /** Lo que se ve, en Markdown: una fila de tabla o las líneas de un bloque. */
  readonly lineas: readonly string[];
}

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

/** Un texto dentro de una celda de tabla: sin barras que la rompan. */
function celda(texto: string): string {
  return texto.replaceAll('|', '\\|');
}

/** « También: «…», «…»» con las otras formas buenas, o nada. */
function tambien(otras: readonly string[] | undefined): string {
  return otras && otras.length > 0 ? ` También: ${otras.map((o) => `«${comoFrase(o)}»`).join(', ')}` : '';
}

function presenteEnLinea(v: DatosVerbo): string {
  const f = formasPresente(v);
  const [ik, jij, hij, wij, jullie, zij] = f;
  const plural = wij === jullie && jullie === zij ? `wij, jullie, zij ${wij}` : `wij ${wij}, jullie ${jullie}, zij ${zij}`;
  return `ik ${ik}, jij ${jij}, hij ${hij}, ${plural}`;
}

function regla(codigo: string, apartado: string, titulo: string | null, texto: string): ElementoRevision {
  return { codigo, tipo: 'R', apartado, formato: 'bloque', lineas: [`> **${codigo}.** ${titulo ? `**${titulo}.** ` : ''}${texto}`] };
}

function frasesDeOrden(): ElementoRevision[] {
  return GRUPOS_ORDEN.flatMap((grupo) => {
    const apartado = `${NOMBRES_TIPO.O}: ${NOMBRES_GRUPO_ORDEN[grupo]}`;
    const frases = ELEMENTOS_ORDEN.filter((e) => e.grupo === grupo).map((f): ElementoRevision => {
      const otras = f.validas.slice(1);
      const nl = otras.length > 0 ? `${f.frase}<br>*También:* ${otras.join(' / ')}` : f.frase;
      // La pista sale al traducir y a veces trae neerlandés: también se revisa.
      const es = f.pista ? `${f.es}<br>*Pista:* ${f.pista}` : f.es;
      return { codigo: f.codigo, tipo: 'O', apartado, formato: 'tabla-orden', lineas: [`| ${f.codigo} | ${celda(nl)} | ${celda(es)} |`] };
    });
    return [regla(CODIGOS_REGLAS_ORDEN[grupo], apartado, null, REGLAS_ORDEN[grupo]), ...frases];
  });
}

function bloqueVerbo(v: DatosVerbo): ElementoRevision {
  const lineas = [`**${v.codigo}. ${v.inf}**: ${v.es}`, ''];
  if (v.comp !== undefined) {
    const f = formasPresente(v);
    let presente = `- Presente: ${presenteEnLinea(v)}. «${comoFrase(`ik ${primera(f[0])} ${v.comp}`)}»`;
    if (!v.sinPregunta) {
      const [conJij, ...otras] = alternativas(formaConJij(v));
      presente += ` «${comoFrase(`${conJij ?? ''} jij ${v.comp}`, '?')}»`;
      if (otras.length > 0) presente += ` (también ${otras.map((o) => `«${o} jij»`).join(', ')})`;
    }
    lineas.push(presente);
    // Las frases de presente salen traducidas: el sujeto, la forma en español y lo que sigue.
    if (v.presenteEs && v.compEs !== undefined) {
      const pregunta = v.sinPregunta ? '' : ` La pregunta: «${preguntaPresenteEs(v) ?? ''}»`;
      lineas.push(`- En español: ${v.presenteEs.join(', ')} + «${v.compEs}».${pregunta}`);
    }
  } else if (v.raiz && v.pasado) {
    // No se practica, pero sale como opción mala en el pasado: también hay que revisarlo.
    lineas.push(`- Presente (solo sale como opción mala en el pasado): ${presenteEnLinea(v)}.`);
  }
  if (v.participio && v.perf) {
    lineas.push(`- Perfectum: ${v.aux === 'zijn' ? 'is' : 'heeft'} ${v.participio}. «${comoFrase(v.perf[0])}» ${v.perf[1]}${tambien(v.perfOtras)}`);
  }
  if (v.pasado) {
    const ejemplo = v.pasadoEj ? ` «${comoFrase(v.pasadoEj[0])}» ${v.pasadoEj[1]}${tambien(v.pasadoOtras)}` : '';
    lineas.push(`- Pasado: ${v.pasado[0]}, ${v.pasado[1]}.${ejemplo}`);
  }
  if (v.nota) lineas.push(`- Nota: ${v.nota}`);
  return { codigo: v.codigo, tipo: 'V', apartado: NOMBRES_TIPO.V, formato: 'bloque', lineas };
}

function verbosYSeparables(): ElementoRevision[] {
  const reglasVerbos = (Object.keys(REGLAS_VERBOS) as (keyof typeof REGLAS_VERBOS)[])
    .filter((k) => k !== 'separables')
    .map((k) => regla(CODIGOS_REGLAS_VERBOS[k], NOMBRES_TIPO.V, NOMBRES_REGLAS_VERBOS[k], REGLAS_VERBOS[k]));
  const separables = SEPARABLES.map((s): ElementoRevision => {
    const otras = (s.otras ?? []).map((o) => `«${comoFrase(o)}»`);
    return {
      codigo: s.codigo,
      tipo: 'S',
      apartado: NOMBRES_TIPO.S,
      formato: 'bloque',
      lineas: [
        `**${s.codigo}. ${s.inf}**: ${s.es}`,
        '',
        `- Presente: «${comoFrase(s.presente.replaceAll('|', ' '))}» ${s.presenteEs}${otras.length > 0 ? ` También: ${otras.join(', ')}` : ''}`,
        `- Perfectum: ${s.aux === 'zijn' ? 'is' : 'heeft'} ${s.participio}. «${comoFrase(s.perf[0])}» ${s.perf[1]}`,
      ],
    };
  });
  return [
    ...reglasVerbos,
    ...VERBOS.map(bloqueVerbo),
    regla(CODIGOS_REGLAS_VERBOS.separables, NOMBRES_TIPO.S, null, REGLAS_VERBOS.separables),
    ...separables,
  ];
}

function palabras(): ElementoRevision[] {
  return GRUPOS_VOCABULARIO.flatMap((grupo) =>
    ELEMENTOS_VOCABULARIO.filter((e) => e.grupo === grupo).map((p): ElementoRevision => {
      const nl = p.otras.length > 0 ? `${p.nl}<br>*También:* ${p.otras.join(' / ')}` : p.nl;
      return {
        codigo: p.codigo,
        tipo: 'P',
        apartado: `${NOMBRES_TIPO.P}: ${NOMBRES_GRUPO_VOCABULARIO[grupo]}`,
        formato: 'tabla-palabras',
        lineas: [`| ${p.codigo} | ${celda(nl)} | ${celda(p.es)} | ${celda(p.nota ?? '')} |`],
      };
    }),
  );
}

function explicaciones(): ElementoRevision[] {
  return diagnosticarEjemplos().map((e) => ({
    codigo: e.codigo,
    tipo: 'E',
    apartado: NOMBRES_TIPO.E,
    formato: 'bloque',
    lineas: [
      `**${e.codigo}.** Sobre ${e.de}: «${e.frase}» → respuesta: «${e.respuesta}»`,
      '',
      ...e.diagnosticos.flatMap((d) => [`- **${d.titulo}.** ${d.texto}`, ...(d.pista ? [`  - *Pista antes del segundo intento:* ${d.pista}`] : [])]),
    ],
  }));
}

/** Un texto suelto: dónde sale y qué dice. */
function texto(codigo: string, donde: string, contenido: string): ElementoRevision {
  return { codigo, tipo: 'T', apartado: NOMBRES_TIPO.T, formato: 'lista', lineas: [`- **${codigo}** (${donde}): ${contenido}`] };
}

function textos(): ElementoRevision[] {
  return [
    ...DESTREZAS.map((d) => texto(CODIGOS_DESTREZAS[d.id], 'Progreso, una regla', `${d.nombre}. ${d.descripcion}`)),
    ...FALTA_PARA_B2.map((f) => texto(f.codigo, 'Progreso, lo que falta para B2', f.texto)),
    texto('T22', 'Hoy, la parte de orden', orden.descripcion),
    texto('T23', 'Hoy, la parte de verbos', verbos.descripcion),
    texto('T24', 'Hoy, la parte de vocabulario', vocabulario.descripcion),
    texto('T25', 'Ajustes, el botón Probar de la voz', FRASE_DE_PRUEBA),
    // La pista del primer fallo cuando no se sabe qué regla ha fallado (las demás van con su explicación, en E).
    texto('T26', 'Pista del primer fallo al ordenar, si no se sabe qué regla falla', PISTAS_GENERALES.ordenar),
    texto('T27', 'Pista del primer fallo al escribir la frase con las palabras buenas en otro orden', PISTAS_GENERALES.traducirOrden),
    // T28 era la pista general al escribir la frase con otras palabras: ya no hay reintento sin diagnóstico. Su código no se reutiliza.
    texto('T29', 'Pista del primer fallo al completar una forma', PISTAS_GENERALES.completar),
  ];
}

/** Todo lo revisable, en el orden en que se revisa: orden, verbos y separables primero, que es lo que más se practica. */
export function elementosDeRevision(): ElementoRevision[] {
  return [...frasesDeOrden(), ...verbosYSeparables(), ...palabras(), ...explicaciones(), ...textos()];
}

/** Lo que se lee de un elemento, sin marcas de formato: de aquí sale su huella. */
export function textoVisible(e: ElementoRevision): string {
  return e.lineas
    .join('\n')
    .replaceAll('<br>', ' ')
    .replaceAll('\\|', '|')
    .replaceAll(/\*\*|\*/g, '')
    .replaceAll(/^\s*(?:[-|>]\s*)+/gm, '')
    .replaceAll(/\s*\|\s*/g, ' | ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export function huellaDe(e: ElementoRevision): string {
  return huella(textoVisible(e));
}

export function palabrasDe(e: ElementoRevision): number {
  return textoVisible(e).split(' ').filter((p) => /\p{L}/u.test(p)).length;
}

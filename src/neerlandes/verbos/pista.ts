// La pista de los verbos. Cada verbo entra una vez por cada cosa que se
// practica de él: su presente, su participio con hebben o zijn, su pasado
// simple o, si es separable, dónde va la partícula. Casi todo se responde
// escribiendo la forma, porque reconocerla no basta para decirla.

import type { ContextoEjercicio, Ejercicio, Elemento, Pista, Presentacion } from '../../motor';
import { alternativas, comoFrase, conFormasTonicas, elegirForma, hueco, opcionesCon, primera } from '../comun';
import { ejercicioDeFrase, type Frase } from '../orden/pista';
import { SEPARABLES, VERBOS, type DatosSeparable, type DatosVerbo, type Formas } from './datos';

export const GRUPOS_VERBOS = ['presente', 'perfectum', 'perfectum-irregular', 'separables', 'pasado'] as const;
export type GrupoVerbos = (typeof GRUPOS_VERBOS)[number];

export const NOMBRES_GRUPO_VERBOS: Readonly<Record<GrupoVerbos, string>> = {
  presente: 'Presente',
  perfectum: 'Perfectum regular',
  'perfectum-irregular': 'Perfectum irregular',
  separables: 'Verbos separables',
  pasado: 'Pasado simple',
};

// Los ejemplos de las reglas no son frases ni formas que la app pregunte antes de enseñarlas: la regla
// se presenta al abrir el grupo y no debe dar la respuesta del ejercicio que viene detrás.
const REGLA_PRESENTE =
  'En los regulares: ik + raíz; jij, hij y zij + raíz + t (si la raíz ya acaba en t, no se añade otra: hij zet); en plural, el infinitivo. Si el sujeto jij o je va detrás del verbo, sin -t: «werk jij?». Los irregulares (zijn, hebben, kunnen, mogen…) tienen formas propias.';
const REGLA_PERFECTUM =
  'Participio regular: ge + raíz + t si en el infinitivo va t, k, f, s, ch o p delante de -en (’t kofschip); si no, ge + raíz + d. Se mira el infinitivo, no la raíz: leven da geleefd aunque se diga ik leef. Si la raíz ya acaba en t o d, no se añade otra (zetten da gezet). Sin ge- con los prefijos átonos be-, ver-, ge-, her-, ont- y er- (beloven da beloofd); si esas letras no son prefijo, sí lo lleva (verven da geverfd).';
const REGLA_IRREGULAR =
  'Participio irregular: no sigue la regla y hay que aprenderlo de memoria. Muchos acaban en -en, a menudo con otra vocal (drinken, gedronken; schrijven, geschreven); otros acaban en -cht (denken, gedacht; kopen, gekocht) y unos pocos son únicos (zijn, geweest; hebben, gehad).';
const REGLA_ZIJN =
  'Con zijn van los verbos de movimiento hacia un sitio o de cambio de estado (gaan, komen, worden, verhuizen…), y además zijn y blijven, que no son ni lo uno ni lo otro (ik ben geweest, ik ben gebleven).';
const REGLA_SEPARABLES =
  'Cuando el verbo va conjugado en la frase principal, en presente o en pasado, la partícula se separa y va al final: «ik bel je op». Va pegada en el infinitivo («ik wil je opbellen»), en una subordinada («omdat ik je opbel») y en el participio, delante de ge- (opgebeld, meegenomen).';
const REGLA_PASADO = 'El pasado simple se usa sobre todo para contar y describir: «toen woonde ik…», «het was koud».';

export interface Verbo extends Elemento {
  readonly grupo: GrupoVerbos;
  readonly verbo?: DatosVerbo;
  readonly separable?: DatosSeparable;
}

/** Las seis formas del presente, con sus alternativas. */
export function formasPresente(v: DatosVerbo): Formas {
  if (v.presente) return v.presente;
  const raiz = v.raiz ?? v.inf;
  const conT = raiz.endsWith('t') ? raiz : `${raiz}t`;
  return [raiz, conT, conT, v.inf, v.inf, v.inf];
}

/** La forma de una persona (0 a 5). */
function formaDe(formas: Formas, i: number): string {
  return formas[i] ?? formas[0];
}

/** La forma con jij detrás del verbo (sin la -t). */
export function formaConJij(v: DatosVerbo): string {
  return v.conJij ?? formasPresente(v)[0];
}

interface Sujeto {
  readonly nl: string;
  /** Posición en las seis formas. */
  readonly i: number;
}

const SUJETOS: readonly Sujeto[] = [
  { nl: 'ik', i: 0 },
  { nl: 'jij', i: 1 },
  { nl: 'hij', i: 2 },
  { nl: 'mijn zus', i: 2 },
  { nl: 'we', i: 3 },
  { nl: 'jullie', i: 4 },
  { nl: 'mijn ouders', i: 5 },
];

const AUXILIARES: Readonly<Record<string, string>> = {
  heb: 'ben',
  hebt: 'bent',
  heeft: 'is',
  hebben: 'zijn',
  ben: 'heb',
  bent: 'hebt',
  is: 'heeft',
  zijn: 'hebben',
};

function tablaPresente(v: DatosVerbo): (readonly [string, string])[] {
  const f = formasPresente(v);
  const filas: (readonly [string, string])[] = [
    ['ik', f[0]],
    ['jij', f[1]],
    ['hij, zij', f[2]],
    ['wij', f[3]],
    ['jullie', f[4]],
    ['zij', f[5]],
  ];
  if (!v.sinPregunta) filas.push([`${primera(formaConJij(v))} jij…?`, 'pregunta']);
  return filas.map(([a, b]) => [a, b.replaceAll('/', ' / ')] as const);
}

function resumenPresente(v: DatosVerbo): string {
  const f = formasPresente(v).map(primera);
  return `${v.inf}: ik ${f[0]}, jij ${f[1]}, hij ${f[2]}, wij ${f[3]}.`;
}

function frasePresente(sujeto: string, forma: string, comp: string): string {
  return comoFrase(`${sujeto} ${forma} ${comp}`);
}

function ejercicioPresente(e: Verbo, v: DatosVerbo, contexto: ContextoEjercicio): Ejercicio {
  const { azar } = contexto;
  const formas = formasPresente(v);
  const comp = v.comp ?? '';
  const base = { elementoId: e.id, aclaracion: `${resumenPresente(v)} ${REGLA_PRESENTE}` };

  // La primera vez se elige; en los repasos, solo si elegir está activado (y siempre, si completar no lo está).
  const elegir = contexto.repeticiones === 0 || (contexto.formas.has('opcion') && (!contexto.formas.has('completar') || azar.siguiente() < 0.2));
  if (elegir) {
    // Elegir: solo con sujetos cuya forma no tiene alternativa, para que no haya dos respuestas buenas.
    const sujetos = SUJETOS.filter((s) => !formaDe(formas, s.i).includes('/'));
    const sujeto = azar.elegir(sujetos) ?? SUJETOS[0];
    if (sujeto) {
      const correcta = formaDe(formas, sujeto.i);
      const distintas = [...new Set(formas.map(primera))];
      return {
        ...base,
        forma: 'opcion',
        tipo: 'verbos.presente.elegir',
        instruccion: `Elige la forma de «${v.inf}»`,
        enunciado: `${comoFrase(sujeto.nl, '').trimEnd()} ___ ${comp}.`,
        enunciadoEnIdioma: true,
        opciones: opcionesCon(correcta, azar.barajar(distintas), azar, 4),
        opcionesEnIdioma: true,
        respuestaCorrecta: correcta,
        audio: frasePresente(sujeto.nl, correcta, comp),
      };
    }
  }

  const pregunta = !v.sinPregunta && azar.siguiente() < 0.3;
  if (pregunta) {
    const respuestas = alternativas(formaConJij(v));
    return {
      ...base,
      forma: 'completar',
      tipo: 'verbos.presente.pregunta',
      instruccion: 'Completa la pregunta',
      antes: '',
      despues: ` jij ${comp}?`,
      pista: v.inf,
      respuestas,
      audio: comoFrase(`${respuestas[0] ?? ''} jij ${comp}`, '?'),
    };
  }
  const sujeto = azar.elegir(SUJETOS) ?? { nl: 'ik', i: 0 };
  const respuestas = alternativas(formaDe(formas, sujeto.i));
  return {
    ...base,
    forma: 'completar',
    tipo: 'verbos.presente.completar',
    instruccion: 'Completa con el verbo',
    antes: `${comoFrase(sujeto.nl, '').trimEnd()} `,
    despues: ` ${comp}.`,
    pista: v.inf,
    respuestas,
    audio: frasePresente(sujeto.nl, respuestas[0] ?? '', comp),
  };
}

/** Rellenar el participio de la frase de ejemplo. */
function completarParticipio(e: Verbo, inf: string, participio: string, perf: readonly [string, string], aclaracion: string): Ejercicio {
  const [nl, es] = perf;
  const h = hueco(nl, participio) ?? { antes: comoFrase(nl), despues: '' };
  return {
    forma: 'completar',
    tipo: 'verbos.perfectum.participio',
    elementoId: e.id,
    instruccion: 'Completa con el participio',
    antes: h.antes,
    despues: h.despues,
    pista: inf,
    significado: es,
    respuestas: [participio],
    audio: comoFrase(nl),
    aclaracion,
  };
}

/** Elegir entre hebben y zijn en la frase de ejemplo. */
function elegirAuxiliar(e: Verbo, perf: readonly [string, string], aclaracion: string, contexto: ContextoEjercicio): Ejercicio | null {
  const [nl, es] = perf;
  const palabras = nl.split(/\s+/);
  const i = palabras.findIndex((p) => p in AUXILIARES);
  const forma = palabras[i];
  const otra = forma ? AUXILIARES[forma] : undefined;
  if (i < 0 || !forma || !otra) return null;
  const conHueco = comoFrase(palabras.map((p, j) => (j === i ? '___' : p)).join(' '));
  return {
    forma: 'opcion',
    tipo: 'verbos.perfectum.auxiliar',
    elementoId: e.id,
    instruccion: `¿Hebben o zijn? ${es}`,
    enunciado: conHueco,
    enunciadoEnIdioma: true,
    opciones: contexto.azar.barajar([forma, otra]),
    opcionesEnIdioma: true,
    respuestaCorrecta: forma,
    audio: comoFrase(nl),
    aclaracion,
  };
}

function traducirFrase(e: Verbo, perf: readonly [string, string], otras: readonly string[], tipo: string, pista: string, aclaracion: string): Ejercicio {
  const [nl, es] = perf;
  return {
    forma: 'traducir',
    tipo,
    elementoId: e.id,
    instruccion: 'Escríbela en neerlandés',
    significado: es,
    pista,
    respuestas: conFormasTonicas([comoFrase(nl), ...otras.map((o) => comoFrase(o))]),
    audio: comoFrase(nl),
    aclaracion,
  };
}

function decirFrase(e: Verbo, perf: readonly [string, string], tipo: string, pista: string, aclaracion: string): Ejercicio {
  const [nl, es] = perf;
  return {
    forma: 'decir',
    tipo,
    elementoId: e.id,
    instruccion: 'Dila en voz alta y luego compruébala',
    significado: es,
    texto: comoFrase(nl),
    pista,
    audio: comoFrase(nl),
    aclaracion,
  };
}

function reglaPerfectum(v: DatosVerbo): string {
  const regla = v.irregular ? REGLA_IRREGULAR : REGLA_PERFECTUM;
  const aux = v.aux === 'zijn' ? ` Va con zijn. ${REGLA_ZIJN}` : ' Va con hebben.';
  return `${v.inf}: ${v.aux === 'zijn' ? 'is' : 'heeft'} ${v.participio ?? ''}. ${regla}${aux}${v.nota ? ` ${v.nota}` : ''}`;
}

function ejercicioPerfectum(e: Verbo, v: DatosVerbo, contexto: ContextoEjercicio): Ejercicio {
  const perf = v.perf ?? ['', ''];
  const participio = v.participio ?? '';
  const aclaracion = reglaPerfectum(v);
  if (contexto.repeticiones === 0) return completarParticipio(e, v.inf, participio, perf, aclaracion);
  const forma = elegirForma(
    contexto.azar,
    contexto.formas,
    [
      ['completar', 4],
      ['opcion', v.aux === 'zijn' ? 3 : 1],
      ['traducir', 2],
      ['decir', 1],
    ],
    'completar',
  );
  if (forma === 'opcion') return elegirAuxiliar(e, perf, aclaracion, contexto) ?? completarParticipio(e, v.inf, participio, perf, aclaracion);
  if (forma === 'traducir') return traducirFrase(e, perf, v.perfOtras ?? [], 'verbos.perfectum.traducir', `En perfectum, con «${v.inf}».`, aclaracion);
  if (forma === 'decir') return decirFrase(e, perf, 'verbos.perfectum.decir', `En perfectum, con «${v.inf}».`, aclaracion);
  return completarParticipio(e, v.inf, participio, perf, aclaracion);
}

function ejercicioPasado(e: Verbo, v: DatosVerbo, contexto: ContextoEjercicio): Ejercicio {
  const [singular, plural] = v.pasado ?? ['', ''];
  const [nl, es] = v.pasadoEj ?? ['', ''];
  const aclaracion = `${v.inf}: ${singular.replaceAll('/', ' o ')} en singular, ${plural.replaceAll('/', ' o ')} en plural${v.participio ? ` (perfectum: ${v.participio})` : ''}. ${REGLA_PASADO}`;
  const palabras = nl.split(/\s+/);
  const enSingular = alternativas(singular).find((f) => palabras.includes(f));
  const enPlural = alternativas(plural).find((f) => palabras.includes(f));
  const usada = enSingular ?? enPlural ?? primera(singular);
  const respuestas = enSingular ? alternativas(singular) : alternativas(plural);

  const forma =
    contexto.repeticiones === 0
      ? 'completar'
      : elegirForma(
          contexto.azar,
          contexto.formas,
          [
            ['completar', 4],
            ['opcion', 1],
            ['traducir', 2],
          ],
          'completar',
        );
  if (forma === 'opcion') {
    // El presente solo si sale de los datos (formas o raíz): sin ellos, formasPresente inventaría «schrijvent».
    // Nada de lo que también vale (wilde/wou): sería una opción mala que es buena.
    const presente = v.presente ?? (v.raiz ? formasPresente(v) : undefined);
    const distractores = [primera(singular), primera(plural), v.participio ?? '', presente ? primera(formaDe(presente, enSingular ? 2 : 3)) : ''].filter(
      (d) => d !== '' && !respuestas.includes(d),
    );
    return {
      forma: 'opcion',
      tipo: 'verbos.pasado.elegir',
      elementoId: e.id,
      instruccion: `Elige el pasado de «${v.inf}»`,
      enunciado: comoFrase(palabras.map((p) => (p === usada ? '___' : p)).join(' ')),
      enunciadoEnIdioma: true,
      opciones: opcionesCon(usada, contexto.azar.barajar(distractores), contexto.azar, 4),
      opcionesEnIdioma: true,
      respuestaCorrecta: usada,
      audio: comoFrase(nl),
      aclaracion,
    };
  }
  if (forma === 'traducir') return traducirFrase(e, [nl, es], v.pasadoOtras ?? [], 'verbos.pasado.traducir', `En pasado simple, con «${v.inf}».`, aclaracion);
  const h = hueco(nl, usada) ?? { antes: comoFrase(nl), despues: '' };
  return {
    forma: 'completar',
    tipo: 'verbos.pasado.completar',
    elementoId: e.id,
    instruccion: 'Completa en pasado simple',
    antes: h.antes,
    despues: h.despues,
    pista: v.inf,
    significado: es,
    respuestas,
    audio: comoFrase(nl),
    aclaracion,
  };
}

/** La frase de presente de un separable, como una frase de la pista de orden. */
export function fraseDeSeparable(s: DatosSeparable): Frase {
  const fichas = s.presente.split('|').map((f) => f.trim());
  const frase = comoFrase(fichas.join(' '));
  return {
    id: `separables:${s.inf}`,
    grupo: 'separables',
    fichas,
    frase,
    es: s.presenteEs,
    validas: [frase, ...(s.otras ?? []).map((o) => comoFrase(o))],
    pista: `Con «${s.inf}».`,
  };
}

function ejercicioSeparable(e: Verbo, s: DatosSeparable, contexto: ContextoEjercicio): Ejercicio {
  const aclaracion = `${s.inf}: ${comoFrase(s.presente.replaceAll('|', ' '))} En perfectum: ${s.aux === 'zijn' ? 'is' : 'heeft'} ${s.participio}. ${REGLA_SEPARABLES}`;
  const frase = fraseDeSeparable(s);
  const forma =
    contexto.repeticiones === 0
      ? 'ordenar'
      : elegirForma(
          contexto.azar,
          contexto.formas,
          [
            ['traducir', 3],
            ['completar', 2],
            ['ordenar', 1],
            ['decir', 1],
          ],
          'ordenar',
        );
  if (forma === 'completar') return completarParticipio(e, s.inf, s.participio, s.perf, aclaracion);
  return { ...ejercicioDeFrase(frase, forma, contexto, 'verbos.separables'), elementoId: e.id, aclaracion };
}

function crearElementos(): Verbo[] {
  const presente: Verbo[] = VERBOS.filter((v) => v.comp !== undefined).map((v) => ({ id: `presente:${v.inf}`, grupo: 'presente', verbo: v }));
  const perfectum: Verbo[] = VERBOS.filter((v) => v.participio && v.perf && !v.irregular).map((v) => ({ id: `perfectum:${v.inf}`, grupo: 'perfectum', verbo: v }));
  const irregular: Verbo[] = VERBOS.filter((v) => v.participio && v.perf && v.irregular).map((v) => ({ id: `perfectum-irregular:${v.inf}`, grupo: 'perfectum-irregular', verbo: v }));
  const separables: Verbo[] = SEPARABLES.map((s) => ({ id: `separables:${s.inf}`, grupo: 'separables', separable: s }));
  const pasado: Verbo[] = VERBOS.filter((v) => v.pasado && v.pasadoEj).map((v) => ({ id: `pasado:${v.inf}`, grupo: 'pasado', verbo: v }));
  return [...presente, ...perfectum, ...irregular, ...separables, ...pasado];
}

export const ELEMENTOS_VERBOS: readonly Verbo[] = crearElementos();

/** El primer elemento de cada grupo, que es el que lo abre. */
const ABRE_GRUPO = new Set(GRUPOS_VERBOS.map((g) => ELEMENTOS_VERBOS.find((e) => e.grupo === g)?.id));

/** Si sus formas salen de la regla del grupo (el presente regular y el participio regular). */
function saleDeLaRegla(e: Verbo): boolean {
  if (!e.verbo) return false;
  if (e.grupo === 'presente') return e.verbo.presente === undefined;
  return e.grupo === 'perfectum';
}

export const verbos: Pista<Verbo> = {
  id: 'verbos',
  nombre: 'Verbos',
  descripcion: 'Conjugar sin pensarlo: presente, perfectum con hebben o zijn, separables y pasado simple.',
  grupos: GRUPOS_VERBOS,
  nombresDeGrupo: NOMBRES_GRUPO_VERBOS,
  elementos: ELEMENTOS_VERBOS,
  crearEjercicio(e, contexto) {
    if (e.separable) return ejercicioSeparable(e, e.separable, contexto);
    const v = e.verbo as DatosVerbo;
    if (e.grupo === 'presente') return ejercicioPresente(e, v, contexto);
    if (e.grupo === 'pasado') return ejercicioPasado(e, v, contexto);
    return ejercicioPerfectum(e, v, contexto);
  },
  // Lo regular se intenta sin verlo antes: su regla se presenta con el verbo que abre el grupo y se
  // repite al corregir. Lo irregular, los separables y el pasado sí se enseñan, porque no se deducen.
  presentar(e): Presentacion | null {
    if (!saleDeLaRegla(e)) return presentacionDe(e);
    if (!ABRE_GRUPO.has(e.id)) return null;
    return { ...presentacionDe(e), etiqueta: `Regla nueva: ${NOMBRES_GRUPO_VERBOS[e.grupo]}` };
  },
};

function presentacionDe(e: Verbo): Presentacion {
  if (e.separable) {
    const s = e.separable;
    return {
      principal: s.inf,
      significado: s.es,
      nota: null,
      audio: comoFrase(s.presente.replaceAll('|', ' ')),
      detalle: REGLA_SEPARABLES,
      tabla: [
        ['presente', comoFrase(s.presente.replaceAll('|', ' '))],
        ['perfectum', comoFrase(s.perf[0])],
      ],
    };
  }
  const v = e.verbo as DatosVerbo;
  if (e.grupo === 'presente') {
    return { principal: v.inf, significado: v.es, nota: v.nota ?? null, detalle: REGLA_PRESENTE, tabla: tablaPresente(v) };
  }
  if (e.grupo === 'pasado') {
    const [singular, plural] = v.pasado ?? ['', ''];
    const tabla: (readonly [string, string])[] = [
      ['ik, jij, hij', singular.replaceAll('/', ' / ')],
      ['wij, jullie, zij', plural.replaceAll('/', ' / ')],
    ];
    if (v.participio) tabla.push(['perfectum', `${v.aux === 'zijn' ? 'is' : 'heeft'} ${v.participio}`]);
    return { principal: v.inf, significado: v.es, nota: v.nota ?? null, audio: comoFrase(v.pasadoEj?.[0] ?? ''), detalle: REGLA_PASADO, tabla };
  }
  return {
    principal: `${v.inf} → ${v.aux === 'zijn' ? 'is' : 'heeft'} ${v.participio ?? ''}`,
    significado: v.es,
    nota: v.nota ?? null,
    audio: comoFrase(v.perf?.[0] ?? ''),
    detalle: v.irregular ? REGLA_IRREGULAR : REGLA_PERFECTUM,
    tabla: [['ejemplo', comoFrase(v.perf?.[0] ?? '')]],
  };
}
